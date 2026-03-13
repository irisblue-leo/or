import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { authenticateUser } from "@/lib/auth";
import { ok, err } from "@/lib/resp";

/** GET /api/redeem-codes/history - 获取用户的充值码兑换历史 */
export async function GET(req: NextRequest) {
  try {
    const user = await authenticateUser(req);
    if (!user) return err("Unauthorized", 401);

    const history = await prisma.redeemCode.findMany({
      where: {
        usedById: user.id,
        status: "used",
      },
      select: {
        id: true,
        code: true,
        amount: true,
        usedAt: true,
      },
      orderBy: {
        usedAt: "desc",
      },
    });

    return ok({
      history: history.map((item) => ({
        id: item.id,
        code: item.code,
        amount: item.amount,
        redeemedAt: item.usedAt,
      })),
    });
  } catch (e: unknown) {
    return err("Failed to fetch history: " + (e instanceof Error ? e.message : String(e)), 500);
  }
}
