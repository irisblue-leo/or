import jwt from "jsonwebtoken";
import { NextRequest } from "next/server";
import { prisma } from "./prisma";

const JWT_SECRET = process.env.JWT_SECRET || "openclaw-relay-secret";
const JWT_EXPIRES = "7d";

export interface JwtPayload {
  userId: string;
  email: string;
  role: string;
}

export function signToken(payload: JwtPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES });
}

export function verifyToken(token: string): JwtPayload {
  return jwt.verify(token, JWT_SECRET) as JwtPayload;
}

/** Extract Bearer token from request */
export function extractToken(req: NextRequest): string | null {
  const auth = req.headers.get("authorization");
  if (auth?.startsWith("Bearer ")) return auth.slice(7);
  return null;
}

/** Auth guard — returns user payload or null */
export async function authenticate(req: NextRequest): Promise<JwtPayload | null> {
  const token = extractToken(req);
  if (!token) return null;
  try {
    return verifyToken(token);
  } catch {
    return null;
  }
}

/** Auth guard that also verifies user exists in DB */
export async function authenticateUser(req: NextRequest) {
  const payload = await authenticate(req);
  if (!payload) return null;
  const user = await prisma.user.findUnique({ where: { id: payload.userId } });
  if (!user) return null;
  return user;
}

/** Require admin role */
export async function authenticateAdmin(req: NextRequest) {
  const user = await authenticateUser(req);
  if (!user || user.role !== "admin") return null;
  return user;
}
