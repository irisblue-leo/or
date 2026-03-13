import { NextRequest } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { signToken } from "@/lib/auth";
import { ok, err } from "@/lib/resp";

/** POST /api/auth/register */
export async function POST(req: NextRequest) {
  try {
    const { email, password, name, code } = await req.json();
    if (!email || !password) return err("邮箱和密码不能为空", 400);
    if (!code) return err("验证码不能为空", 400);

    // 验证验证码
    const verificationRecord = await prisma.verificationCode.findFirst({
      where: {
        email,
        code,
        expiresAt: {
          gt: new Date(),
        },
      },
    });

    if (!verificationRecord) {
      return err("验证码无效或已过期", 400);
    }

    // 检查邮箱是否已注册
    const exists = await prisma.user.findUnique({ where: { email } });
    if (exists) return err("该邮箱已被注册", 409);

    // 创建用户
    const hashed = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: {
        email,
        password: hashed,
        name: name || null,
        emailVerified: true, // 验证码验证通过，直接设置为已验证
      },
    });

    // 删除已使用的验证码
    await prisma.verificationCode.delete({
      where: { id: verificationRecord.id },
    });

    const token = signToken({ userId: user.id, email: user.email, role: user.role });
    return ok({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        balance: user.balance,
        emailVerified: user.emailVerified,
      },
      message: '注册成功'
    }, 201);
  } catch (e: unknown) {
    return err("注册失败: " + (e instanceof Error ? e.message : String(e)), 500);
  }
}
