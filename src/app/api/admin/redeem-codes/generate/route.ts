import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { authenticateAdmin } from "@/lib/auth";
import { ok, err, unauthorized } from "@/lib/resp";
import { generateRedeemCode } from "@/lib/redeem";

/**
 * POST /api/admin/redeem-codes/generate
 * Generate redeem codes in batch
 */
export async function POST(req: NextRequest) {
  const admin = await authenticateAdmin(req);
  if (!admin) return unauthorized("Admin access required");

  const { count, amount, expiresInDays } = await req.json();

  if (!count || count < 1 || count > 1000) {
    return err("count must be between 1 and 1000");
  }
  if (!amount || amount <= 0) {
    return err("amount must be positive");
  }

  const expiresAt = expiresInDays
    ? new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000)
    : null;

  const codes = [];
  for (let i = 0; i < count; i++) {
    let code = generateRedeemCode();
    // Ensure uniqueness
    while (await prisma.redeemCode.findUnique({ where: { code } })) {
      code = generateRedeemCode();
    }
    codes.push(code);
  }

  const created = await prisma.redeemCode.createMany({
    data: codes.map((code) => ({
      code,
      amount,
      createdById: admin.id,
      expiresAt,
    })),
  });

  return ok({ created: created.count, codes });
}
