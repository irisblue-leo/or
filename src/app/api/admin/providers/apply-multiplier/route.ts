import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { authenticateAdmin } from "@/lib/auth";
import { ok, err, unauthorized } from "@/lib/resp";

/** POST /api/admin/providers/apply-multiplier — apply multiplier to recalculate prices */
export async function POST(req: NextRequest) {
  const admin = await authenticateAdmin(req);
  if (!admin) return unauthorized("Admin access required");

  const { providerId, modelId, multiplier } = await req.json();

  // Apply to single model
  if (modelId) {
    const model = await prisma.model.findUnique({ where: { id: modelId } });
    if (!model) return err("Model not found");

    const m = multiplier || model.priceMultiplier;
    const updated = await prisma.model.update({
      where: { id: modelId },
      data: {
        priceMultiplier: m,
        inputPrice: parseFloat((model.upstreamInput * m).toFixed(4)),
        outputPrice: parseFloat((model.upstreamOutput * m).toFixed(4)),
      },
    });
    return ok({ updated: 1, models: [updated] });
  }

  // Apply to all models under a provider
  if (providerId) {
    const provider = await prisma.upstreamProvider.findUnique({ where: { id: providerId } });
    if (!provider) return err("Provider not found");

    const m = multiplier || provider.priceMultiplier;

    // Update provider multiplier
    if (multiplier) {
      await prisma.upstreamProvider.update({
        where: { id: providerId },
        data: { priceMultiplier: m },
      });
    }

    // Update all models under this provider
    const models = await prisma.model.findMany({ where: { providerId } });
    const results = [];
    for (const model of models) {
      const updated = await prisma.model.update({
        where: { id: model.id },
        data: {
          priceMultiplier: m,
          inputPrice: parseFloat((model.upstreamInput * m).toFixed(4)),
          outputPrice: parseFloat((model.upstreamOutput * m).toFixed(4)),
        },
      });
      results.push(updated);
    }
    return ok({ updated: results.length, models: results });
  }

  // Apply to ALL models globally
  if (multiplier) {
    const models = await prisma.model.findMany();
    const results = [];
    for (const model of models) {
      const updated = await prisma.model.update({
        where: { id: model.id },
        data: {
          priceMultiplier: multiplier,
          inputPrice: parseFloat((model.upstreamInput * multiplier).toFixed(4)),
          outputPrice: parseFloat((model.upstreamOutput * multiplier).toFixed(4)),
        },
      });
      results.push(updated);
    }
    return ok({ updated: results.length, models: results });
  }

  return err("Provide modelId, providerId, or multiplier");
}
