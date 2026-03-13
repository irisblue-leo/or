import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient, Prisma } from '@prisma/client'
import { verifyToken } from '@/lib/auth'

const prisma = new PrismaClient()

export async function POST(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '')
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const payload = verifyToken(token)
    if (!payload) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    const { chain, token: tokenSymbol, amount } = await request.json()

    // 生成模拟交易哈希
    const txHash = `0x${Array.from({ length: 64 }, () => 
      Math.floor(Math.random() * 16).toString(16)
    ).join('')}`

    // 获取用户钱包地址
    const wallet = await prisma.cryptoWallet.findUnique({
      where: {
        userId_chain: {
          userId: payload.userId,
          chain
        }
      }
    })

    if (!wallet) {
      return NextResponse.json({ error: 'Wallet not found' }, { status: 404 })
    }

    // 创建充值记录
    const deposit = await prisma.cryptoDeposit.create({
      data: {
        userId: payload.userId,
        chain,
        token: tokenSymbol,
        amount: new Prisma.Decimal(amount),
        amountUsd: new Prisma.Decimal(amount), // 简化：假设 1 USDT = 1 USD
        txHash,
        fromAddress: '0x' + Array.from({ length: 40 }, () => 
          Math.floor(Math.random() * 16).toString(16)
        ).join(''),
        toAddress: wallet.address,
        status: 'confirmed',
        confirmations: 12,
        confirmedAt: new Date()
      }
    })

    // 更新用户余额
    await prisma.user.update({
      where: { id: payload.userId },
      data: {
        balance: {
          increment: amount
        }
      }
    })

    // 创建交易记录
    await prisma.transaction.create({
      data: {
        userId: payload.userId,
        type: 'topup',
        amount,
        note: `Crypto deposit: ${amount} ${tokenSymbol} on ${chain}`
      }
    })

    return NextResponse.json({
      success: true,
      deposit: {
        id: deposit.id,
        userId: deposit.userId,
        chain: deposit.chain,
        token: deposit.token,
        amount: deposit.amount.toNumber(),
        txHash: deposit.txHash,
        status: deposit.status,
        confirmations: deposit.confirmations,
        createdAt: deposit.createdAt.toISOString()
      }
    })
  } catch (error) {
    console.error('Simulate deposit error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
