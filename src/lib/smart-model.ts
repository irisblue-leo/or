/**
 * Smart Model Selection Engine
 * 根据用户输入自动选择最合适的模型
 */

interface ModelRecommendation {
  modelName: string;
  reason: string;
  confidence: number; // 0-1
}

/**
 * 分析用户输入，推荐最合适的模型
 */
export function recommendModel(
  messages: Array<{ role: string; content: string }>,
  aggregator: "default" | "openrouter" = "default"
): ModelRecommendation {
  // 获取最后一条用户消息
  const lastUserMessage = messages
    .filter((m) => m.role === "user")
    .pop()?.content || "";

  const content = lastUserMessage.toLowerCase();

  // 默认聚合器：只有 gpt-4o 和 claude-3.5-sonnet
  if (aggregator === "default") {
    // 代码相关 → Claude
    if (
      content.includes("代码") ||
      content.includes("code") ||
      content.includes("编程") ||
      content.includes("bug") ||
      content.includes("函数") ||
      content.includes("function") ||
      content.includes("class") ||
      content.includes("debug")
    ) {
      return {
        modelName: "Claude 3.5 Sonnet",
        reason: "Claude 在代码编写和调试方面表现优秀",
        confidence: 0.9,
      };
    }

    // 默认使用 GPT-4o
    return {
      modelName: "GPT-4o",
      reason: "GPT-4o 是通用场景的最佳选择",
      confidence: 0.8,
    };
  }

  // OpenRouter 聚合器：有更多模型可选
  
  // 1. 代码相关 → Claude 3.5 Sonnet
  if (
    content.includes("代码") ||
    content.includes("code") ||
    content.includes("编程") ||
    content.includes("program") ||
    content.includes("bug") ||
    content.includes("debug") ||
    content.includes("函数") ||
    content.includes("function") ||
    content.includes("算法") ||
    content.includes("algorithm")
  ) {
    return {
      modelName: "Claude 3.5 Sonnet",
      reason: "Claude 3.5 Sonnet 在代码编写和调试方面表现最佳",
      confidence: 0.95,
    };
  }

  // 2. 数学/推理 → GPT-4o 或 Claude Opus
  if (
    content.includes("数学") ||
    content.includes("math") ||
    content.includes("计算") ||
    content.includes("推理") ||
    content.includes("reasoning") ||
    content.includes("证明") ||
    content.includes("proof") ||
    content.includes("逻辑") ||
    content.includes("logic")
  ) {
    return {
      modelName: "GPT-4o",
      reason: "GPT-4o 在数学推理方面表现优秀",
      confidence: 0.9,
    };
  }

  // 3. 创意写作 → Claude 或 GPT-4
  if (
    content.includes("写作") ||
    content.includes("write") ||
    content.includes("文章") ||
    content.includes("article") ||
    content.includes("故事") ||
    content.includes("story") ||
    content.includes("诗歌") ||
    content.includes("poem") ||
    content.includes("创意") ||
    content.includes("creative")
  ) {
    return {
      modelName: "Claude 3.5 Sonnet",
      reason: "Claude 在创意写作方面表现出色",
      confidence: 0.85,
    };
  }

  // 4. 翻译 → GPT-4o
  if (
    content.includes("翻译") ||
    content.includes("translate") ||
    content.includes("translation")
  ) {
    return {
      modelName: "GPT-4o",
      reason: "GPT-4o 在多语言翻译方面表现优秀",
      confidence: 0.9,
    };
  }

  // 5. 长文本理解 → Gemini 1.5 Pro (1M context)
  if (
    content.includes("总结") ||
    content.includes("summary") ||
    content.includes("分析") ||
    content.includes("analyze") ||
    messages.length > 10 || // 长对话
    lastUserMessage.length > 2000 // 长输入
  ) {
    return {
      modelName: "Gemini 2.0 Flash",
      reason: "Gemini 1.5 Pro 支持 1M 上下文，适合长文本处理",
      confidence: 0.85,
    };
  }

  // 6. 简单对话/快速响应 → GPT-4o-mini 或 Claude Haiku
  if (
    lastUserMessage.length < 100 &&
    (content.includes("你好") ||
      content.includes("hello") ||
      content.includes("hi") ||
      content.includes("谢谢") ||
      content.includes("thank"))
  ) {
    return {
      modelName: "GPT-4o Mini",
      reason: "GPT-4o-mini 速度快且成本低，适合简单对话",
      confidence: 0.8,
    };
  }

  // 7. 中文场景 → 国产模型（如果可用）
  const chineseChars = (content.match(/[\u4e00-\u9fa5]/g) || []).length;
  const totalChars = content.length;
  if (chineseChars / totalChars > 0.5) {
    // 超过 50% 中文
    // 可以优先推荐国产模型（如果有）
    // return { modelName: "qwen-max", reason: "通义千问在中文场景表现优秀", confidence: 0.85 };
  }

  // 默认：GPT-4o（通用场景）
  return {
    modelName: "GPT-4o",
    reason: "GPT-4o 是通用场景的最佳选择",
    confidence: 0.75,
  };
}

/**
 * 获取用户可用的模型列表（根据聚合器）
 */
export function getAvailableModels(aggregator: "default" | "openrouter"): string[] {
  if (aggregator === "default") {
    return ["gpt-4o", "claude-3.5-sonnet"];
  }

  // OpenRouter 聚合器：返回所有模型
  return [
    // OpenAI
    "gpt-4o",
    "gpt-4o-mini",
    "gpt-4-turbo",
    "gpt-3.5-turbo",
    // Anthropic
    "claude-3.5-sonnet",
    "claude-3-opus",
    "claude-3-haiku",
    // Google
    "gemini-1.5-pro",
    "gemini-1.5-flash",
    // 其他（根据实际配置）
  ];
}
