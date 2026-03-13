// src/app/api/admin/router/rules/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';

// PATCH /api/admin/router/rules/:id - 更新路由规则
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
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
    const { name, enabled, conditions, targetModelId, priority, description } = body;

    // 验证规则是否存在
    const existingRule = await prisma.routerConfig.findUnique({
      where: { id }
    });

    if (!existingRule) {
      return NextResponse.json({ error: 'Rule not found' }, { status: 404 });
    }

    // 如果更新目标模型，验证模型是否存在
    if (targetModelId) {
      const model = await prisma.model.findUnique({
        where: { id: targetModelId }
      });

      if (!model) {
        return NextResponse.json({ error: 'Target model not found' }, { status: 404 });
      }
    }

    // 更新规则
    const rule = await prisma.routerConfig.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(enabled !== undefined && { enabled }),
        ...(conditions !== undefined && { conditions }),
        ...(targetModelId !== undefined && { targetModelId }),
        ...(priority !== undefined && { priority }),
        ...(description !== undefined && { description })
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

    return NextResponse.json({ rule });
  } catch (error) {
    console.error('Update router rule error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/admin/router/rules/:id - 删除路由规则
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    const authHeader = req.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const payload = verifyToken(token);
    if (!payload || payload.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // 验证规则是否存在
    const existingRule = await prisma.routerConfig.findUnique({
      where: { id }
    });

    if (!existingRule) {
      return NextResponse.json({ error: 'Rule not found' }, { status: 404 });
    }

    // 删除规则
    await prisma.routerConfig.delete({
      where: { id }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete router rule error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
