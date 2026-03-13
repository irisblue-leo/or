import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { ok, err } from "@/lib/resp";
import { generateVerificationToken, sendVerificationEmail } from "@/lib/email";
import { verifyToken } from "@/lib/auth";

/** POST /api/auth/resend-verification */
export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return err("未授权", 401);
    }

    const token = authHeader.substring(7);
    const payload = verifyToken(token);
    if (!payload) {
      return err("无效的令牌", 401);
    }

    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
    });

    if (!user) {
      return err("用户不存在", 404);
    }

    if (user.emailVerified) {
      return ok({ message: "邮箱已经验证过了" });
    }

    const verificationToken = generateVerificationToken();
    const tokenExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        verificationToken,
        tokenExpiresAt,
      },
    });

    await sendVerificationEmail(user.email, verificationToken);

    return ok({ message: "验证邮件已重新发送" });
  } catch (e: unknown) {
    return err("发送失败: " + (e instanceof Error ? e.message : String(e)), 500);
  }
}
