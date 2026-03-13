// src/app/api/admin/system/config/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';

// GET /api/admin/system/config - 获取系统配置
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

    // 获取路由模式和默认模型
    const routerMode = await prisma.systemConfig.findUnique({
      where: { key: 'router_mode' }
    });
    
    const defaultModel = await prisma.systemConfig.findUnique({
      where: { key: 'default_model' }
    });

    return NextResponse.json({
      routerMode: routerMode?.value || 'normal',
      defaultModel: defaultModel?.value || 'anthropic/claude-opus-4.6'
    });
  } catch (error) {
    console.error('Get system config error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PATCH /api/admin/system/config - 更新系统配置
export async function PATCH(req: NextRequest) {
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
    const { routerMode, defaultModel } = body;

    // 验证路由模式
    if (routerMode && !['normal', 'smart'].includes(routerMode)) {
      return NextResponse.json({ error: 'Invalid router mode' }, { status: 400 });
    }

    // 更新路由模式
    if (routerMode) {
      await prisma.systemConfig.upsert({
        where: { key: 'router_mode' },
        update: { 
          value: routerMode,
          updatedBy: payload.userId,
          updatedAt: new Date()
        },
        create: {
          id: 'cfg_router_mode',
          key: 'router_mode',
          value: routerMode,
          description: '路由模式：normal=普通模式, smart=智能路由',
          updatedBy: payload.userId
        }
      });
    }

    // 更新默认模型
    if (defaultModel) {
      // 验证模型是否存在
      const model = await prisma.model.findUnique({
        where: { name: defaultModel }
      });
      
      if (!model) {
        return NextResponse.json({ error: 'Model not found' }, { status: 404 });
      }

      await prisma.systemConfig.upsert({
        where: { key: 'default_model' },
        update: { 
          value: defaultModel,
          updatedBy: payload.userId,
          updatedAt: new Date()
        },
        create: {
          id: 'cfg_default_model',
          key: 'default_model',
          value: defaultModel,
          description: '普通模式默认模型',
          updatedBy: payload.userId
        }
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Update system config error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
