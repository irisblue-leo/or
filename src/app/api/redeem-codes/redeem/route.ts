import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { authenticateUser } from "@/lib/auth";
import { ok, err, unauthorized } from "@/lib/resp";
import { isValidRedeemCodeFormat } from "@/lib/redeem";

/**
 * POST /api/redeem-codes/redeem
 * Redeem a code and add credits to user balance
 */
export async function POST(req: NextRequest) {
  const user = await authenticateUser(req);
  if (!user) return unauthorized();

  const { code } = await req.json();
  if (!code || !isValidRedeemCodeFormat(code)) {
    return err("Invalid redeem code format");
  }

  // Find code
  const redeemCode = await prisma.redeemCode.findUnique({
    where: { code: code.toUpperCase() },
  });

  if (!redeemCode) {
    return err("Redeem code not found");
  }

  if (redeemCode.status !== "unused") {
    return err("Redeem code already used or expired");
  }

  if (redeemCode.expiresAt && redeemCode.expiresAt < new Date()) {
    await prisma.redeemCode.update({
      where: { id: redeemCode.id },
      data: { status: "expired" },
    });
    return err("Redeem code has expired");
  }

  // Redeem: update user balance, mark code as used, create transaction
  const [updatedUser, updatedCode, transaction] = await prisma.$transaction([
    prisma.user.update({
      where: { id: user.id },
      data: { balance: { increment: redeemCode.amount } },
    }),
    prisma.redeemCode.update({
      where: { id: redeemCode.id },
      data: {
        status: "used",
        usedById: user.id,
        usedAt: new Date(),
      },
    }),
    prisma.transaction.create({
      data: {
        userId: user.id,
        type: "topup",
        amount: redeemCode.amount,
        note: `Redeemed code: ${code}`,
      },
    }),
  ]);

  return ok({
    success: true,
    amount: redeemCode.amount,
    newBalance: updatedUser.balance,
    transaction,
  });
}
