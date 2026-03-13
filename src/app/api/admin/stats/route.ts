import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { authenticateAdmin } from "@/lib/auth";
import { ok, unauthorized } from "@/lib/resp";

/** GET /api/admin/stats — revenue & usage overview */
export async function GET(req: NextRequest) {
  const admin = await authenticateAdmin(req);
  if (!admin) return unauthorized("Admin access required");

  const { searchParams } = new URL(req.url);
  const days = parseInt(searchParams.get("days") || "30");
  const since = new Date(Date.now() - days * 86400000);

  const [totalUsers, totalKeys, logs] = await Promise.all([
    prisma.user.count(),
    prisma.apiKey.count(),
    prisma.usageLog.findMany({
      where: { createdAt: { gte: since } },
      include: { model: { select: { name: true } } },
    }),
  ]);

  let totalRevenue = 0;
  let totalUpstreamCost = 0;
  let totalRequests = logs.length;
  let totalInputTokens = 0;
  let totalOutputTokens = 0;

  for (const log of logs) {
    totalRevenue += log.cost;
    totalUpstreamCost += log.upstreamCost;
    totalInputTokens += log.inputTokens;
    totalOutputTokens += log.outputTokens;
  }

  const profit = totalRevenue - totalUpstreamCost;

  return ok({
    days,
    totalUsers,
    totalKeys,
    totalRequests,
    totalInputTokens,
    totalOutputTokens,
    totalRevenue: Math.round(totalRevenue * 1e6) / 1e6,
    totalUpstreamCost: Math.round(totalUpstreamCost * 1e6) / 1e6,
    profit: Math.round(profit * 1e6) / 1e6,
  });
}
