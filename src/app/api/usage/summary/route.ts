import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { authenticateUser } from "@/lib/auth";
import { ok, unauthorized } from "@/lib/resp";

/** GET /api/usage/summary — aggregated usage stats */
export async function GET(req: NextRequest) {
  const user = await authenticateUser(req);
  if (!user) return unauthorized();

  const { searchParams } = new URL(req.url);
  const days = parseInt(searchParams.get("days") || "30");
  const since = new Date(Date.now() - days * 86400000);

  const logs = await prisma.usageLog.findMany({
    where: { userId: user.id, createdAt: { gte: since } },
    include: { model: { select: { name: true } } },
  });

  let totalCost = 0;
  let totalInput = 0;
  let totalOutput = 0;
  let totalRequests = logs.length;
  const byModel: Record<string, { requests: number; inputTokens: number; outputTokens: number; cost: number }> = {};
  const byDay: Record<string, { requests: number; cost: number }> = {};

  for (const log of logs) {
    totalCost += log.cost;
    totalInput += log.inputTokens;
    totalOutput += log.outputTokens;

    const mName = log.model.name;
    if (!byModel[mName]) byModel[mName] = { requests: 0, inputTokens: 0, outputTokens: 0, cost: 0 };
    byModel[mName].requests++;
    byModel[mName].inputTokens += log.inputTokens;
    byModel[mName].outputTokens += log.outputTokens;
    byModel[mName].cost += log.cost;

    const day = log.createdAt.toISOString().slice(0, 10);
    if (!byDay[day]) byDay[day] = { requests: 0, cost: 0 };
    byDay[day].requests++;
    byDay[day].cost += log.cost;
  }

  return ok({
    days,
    totalRequests,
    totalInputTokens: totalInput,
    totalOutputTokens: totalOutput,
    totalCost: Math.round(totalCost * 1e6) / 1e6,
    byModel,
    byDay,
    balance: user.balance,
  });
}
