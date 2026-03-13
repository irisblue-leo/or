import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { authenticateUser } from "@/lib/auth";
import { ok, err, unauthorized } from "@/lib/resp";

/** GET /api/usage — query usage logs */
export async function GET(req: NextRequest) {
  const user = await authenticateUser(req);
  if (!user) return unauthorized();

  const { searchParams } = new URL(req.url);
  const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "20")));
  const modelId = searchParams.get("modelId");
  const startDate = searchParams.get("start");
  const endDate = searchParams.get("end");

  const where: Record<string, unknown> = { userId: user.id };
  if (modelId) where.modelId = modelId;
  if (startDate || endDate) {
    where.createdAt = {
      ...(startDate && { gte: new Date(startDate) }),
      ...(endDate && { lte: new Date(endDate) }),
    };
  }

  const [logs, total] = await Promise.all([
    prisma.usageLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
      include: { model: { select: { name: true, provider: true } }, apiKey: { select: { name: true } } },
    }),
    prisma.usageLog.count({ where }),
  ]);

  return ok({ logs, total, page, limit });
}
