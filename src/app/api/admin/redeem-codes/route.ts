import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { authenticateAdmin } from "@/lib/auth";
import { ok, unauthorized } from "@/lib/resp";

/**
 * GET /api/admin/redeem-codes
 * List redeem codes with filters
 */
export async function GET(req: NextRequest) {
  const admin = await authenticateAdmin(req);
  if (!admin) return unauthorized("Admin access required");

  const { searchParams } = new URL(req.url);
  const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
  const limit = Math.min(100, parseInt(searchParams.get("limit") || "50"));
  const status = searchParams.get("status");

  const where: Record<string, unknown> = {};
  if (status) where.status = status;

  const [codes, total] = await Promise.all([
    prisma.redeemCode.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
      include: {
        createdBy: {
          select: { id: true, email: true, name: true },
        },
        usedBy: {
          select: { id: true, email: true, name: true },
        },
      },
    }),
    prisma.redeemCode.count({ where }),
  ]);

  return ok({ codes, total, page, limit });
}

/**
 * DELETE /api/admin/redeem-codes
 * Expire/disable a redeem code
 */
export async function DELETE(req: NextRequest) {
  const admin = await authenticateAdmin(req);
  if (!admin) return unauthorized("Admin access required");

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return ok({ error: "id required" }, 400);

  const code = await prisma.redeemCode.update({
    where: { id },
    data: { status: "expired" },
  });

  return ok(code);
}
