import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/relay/v1/models
 * OpenAI-compatible models list endpoint
 * Returns list of available models in OpenAI format
 * Filters models based on user's aggregator preference
 */
export async function GET(req: NextRequest) {
  // Authenticate by API key
  const auth = req.headers.get("authorization");
  let user = null;
  let userAggregator = "default";
  
  if (auth?.startsWith("Bearer ")) {
    const key = auth.slice(7);
    const apiKey = await prisma.apiKey.findUnique({
      where: { key },
      include: { user: true },
    });
    if (apiKey && apiKey.active) {
      user = apiKey.user;
      userAggregator = user.preferredAggregator || "default";
    }
  }

  // Fetch active models
  let models = await prisma.model.findMany({
    where: { active: true },
    orderBy: { name: "asc" },
  });

  // Filter models based on user's aggregator
  if (userAggregator === "default") {
    // 默认聚合器：只返回 GPT-4o 和 Claude 3.5 Sonnet
    const allowedModels = ["gpt-4o", "GPT-4o", "claude-3.5-sonnet", "Claude 3.5 Sonnet"];
    models = models.filter((m) => allowedModels.includes(m.name));
  } else if (userAggregator === "302ai") {
    // 302.ai 聚合器：只返回 302.ai 的模型
    models = models.filter((m) => m.upstreamProvider === "302ai");
  }
  // OpenRouter 聚合器：返回所有模型

  // Add "auto" model if user has smart model enabled
  const data = models.map((m) => ({
    id: m.name,
    object: "model",
    created: Math.floor(new Date().getTime() / 1000),
    owned_by: m.provider,
    permission: [],
    root: m.name,
    parent: null,
  }));

  // Add "auto" model if user has smart model enabled
  if (user?.enableSmartModel) {
    data.unshift({
      id: "auto",
      object: "model",
      created: Math.floor(new Date().getTime() / 1000),
      owned_by: "openclaw-relay",
      permission: [],
      root: "auto",
      parent: null,
    });
  }

  return new Response(
    JSON.stringify({
      object: "list",
      data,
    }),
    {
      status: 200,
      headers: { "Content-Type": "application/json" },
    }
  );
}
