import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { ok, err } from "@/lib/resp";
import { generateVerificationCode, sendVerificationCodeEmail } from "@/lib/email";

/** POST /api/auth/send-code - 发送验证码 */
export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();
    if (!email) return err("邮箱不能为空", 400);

    // 检查邮箱是否已注册
    const exists = await prisma.user.findUnique({ where: { email } });
    if (exists) return err("该邮箱已被注册", 409);

    // 生成 6 位验证码
    const code = generateVerificationCode();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10分钟后过期

    // 存储验证码（使用临时表或 Redis，这里简化使用数据库）
    // 先删除该邮箱的旧验证码
    await prisma.verificationCode.deleteMany({
      where: { email },
    });

    // 创建新验证码
    await prisma.verificationCode.create({
      data: {
        email,
        code,
        expiresAt,
      },
    });

    // 发送验证码邮件
    try {
      await sendVerificationCodeEmail(email, code);
    } catch (emailError) {
      console.error('Failed to send verification code:', emailError);
      return err("验证码发送失败，请稍后重试", 500);
    }

    return ok({ message: "验证码已发送，请查收邮件" });
  } catch (e: unknown) {
    return err("发送验证码失败: " + (e instanceof Error ? e.message : String(e)), 500);
  }
}
