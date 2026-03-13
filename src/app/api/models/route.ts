import { prisma } from "@/lib/prisma";
import { ok } from "@/lib/resp";

/** GET /api/models — public list of available models */
export async function GET() {
  const models = await prisma.model.findMany({
    where: { active: true },
    select: { id: true, name: true, provider: true, inputPrice: true, outputPrice: true },
    orderBy: { name: "asc" },
  });
  return ok(models);
}
