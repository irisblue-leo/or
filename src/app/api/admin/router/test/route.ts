// src/app/api/admin/router/test/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';
import { analyzeRequest, matchConditions, type ChatMessage, type RouterConditions } from '@/lib/smart-router';

// POST /api/admin/router/test - 测试路由规则
export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const payload = verifyToken(token);
    if (!payload || payload.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await req.json();
    const { messages } = body;

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: 'Invalid messages' }, { status: 400 });
    }

    // 分析请求特征
    const features = analyzeRequest(messages as ChatMessage[]);

    // 获取路由模式
    const routerModeConfig = await prisma.systemConfig.findUnique({
      where: { key: 'router_mode' }
    });
    const routerMode = routerModeConfig?.value || 'normal';

    let matchedRule = null;
    let selectedModel = '';
    let reason = '';

    if (routerMode === 'normal') {
      // 普通模式：使用默认模型
      const defaultModelConfig = await prisma.systemConfig.findUnique({
        where: { key: 'default_model' }
      });
      selectedModel = defaultModelConfig?.value || 'anthropic/claude-opus-4.6';
      reason = '普通模式，使用默认模型';
    } else {
      // 智能路由模式：匹配规则
      const rules = await prisma.routerConfig.findMany({
        where: { enabled: true },
        include: {
          targetModel: {
            select: {
              id: true,
              name: true,
              provider: true
            }
          }
        },
        orderBy: { priority: 'desc' }
      });

      for (const rule of rules) {
        if (matchConditions(features, rule.conditions as RouterConditions)) {
          matchedRule = rule;
          selectedModel = rule.targetModel.name;
          reason = `匹配规则：${rule.name}`;
          break;
        }
      }

      // 无匹配规则，使用默认模型
      if (!matchedRule) {
        const defaultModelConfig = await prisma.systemConfig.findUnique({
          where: { key: 'default_model' }
        });
        selectedModel = defaultModelConfig?.value || 'anthropic/claude-opus-4.6';
        reason = '无匹配规则，使用默认模型';
      }
    }

    return NextResponse.json({
      features,
      matchedRule: matchedRule ? {
        id: matchedRule.id,
        name: matchedRule.name,
        priority: matchedRule.priority,
        targetModel: matchedRule.targetModel
      } : null,
      selectedModel,
      reason
    });
  } catch (error) {
    console.error('Test router error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
