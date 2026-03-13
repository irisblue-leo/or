import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { verifyToken } from '@/lib/auth'

const { generateWalletAddress } = require('@/lib/wallet')
const prisma = new PrismaClient()

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ chain: string }> }
) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '')
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const payload = verifyToken(token)
    if (!payload) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    const { chain } = await context.params

    // 检查是否已有钱包地址
    let wallet = await prisma.cryptoWallet.findUnique({
      where: {
        userId_chain: {
          userId: payload.userId,
          chain
        }
      }
    })

    // 如果没有，生成真实的确定性地址
    if (!wallet) {
      const address = generateWalletAddress(payload.userId, chain)
      wallet = await prisma.cryptoWallet.create({
        data: {
          userId: payload.userId,
          chain,
          address
        }
      })
    }

    return NextResponse.json({
      chain,
      address: wallet.address,
      qrCode: `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${wallet.address}`
    })
  } catch (error) {
    console.error('Get wallet address error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
