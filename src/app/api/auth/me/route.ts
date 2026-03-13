import { NextRequest } from "next/server";
import { authenticateUser } from "@/lib/auth";
import { ok, unauthorized } from "@/lib/resp";

/** GET /api/auth/me — get current user */
export async function GET(req: NextRequest) {
  const user = await authenticateUser(req);
  if (!user) return unauthorized();
  return ok({ id: user.id, email: user.email, name: user.name, role: user.role, balance: user.balance, createdAt: user.createdAt });
}
