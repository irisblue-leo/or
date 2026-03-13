import { NextRequest } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { signToken } from "@/lib/auth";
import { ok, err, unauthorized } from "@/lib/resp";

/** POST /api/auth/login */
export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();
    if (!email || !password) return err("email and password required");

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return unauthorized("Invalid credentials");

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return unauthorized("Invalid credentials");

    const token = signToken({ userId: user.id, email: user.email, role: user.role });
    return ok({ token, user: { id: user.id, email: user.email, name: user.name, role: user.role, balance: user.balance } });
  } catch (e: unknown) {
    return err("Login failed: " + (e instanceof Error ? e.message : String(e)), 500);
  }
}
