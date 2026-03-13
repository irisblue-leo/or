import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { ok, err } from "@/lib/resp";
import { isValidRedeemCodeFormat } from "@/lib/redeem";

/**
 * GET /api/redeem-codes/verify?code=XXX
 * Verify if a redeem code is valid (without redeeming it)
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get("code");

  if (!code || !isValidRedeemCodeFormat(code)) {
    return err("Invalid redeem code format");
  }

  const redeemCode = await prisma.redeemCode.findUnique({
    where: { code: code.toUpperCase() },
    select: {
      id: true,
      amount: true,
      status: true,
      expiresAt: true,
    },
  });

  if (!redeemCode) {
    return ok({ valid: false, reason: "Code not found" });
  }

  if (redeemCode.status !== "unused") {
    return ok({ valid: false, reason: "Code already used or expired" });
  }

  if (redeemCode.expiresAt && redeemCode.expiresAt < new Date()) {
    return ok({ valid: false, reason: "Code has expired" });
  }

  return ok({
    valid: true,
    amount: redeemCode.amount,
    expiresAt: redeemCode.expiresAt,
  });
}
