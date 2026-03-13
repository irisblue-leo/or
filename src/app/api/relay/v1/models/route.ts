import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/relay/v1/models
 * OpenAI-compatible models list endpoint
 * Returns list of available models in OpenAI format
 */
export async function GET(req: NextRequest) {
  // Optional: authenticate by API key
  const auth = req.headers.get("authorization");
  let authenticated = false;
  
  if (auth?.startsWith("Bearer ")) {
    const key = auth.slice(7);
    const apiKey = await prisma.apiKey.findUnique({
      where: { key },
      include: { user: true },
    });
    authenticated = !!apiKey && apiKey.active;
  }

  // Fetch active models
  const models = await prisma.model.findMany({
    where: { active: true },
    orderBy: { name: "asc" },
  });

  // Transform to OpenAI format
  const data = models.map((m) => ({
    id: m.name,
    object: "model",
    created: Math.floor(new Date().getTime() / 1000),
    owned_by: m.provider,
    permission: [],
    root: m.name,
    parent: null,
  }));

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
