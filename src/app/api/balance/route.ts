import { NextRequest } from "next/server";
import { authenticateUser } from "@/lib/auth";
import { ok, unauthorized } from "@/lib/resp";

/**
 * GET /api/balance
 * Get current user balance
 */
export async function GET(req: NextRequest) {
  const user = await authenticateUser(req);
  if (!user) return unauthorized();

  return ok({
    balance: user.balance,
    currency: "USD",
    userId: user.id,
    email: user.email,
  });
}
