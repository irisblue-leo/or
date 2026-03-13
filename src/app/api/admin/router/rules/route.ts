// src/app/api/admin/router/rules/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';

// GET /api/admin/router/rules - 获取所有路由规则
export async function GET(req: NextRequest) {
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

    const rules = await prisma.routerConfig.findMany({
      include: {
        targetModel: {
          select: {
            id: true,
            name: true,
            provider: true
          }
        }
      },
      orderBy: [
        { enabled: 'desc' },
        { priority: 'desc' }
      ]
    });

    return NextResponse.json({ rules });
  } catch (error) {
    console.error('Get router rules error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/admin/router/rules - 创建路由规则
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
    const { name, conditions, targetModelId, priority, description } = body;

    // 验证必填字段
    if (!name || !conditions || !targetModelId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // 验证目标模型是否存在
    const model = await prisma.model.findUnique({
      where: { id: targetModelId }
    });

    if (!model) {
      return NextResponse.json({ error: 'Target model not found' }, { status: 404 });
    }

    // 创建规则
    const rule = await prisma.routerConfig.create({
      data: {
        name,
        conditions,
        targetModelId,
        priority: priority || 0,
        description
      },
      include: {
        targetModel: {
          select: {
            id: true,
            name: true,
            provider: true
          }
        }
      }
    });

    return NextResponse.json({ rule }, { status: 201 });
  } catch (error) {
    console.error('Create router rule error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
