import { NextRequest } from "next/server";
import { authenticateAdmin } from "@/lib/auth";
import { ok, err, unauthorized } from "@/lib/resp";

const UPSTREAM_API_URL = process.env.UPSTREAM_API_URL || "https://hone.vvvv.ee/v1";
const UPSTREAM_API_KEY = process.env.UPSTREAM_API_KEY || "";
const OPENROUTER_API_URL = process.env.OPENROUTER_API_URL || "https://openrouter.ai/api/v1";
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY || "";

/** GET /api/admin/models/fetch-upstream — fetch models from upstream provider */
export async function GET(req: NextRequest) {
  const admin = await authenticateAdmin(req);
  if (!admin) return unauthorized("Admin access required");

  const { searchParams } = new URL(req.url);
  const provider = searchParams.get("provider") || "default";

  let apiUrl: string;
  let apiKey: string;

  if (provider === "openrouter") {
    apiUrl = `${OPENROUTER_API_URL}/models`;
    apiKey = OPENROUTER_API_KEY;
  } else {
    apiUrl = `${UPSTREAM_API_URL}/models`;
    apiKey = UPSTREAM_API_KEY;
  }

  if (!apiKey) {
    return err(`API key not configured for provider: ${provider}`, 500);
  }

  try {
    const res = await fetch(apiUrl, {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
    });

    if (!res.ok) {
      return err(`Failed to fetch from upstream: ${res.statusText}`, res.status);
    }

    const data = await res.json();

    // Normalize response format
    const models = data.data || data.models || [];

    return ok({ models });
  } catch (error) {
    console.error("Failed to fetch upstream models:", error);
    return err("Failed to fetch upstream models", 500);
  }
}
