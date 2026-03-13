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
    if (!payload) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    const deposits = await prisma.cryptoDeposit.findMany({
      where: {
        userId: payload.userId
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: limit,
      skip: offset
    })

    const total = await prisma.cryptoDeposit.count({
      where: {
        userId: payload.userId
      }
    })

    return NextResponse.json({
      deposits: deposits.map(d => ({
        id: d.id,
        chain: d.chain,
        token: d.token,
        amount: d.amount.toNumber(),
        amountUsd: d.amountUsd.toNumber(),
        txHash: d.txHash,
        status: d.status,
        confirmations: d.confirmations,
        createdAt: d.createdAt.toISOString(),
        confirmedAt: d.confirmedAt?.toISOString()
      })),
      total,
      limit,
      offset
    })
  } catch (error) {
    console.error('Get deposit history error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
