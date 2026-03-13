import { NextRequest } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { signToken } from "@/lib/auth";
import { ok, err } from "@/lib/resp";
import { generateVerificationToken, sendVerificationEmail } from "@/lib/email";

/** POST /api/auth/register */
export async function POST(req: NextRequest) {
  try {
    const { email, password, name } = await req.json();
    if (!email || !password) return err("email and password required");

    const exists = await prisma.user.findUnique({ where: { email } });
    if (exists) return err("Email already registered", 409);

    const hashed = await bcrypt.hash(password, 10);
    const verificationToken = generateVerificationToken();
    const tokenExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24小时后过期

    const user = await prisma.user.create({
      data: {
        email,
        password: hashed,
        name: name || null,
        verificationToken,
        tokenExpiresAt,
        emailVerified: false,
      },
    });

    // 发送验证邮件
    try {
      await sendVerificationEmail(email, verificationToken);
    } catch (emailError) {
      console.error('Failed to send verification email:', emailError);
      // 即使邮件发送失败，也允许用户注册成功
    }

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
      message: '注册成功，请查收验证邮件'
    }, 201);
  } catch (e: unknown) {
    return err("Registration failed: " + (e instanceof Error ? e.message : String(e)), 500);
  }
}
