import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { authenticateAdmin } from "@/lib/auth";
import { ok, err, unauthorized, notFound } from "@/lib/resp";

/** GET /api/admin/providers — list all upstream providers */
export async function GET(req: NextRequest) {
  const admin = await authenticateAdmin(req);
  if (!admin) return unauthorized("Admin access required");

  const { searchParams } = new URL(req.url);
  const limit = Math.min(100, parseInt(searchParams.get("limit") || "100"));
  const offset = Math.max(0, parseInt(searchParams.get("offset") || "0"));

  const [providers, total] = await Promise.all([
    prisma.upstreamProvider.findMany({
      orderBy: { priority: "desc" },
      include: { _count: { select: { models: true } } },
      skip: offset,
      take: limit
    }),
    prisma.upstreamProvider.count()
  ]);
  
  return ok({ providers, total, limit, offset });
}

/** POST /api/admin/providers — create upstream provider */
export async function POST(req: NextRequest) {
  const admin = await authenticateAdmin(req);
  if (!admin) return unauthorized("Admin access required");

  const { name, slug, apiUrl, apiKey, priceMultiplier, priority, notes } = await req.json();
  if (!name || !slug || !apiUrl || !apiKey) return err("name, slug, apiUrl, apiKey required");

  const existing = await prisma.upstreamProvider.findUnique({ where: { slug } });
  if (existing) return err("Provider with this slug already exists");

  const provider = await prisma.upstreamProvider.create({
    data: {
      name,
      slug,
      apiUrl,
      apiKey,
      priceMultiplier: priceMultiplier || 1.25,
      priority: priority || 0,
      notes: notes || null,
    },
  });
  return ok(provider, 201);
}

/** PATCH /api/admin/providers — update upstream provider */
export async function PATCH(req: NextRequest) {
  const admin = await authenticateAdmin(req);
  if (!admin) return unauthorized("Admin access required");

  const { id, ...updates } = await req.json();
  if (!id) return err("id required");

  const existing = await prisma.upstreamProvider.findUnique({ where: { id } });
  if (!existing) return notFound("Provider not found");

  const provider = await prisma.upstreamProvider.update({ where: { id }, data: updates });
  return ok(provider);
}

/** DELETE /api/admin/providers — delete upstream provider */
export async function DELETE(req: NextRequest) {
  const admin = await authenticateAdmin(req);
  if (!admin) return unauthorized("Admin access required");

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return err("id required");

  // Check if any models are using this provider
  const modelCount = await prisma.model.count({ where: { providerId: id } });
  if (modelCount > 0) return err(`Cannot delete: ${modelCount} models are using this provider`);

  await prisma.upstreamProvider.delete({ where: { id } });
  return ok({ deleted: true });
}
