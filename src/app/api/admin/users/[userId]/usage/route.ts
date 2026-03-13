import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { authenticateUser } from "@/lib/auth";
import { ok, err, unauthorized } from "@/lib/resp";

/**
 * GET /api/admin/users/[userId]/usage
 * Get user usage summary (admin only)
 */
export async function GET(
  req: NextRequest,
  context: { params: Promise<{ userId: string }> }
) {
  const user = await authenticateUser(req);
  if (!user || user.role !== "admin") return unauthorized();

  const { userId } = await context.params;
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  try {
    // Get usage logs for the last 30 days
    const usageLogs = await prisma.usageLog.findMany({
      where: {
        userId,
        createdAt: { gte: thirtyDaysAgo },
      },
      include: {
        model: true,
      },
      orderBy: { createdAt: "desc" },
    });

    // Calculate summary
    const totalCost = usageLogs.reduce((sum, log) => sum + log.cost, 0);
    const totalInputTokens = usageLogs.reduce((sum, log) => sum + log.inputTokens, 0);
    const totalOutputTokens = usageLogs.reduce((sum, log) => sum + log.outputTokens, 0);
    const totalRequests = usageLogs.length;

    // Group by model
    const byModel: Record<string, any> = {};
    for (const log of usageLogs) {
      const modelName = log.model.name;
      if (!byModel[modelName]) {
        byModel[modelName] = {
          modelName,
          requests: 0,
          cost: 0,
          inputTokens: 0,
          outputTokens: 0,
        };
      }
      byModel[modelName].requests++;
      byModel[modelName].cost += log.cost;
      byModel[modelName].inputTokens += log.inputTokens;
      byModel[modelName].outputTokens += log.outputTokens;
    }

    return ok({
      totalCost,
      totalInputTokens,
      totalOutputTokens,
      totalRequests,
      byModel: Object.values(byModel).sort((a: any, b: any) => b.cost - a.cost),
    });
  } catch (error) {
    console.error("[admin/users/usage] Error:", error);
    return err("Failed to fetch user usage", 500);
  }
}
