import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { ok, err } from "@/lib/resp";

/** GET /api/auth/verify-email?token=xxx */
export async function GET(req: NextRequest) {
  try {
    const token = req.nextUrl.searchParams.get('token');
    if (!token) return err("验证令牌缺失", 400);

    const user = await prisma.user.findFirst({
      where: {
        verificationToken: token,
        tokenExpiresAt: {
          gt: new Date(),
        },
      },
    });

    if (!user) {
      return err("验证令牌无效或已过期", 400);
    }

    if (user.emailVerified) {
      return ok({ message: "邮箱已经验证过了" });
    }

    await prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerified: true,
        verificationToken: null,
        tokenExpiresAt: null,
      },
    });

    return ok({ message: "邮箱验证成功" });
  } catch (e: unknown) {
    return err("验证失败: " + (e instanceof Error ? e.message : String(e)), 500);
  }
}
