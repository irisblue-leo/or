import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { authenticateAdmin } from "@/lib/auth";
import { ok, err, unauthorized, notFound } from "@/lib/resp";

/** GET /api/admin/models — list all models */
export async function GET(req: NextRequest) {
  const admin = await authenticateAdmin(req);
  if (!admin) return unauthorized("Admin access required");

  const { searchParams } = new URL(req.url);
  const limit = Math.min(100, parseInt(searchParams.get("limit") || "100"));
  const offset = Math.max(0, parseInt(searchParams.get("offset") || "0"));

  const [models, total] = await Promise.all([
    prisma.model.findMany({ 
      orderBy: { name: "asc" },
      skip: offset,
      take: limit
    }),
    prisma.model.count()
  ]);
  
  return ok({ models, total, limit, offset });
}

/** POST /api/admin/models — create model */
export async function POST(req: NextRequest) {
  const admin = await authenticateAdmin(req);
  if (!admin) return unauthorized("Admin access required");

  const { name, provider, upstreamProvider, upstreamModelId, inputPrice, outputPrice, upstreamInput, upstreamOutput } = await req.json();
  if (!name || !provider) return err("name and provider required");

  const model = await prisma.model.create({
    data: {
      name,
      provider,
      upstreamProvider: upstreamProvider || provider,
      upstreamModelId: upstreamModelId || null,
      inputPrice: inputPrice || 0,
      outputPrice: outputPrice || 0,
      upstreamInput: upstreamInput || 0,
      upstreamOutput: upstreamOutput || 0,
    },
  });
  return ok(model, 201);
}

/** PATCH /api/admin/models — update model */
export async function PATCH(req: NextRequest) {
  const admin = await authenticateAdmin(req);
  if (!admin) return unauthorized("Admin access required");

  const { id, ...updates } = await req.json();
  if (!id) return err("id required");

  const existing = await prisma.model.findUnique({ where: { id } });
  if (!existing) return notFound("Model not found");

  const model = await prisma.model.update({ where: { id }, data: updates });
  return ok(model);
}

/** DELETE /api/admin/models — delete model */
export async function DELETE(req: NextRequest) {
  const admin = await authenticateAdmin(req);
  if (!admin) return unauthorized("Admin access required");

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return err("id required");

  await prisma.model.delete({ where: { id } });
  return ok({ deleted: true });
}
