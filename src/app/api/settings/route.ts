import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { authenticateUser } from "@/lib/auth";
import { ok, err, unauthorized } from "@/lib/resp";

/**
 * GET /api/settings
 * Get user settings
 */
export async function GET(req: NextRequest) {
  const user = await authenticateUser(req);
  if (!user) return unauthorized();

  return ok({
    preferredAggregator: user.preferredAggregator || "default",
    enableSmartModel: user.enableSmartModel || false,
  });
}

/**
 * PATCH /api/settings
 * Update user settings
 */
export async function PATCH(req: NextRequest) {
  const user = await authenticateUser(req);
  if (!user) return unauthorized();

  const body = await req.json();
  const { preferredAggregator, enableSmartModel } = body;

  // Validate
  if (preferredAggregator && !["default", "openrouter", "302ai"].includes(preferredAggregator)) {
    return err("Invalid aggregator. Must be 'default', 'openrouter', or '302ai'");
  }

  // Update
  const updated = await prisma.user.update({
    where: { id: user.id },
    data: {
      ...(preferredAggregator !== undefined && { preferredAggregator }),
      ...(enableSmartModel !== undefined && { enableSmartModel }),
    },
  });

  return ok({
    preferredAggregator: updated.preferredAggregator,
    enableSmartModel: updated.enableSmartModel,
  });
}
