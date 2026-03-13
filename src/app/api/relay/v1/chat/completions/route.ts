import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { err } from "@/lib/resp";
import { ProxyAgent } from "undici";
import { analyzeRequest, matchConditions, type ChatMessage, type RouterConditions } from "@/lib/smart-router";

// Upstream API configuration (from .env)
const UPSTREAM_API_URL = process.env.UPSTREAM_API_URL || "https://api.openai.com/v1";
const UPSTREAM_API_KEY = process.env.UPSTREAM_API_KEY || "";
const OPENROUTER_API_URL = process.env.OPENROUTER_API_URL || "https://openrouter.ai/api/v1";
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY || "";

// Proxy configuration
const PROXY_URL = process.env.HTTPS_PROXY || process.env.https_proxy || process.env.HTTP_PROXY || process.env.http_proxy;
const proxyAgent = PROXY_URL ? new ProxyAgent(PROXY_URL) : undefined;

// Provider endpoints
const PROVIDER_URLS: Record<string, string> = {
  openai: `${UPSTREAM_API_URL}/chat/completions`,
  anthropic: `${UPSTREAM_API_URL}/chat/completions`,
  google: `${UPSTREAM_API_URL}/chat/completions`,
  openrouter: `${OPENROUTER_API_URL}/chat/completions`,
};

const PROVIDER_KEYS: Record<string, string> = {
  openai: UPSTREAM_API_KEY || process.env.OPENAI_API_KEY || "",
  anthropic: UPSTREAM_API_KEY || process.env.ANTHROPIC_API_KEY || "",
  google: UPSTREAM_API_KEY || process.env.GOOGLE_API_KEY || "",
  openrouter: OPENROUTER_API_KEY,
};

/** Authenticate via API key (sk-relay-xxx) */
async function authenticateByApiKey(req: NextRequest) {
  const auth = req.headers.get("authorization");
  if (!auth?.startsWith("Bearer ")) return null;
  const key = auth.slice(7);

  const apiKey = await prisma.apiKey.findUnique({
    where: { key },
    include: { user: true },
  });
  
  if (!apiKey || !apiKey.active) return null;
  return apiKey;
}

/** Calculate cost based on token usage and model pricing */
function calcCost(inputTokens: number, outputTokens: number, inputPrice: number, outputPrice: number) {
  return (inputTokens * inputPrice + outputTokens * outputPrice) / 1_000_000;
}

/** Count tokens from SSE stream chunks (approximate from usage field) */
function parseUsageFromChunks(chunks: string[]): { inputTokens: number; outputTokens: number } {
  let inputTokens = 0;
  let outputTokens = 0;
  for (const chunk of chunks) {
    try {
      const data = JSON.parse(chunk);
      if (data.usage) {
        inputTokens = data.usage.prompt_tokens || data.usage.input_tokens || inputTokens;
        outputTokens = data.usage.completion_tokens || data.usage.output_tokens || outputTokens;
      }
    } catch { /* skip non-JSON lines */ }
  }
  return { inputTokens, outputTokens };
}

/** POST /api/relay/v1/chat/completions — OpenAI-compatible relay */
export async function POST(req: NextRequest) {
  const startTime = Date.now();

  // 1. Auth by API key
  const apiKey = await authenticateByApiKey(req);
  if (!apiKey || !apiKey.user) return err("Invalid API key", 401);

  const user = apiKey.user;

  // 2. Parse request body
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return err("Invalid JSON body");
  }

  const modelName = body.model as string;
  if (!modelName) return err("model is required");

  const stream = body.stream === true;

  // 2.5. Smart Router: 智能路由选择模型
  let finalModelName = modelName;
  
  // 获取路由模式
  const routerModeConfig = await prisma.systemConfig.findUnique({
    where: { key: 'router_mode' }
  });
  const routerMode = routerModeConfig?.value || 'normal';

  if (routerMode === 'smart') {
    // 智能路由模式：分析请求并匹配规则
    const messages = body.messages as ChatMessage[];
    if (messages && Array.isArray(messages)) {
      const features = analyzeRequest(messages);
      
      // 获取所有启用的路由规则（按优先级排序）
      const rules = await prisma.routerConfig.findMany({
        where: { enabled: true },
        include: {
          targetModel: {
            select: {
              id: true,
              name: true,
              active: true
            }
          }
        },
        orderBy: { priority: 'desc' }
      });

      // 匹配第一个符合条件的规则
      for (const rule of rules) {
        if (rule.targetModel.active && matchConditions(features, rule.conditions as RouterConditions)) {
          finalModelName = rule.targetModel.name;
          console.log(`[Smart Router] Matched rule: ${rule.name}, selected model: ${finalModelName}`);
          break;
        }
      }

      // 如果没有匹配到规则，使用默认模型
      if (finalModelName === modelName) {
        const defaultModelConfig = await prisma.systemConfig.findUnique({
          where: { key: 'default_model' }
        });
        if (defaultModelConfig?.value) {
          finalModelName = defaultModelConfig.value;
          console.log(`[Smart Router] No rule matched, using default model: ${finalModelName}`);
        }
      }
    }
  }

  // 3. Look up model config (include upstream provider if linked)
  const model = await prisma.model.findUnique({
    where: { name: finalModelName },
    include: { upstreamProviderRef: true },
  });
  if (!model || !model.active) return err(`Model "${finalModelName}" not available`, 404);

  // 4. Check balance (estimate: pre-check with minimum)
  if (user.balance <= 0) return err("Insufficient balance", 402);

  // 5. Get upstream config — prefer UpstreamProvider table, fallback to env
  let upstreamUrl: string;
  let upstreamKey: string;
  let isOpenRouter = false;

  if (model.upstreamProviderRef && model.upstreamProviderRef.active) {
    // Use database-configured provider
    const p = model.upstreamProviderRef;
    upstreamUrl = `${p.apiUrl}/chat/completions`;
    upstreamKey = p.apiKey;
    isOpenRouter = p.slug === "openrouter";
  } else {
    // Fallback to env-based config
    const upstreamProvider = model.upstreamProvider || model.provider;
    upstreamUrl = PROVIDER_URLS[upstreamProvider] || "";
    upstreamKey = PROVIDER_KEYS[upstreamProvider] || "";
    isOpenRouter = upstreamProvider === "openrouter";
  }
  if (!upstreamUrl || !upstreamKey) return err("Upstream provider not configured", 500);

  // 6. Build upstream request — always request usage in stream
  const upstreamModelName = model.upstreamModelId || model.id;
  const upstreamBody: Record<string, unknown> = { ...body, model: upstreamModelName };
  if (stream) {
    upstreamBody.stream_options = { include_usage: true };
  }

  const upstreamHeaders: Record<string, string> = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${upstreamKey}`,
  };

  // OpenRouter specific headers
  if (isOpenRouter) {
    upstreamHeaders["HTTP-Referer"] = process.env.OPENROUTER_REFERER || "https://openclaw-relay.com";
    upstreamHeaders["X-Title"] = "OpenClaw Relay";
    // Region bypass: pretend to be from US
    upstreamHeaders["CF-IPCountry"] = "US";
    upstreamHeaders["X-Forwarded-For"] = "8.8.8.8";
  }

  // 7. Forward to upstream (with proxy support for OpenRouter)
  let upstreamRes: Response;
  try {
    const fetchOptions: RequestInit & { dispatcher?: any } = {
      method: "POST",
      headers: upstreamHeaders,
      body: JSON.stringify(upstreamBody),
    };
    
    // Use proxy for OpenRouter requests
    if (isOpenRouter && proxyAgent) {
      fetchOptions.dispatcher = proxyAgent;
    }
    
    upstreamRes = await fetch(upstreamUrl, fetchOptions);
  } catch (e: unknown) {
    return err("Upstream request failed: " + (e instanceof Error ? e.message : String(e)), 502);
  }

  const duration = Date.now() - startTime;

  // 8. Handle streaming response
  if (stream && upstreamRes.body) {
    const reader = upstreamRes.body.getReader();
    const decoder = new TextDecoder();
    const collectedChunks: string[] = [];

    const outputStream = new ReadableStream({
      async pull(controller) {
        const { done, value } = await reader.read();
        if (done) {
          controller.enqueue(new TextEncoder().encode("data: [DONE]\n\n"));
          controller.close();

          // Record usage after stream ends
          const { inputTokens, outputTokens } = parseUsageFromChunks(collectedChunks);
          const cost = calcCost(inputTokens, outputTokens, model.inputPrice, model.outputPrice);
          const upstreamCost = calcCost(inputTokens, outputTokens, model.upstreamInput, model.upstreamOutput);

          await prisma.$transaction([
            prisma.usageLog.create({
              data: {
                userId: user.id,
                apiKeyId: apiKey.id,
                modelId: model.id,
                inputTokens,
                outputTokens,
                cost,
                upstreamCost,
                duration,
                status: upstreamRes.status,
              },
            }),
            prisma.user.update({
              where: { id: user.id },
              data: { balance: { decrement: cost } },
            }),
          ]);
          return;
        }

        const text = decoder.decode(value, { stream: true });
        controller.enqueue(value);

        // Collect data lines for usage parsing
        const lines = text.split("\n");
        for (const line of lines) {
          if (line.startsWith("data: ") && line !== "data: [DONE]") {
            collectedChunks.push(line.slice(6));
          }
        }
      },
    });

    return new Response(outputStream, {
      status: upstreamRes.status,
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  }

  // 9. Handle non-streaming response
  const responseData = await upstreamRes.json();
  const inputTokens = responseData.usage?.prompt_tokens || responseData.usage?.input_tokens || 0;
  const outputTokens = responseData.usage?.completion_tokens || responseData.usage?.output_tokens || 0;
  const cost = calcCost(inputTokens, outputTokens, model.inputPrice, model.outputPrice);
  const upstreamCost = calcCost(inputTokens, outputTokens, model.upstreamInput, model.upstreamOutput);

  // 10. Record usage & deduct balance
  await prisma.$transaction([
    prisma.usageLog.create({
      data: {
        userId: user.id,
        apiKeyId: apiKey.id,
        modelId: model.id,
        inputTokens,
        outputTokens,
        cost,
        upstreamCost,
        duration,
        status: upstreamRes.status,
      },
    }),
    prisma.user.update({
      where: { id: user.id },
      data: { balance: { decrement: cost } },
    }),
  ]);

  return new Response(JSON.stringify(responseData), {
    status: upstreamRes.status,
    headers: { "Content-Type": "application/json" },
  });
}
