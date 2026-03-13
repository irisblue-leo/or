import { NextRequest } from "next/server";
import { v4 as uuidv4 } from "uuid";
import { prisma } from "@/lib/prisma";
import { authenticateUser } from "@/lib/auth";
import { ok, err, unauthorized, notFound } from "@/lib/resp";

/** GET /api/keys — list user's API keys */
export async function GET(req: NextRequest) {
  const user = await authenticateUser(req);
  if (!user) return unauthorized();

  const keys = await prisma.apiKey.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    select: { id: true, key: true, name: true, active: true, createdAt: true },
  });
  return ok(keys);
}

/** POST /api/keys — create a new API key */
export async function POST(req: NextRequest) {
  const user = await authenticateUser(req);
  if (!user) return unauthorized();

  const body = await req.json().catch(() => ({}));
  const name = body.name || "Default";
  const key = "sk-relay-" + uuidv4().replace(/-/g, "");

  const apiKey = await prisma.apiKey.create({
    data: { key, name, userId: user.id },
    select: { id: true, key: true, name: true, active: true, createdAt: true },
  });
  return ok(apiKey, 201);
}

/** PATCH /api/keys — update key (toggle active, rename) */
export async function PATCH(req: NextRequest) {
  const user = await authenticateUser(req);
  if (!user) return unauthorized();

  const { id, name, active } = await req.json();
  if (!id) return err("id required");

  const existing = await prisma.apiKey.findFirst({ where: { id, userId: user.id } });
  if (!existing) return notFound("API key not found");

  const updated = await prisma.apiKey.update({
    where: { id },
    data: {
      ...(name !== undefined && { name }),
      ...(active !== undefined && { active }),
    },
    select: { id: true, key: true, name: true, active: true, createdAt: true },
  });
  return ok(updated);
}

/** DELETE /api/keys — delete a key */
export async function DELETE(req: NextRequest) {
  const user = await authenticateUser(req);
  if (!user) return unauthorized();

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return err("id required");

  const existing = await prisma.apiKey.findFirst({ where: { id, userId: user.id } });
  if (!existing) return notFound("API key not found");

  await prisma.apiKey.delete({ where: { id } });
  return ok({ deleted: true });
}
