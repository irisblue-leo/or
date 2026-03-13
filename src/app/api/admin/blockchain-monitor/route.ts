import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth'
import { getBlockchainMonitor } from '@/lib/blockchain-monitor'

export async function POST(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '')
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const payload = verifyToken(token)
    if (!payload || payload.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { action } = await request.json()
    const monitor = getBlockchainMonitor()

    if (action === 'start') {
      await monitor.start()
      return NextResponse.json({ success: true, message: 'Blockchain monitor started' })
    } else if (action === 'stop') {
      await monitor.stop()
      return NextResponse.json({ success: true, message: 'Blockchain monitor stopped' })
    } else {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }
  } catch (error) {
    console.error('Blockchain monitor control error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
