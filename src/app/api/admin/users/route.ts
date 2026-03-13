import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { authenticateAdmin } from "@/lib/auth";
import { ok, err, unauthorized } from "@/lib/resp";

/** GET /api/admin/users — list all users */
export async function GET(req: NextRequest) {
  const admin = await authenticateAdmin(req);
  if (!admin) return unauthorized("Admin access required");

  const { searchParams } = new URL(req.url);
  const limit = Math.min(100, parseInt(searchParams.get("limit") || "20"));
  const offset = Math.max(0, parseInt(searchParams.get("offset") || "0"));

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      skip: offset,
      take: limit,
      select: { id: true, email: true, name: true, role: true, balance: true, createdAt: true, _count: { select: { usageLogs: true, apiKeys: true } } },
    }),
    prisma.user.count(),
  ]);

  return ok({ users, total, limit, offset });
}

/** PATCH /api/admin/users — update user (balance, role) */
export async function PATCH(req: NextRequest) {
  const admin = await authenticateAdmin(req);
  if (!admin) return unauthorized("Admin access required");

  const { userId, balance, role, name } = await req.json();
  if (!userId) return err("userId required");

  const data: Record<string, unknown> = {};
  if (balance !== undefined) data.balance = balance;
  if (role !== undefined) data.role = role;
  if (name !== undefined) data.name = name;

  const user = await prisma.user.update({
    where: { id: userId },
    data,
    select: { id: true, email: true, name: true, role: true, balance: true },
  });

  // Record balance change as transaction
  if (balance !== undefined) {
    await prisma.transaction.create({
      data: { userId, type: "topup", amount: balance, note: `Admin set balance to ${balance}` },
    });
  }

  return ok(user);
}
