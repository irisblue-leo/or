// src/lib/smart-router.ts
// 智能路由引擎

export type TaskType = 'chat' | 'code' | 'analysis' | 'translation' | 'creative';
export type Complexity = 'simple' | 'medium' | 'complex';

export interface RequestFeatures {
  tokenCount: number;
  messageCount: number;
  hasImages: boolean;
  hasCode: boolean;
  taskType: TaskType;
  language: string;
  complexity: Complexity;
}

export interface RouterConditions {
  tokenCount?: {
    min?: number;
    max?: number;
  };
  messageCount?: {
    min?: number;
    max?: number;
  };
  hasImages?: boolean;
  hasCode?: boolean;
  taskType?: TaskType;
  language?: string;
  complexity?: Complexity;
}

export interface ChatMessage {
  role: string;
  content: string | Array<{ type: string; text?: string; image_url?: any }>;
}

/**
 * 估算文本的 token 数量
 * 简单估算：1 token ≈ 4 个字符（英文）或 1.5 个字符（中文）
 */
export function estimateTokens(text: string): number {
  const chineseChars = (text.match(/[\u4e00-\u9fa5]/g) || []).length;
  const otherChars = text.length - chineseChars;
  return Math.ceil(chineseChars / 1.5 + otherChars / 4);
}

/**
 * 检测主要语言
 */
export function detectLanguage(text: string): string {
  const chineseChars = (text.match(/[\u4e00-\u9fa5]/g) || []).length;
  const japaneseChars = (text.match(/[\u3040-\u309f\u30a0-\u30ff]/g) || []).length;
  const koreanChars = (text.match(/[\uac00-\ud7af]/g) || []).length;
  
  const total = text.length;
  if (chineseChars / total > 0.3) return 'zh';
  if (japaneseChars / total > 0.3) return 'ja';
  if (koreanChars / total > 0.3) return 'ko';
  
  return 'en';
}

/**
 * 检测任务类型
 */
export function detectTaskType(messages: ChatMessage[]): TaskType {
  if (messages.length === 0) return 'chat';
  
  const lastMessage = messages[messages.length - 1];
  const content = typeof lastMessage.content === 'string' 
    ? lastMessage.content 
    : lastMessage.content.map(c => c.text || '').join(' ');
  
  // 代码任务
  if (/```/.test(content) || /代码|code|编程|programming|function|class/i.test(content)) {
    return 'code';
  }
  
  // 翻译任务
  if (/翻译|translate|translation/i.test(content)) {
    return 'translation';
  }
  
  // 分析任务
  if (/分析|analyze|总结|summarize|解释|explain/i.test(content)) {
    return 'analysis';
  }
  
  // 创作任务
  if (/写|创作|生成|write|create|compose|故事|story|文章|article/i.test(content)) {
    return 'creative';
  }
  
  return 'chat';
}

/**
 * 评估复杂度
 */
export function assessComplexity(features: RequestFeatures): Complexity {
  let score = 0;
  
  if (features.tokenCount > 2000) score += 2;
  if (features.tokenCount > 5000) score += 1;
  if (features.messageCount > 5) score += 1;
  if (features.messageCount > 10) score += 1;
  if (features.hasImages) score += 2;
  if (features.hasCode) score += 1;
  
  if (score >= 5) return 'complex';
  if (score >= 2) return 'medium';
  return 'simple';
}

/**
 * 分析请求特征
 */
export function analyzeRequest(messages: ChatMessage[]): RequestFeatures {
  let totalTokens = 0;
  let hasImages = false;
  let hasCode = false;
  let allText = '';
  
  for (const message of messages) {
    if (typeof message.content === 'string') {
      totalTokens += estimateTokens(message.content);
      allText += message.content + ' ';
      if (/```/.test(message.content)) {
        hasCode = true;
      }
    } else if (Array.isArray(message.content)) {
      for (const part of message.content) {
        if (part.type === 'text' && part.text) {
          totalTokens += estimateTokens(part.text);
          allText += part.text + ' ';
          if (/```/.test(part.text)) {
            hasCode = true;
          }
        } else if (part.type === 'image_url') {
          hasImages = true;
          totalTokens += 85; // 图片约等于 85 tokens
        }
      }
    }
  }
  
  const taskType = detectTaskType(messages);
  const language = detectLanguage(allText);
  
  const features: RequestFeatures = {
    tokenCount: totalTokens,
    messageCount: messages.length,
    hasImages,
    hasCode,
    taskType,
    language,
    complexity: 'simple' // 先设置默认值
  };
  
  // 评估复杂度（需要基于其他特征）
  features.complexity = assessComplexity(features);
  
  return features;
}

/**
 * 匹配条件
 */
export function matchConditions(
  features: RequestFeatures,
  conditions: RouterConditions
): boolean {
  // Token 数量匹配
  if (conditions.tokenCount) {
    if (conditions.tokenCount.min !== undefined && features.tokenCount < conditions.tokenCount.min) {
      return false;
    }
    if (conditions.tokenCount.max !== undefined && features.tokenCount > conditions.tokenCount.max) {
      return false;
    }
  }
  
  // 消息数量匹配
  if (conditions.messageCount) {
    if (conditions.messageCount.min !== undefined && features.messageCount < conditions.messageCount.min) {
      return false;
    }
    if (conditions.messageCount.max !== undefined && features.messageCount > conditions.messageCount.max) {
      return false;
    }
  }
  
  // 图片匹配
  if (conditions.hasImages !== undefined && features.hasImages !== conditions.hasImages) {
    return false;
  }
  
  // 代码匹配
  if (conditions.hasCode !== undefined && features.hasCode !== conditions.hasCode) {
    return false;
  }
  
  // 任务类型匹配
  if (conditions.taskType && features.taskType !== conditions.taskType) {
    return false;
  }
  
  // 语言匹配
  if (conditions.language && features.language !== conditions.language) {
    return false;
  }
  
  // 复杂度匹配
  if (conditions.complexity && features.complexity !== conditions.complexity) {
    return false;
  }
  
  return true;
}
