import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { verifyToken } from '@/lib/auth'

const prisma = new PrismaClient()

export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '')
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const payload = verifyToken(token)
    if (!payload || payload.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')
    const status = searchParams.get('status')

    const where = status ? { status } : {}

    const deposits = await prisma.cryptoDeposit.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: limit,
      skip: offset
    })

    const total = await prisma.cryptoDeposit.count({ where })

    // 统计数据
    const stats = await prisma.cryptoDeposit.aggregate({
      _sum: {
        amountUsd: true
      },
      _count: true,
      where: {
        status: 'confirmed'
      }
    })

    const pendingCount = await prisma.cryptoDeposit.count({
      where: { status: 'pending' }
    })

    return NextResponse.json({
      deposits: deposits.map(d => ({
        id: d.id,
        userId: d.userId,
        userEmail: d.user.email,
        userName: d.user.name,
        chain: d.chain,
        token: d.token,
        amount: d.amount.toNumber(),
        amountUsd: d.amountUsd.toNumber(),
        txHash: d.txHash,
        fromAddress: d.fromAddress,
        toAddress: d.toAddress,
        status: d.status,
        confirmations: d.confirmations,
        createdAt: d.createdAt.toISOString(),
        confirmedAt: d.confirmedAt?.toISOString()
      })),
      total,
      limit,
      offset,
      stats: {
        totalDeposits: stats._count,
        totalVolume: stats._sum.amountUsd?.toNumber() || 0,
        pendingCount
      }
    })
  } catch (error) {
    console.error('Get crypto deposits error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
