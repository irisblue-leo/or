import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { authenticateUser } from "@/lib/auth";
import { ok, unauthorized } from "@/lib/resp";

/**
 * GET /api/transactions
 * Get user transaction history
 */
export async function GET(req: NextRequest) {
  const user = await authenticateUser(req);
  if (!user) return unauthorized();

  const { searchParams } = new URL(req.url);
  const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
  const limit = Math.min(100, parseInt(searchParams.get("limit") || "20"));
  const type = searchParams.get("type"); // topup | deduct | refund

  const where: Record<string, unknown> = { userId: user.id };
  if (type) where.type = type;

  const [transactions, total] = await Promise.all([
    prisma.transaction.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.transaction.count({ where }),
  ]);

  return ok({
    transactions,
    total,
    page,
    limit,
    pages: Math.ceil(total / limit),
  });
}
