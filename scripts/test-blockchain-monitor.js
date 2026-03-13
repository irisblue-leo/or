#!/usr/bin/env node

/**
 * Blockchain Monitor Test Script
 *
 * This script tests the blockchain monitoring functionality
 * Run with: node scripts/test-blockchain-monitor.js
 */

const { PrismaClient } = require('@prisma/client')
const { getBlockchainMonitor } = require('../src/lib/blockchain-monitor')

const prisma = new PrismaClient()

async function testMonitor() {
  console.log('=== Blockchain Monitor Test ===\n')

  try {
    // 1. Check database connection
    console.log('1. Testing database connection...')
    await prisma.$connect()
    console.log('✓ Database connected\n')

    // 2. Check if there are any wallets
    console.log('2. Checking for crypto wallets...')
    const wallets = await prisma.cryptoWallet.findMany()
    console.log(`✓ Found ${wallets.length} wallet(s)`)
    if (wallets.length > 0) {
      wallets.forEach(w => {
        console.log(`  - ${w.chain}: ${w.address}`)
      })
    }
    console.log()

    // 3. Check existing deposits
    console.log('3. Checking existing deposits...')
    const deposits = await prisma.cryptoDeposit.findMany({
      orderBy: { createdAt: 'desc' },
      take: 5
    })
    console.log(`✓ Found ${deposits.length} recent deposit(s)`)
    if (deposits.length > 0) {
      deposits.forEach(d => {
        console.log(`  - ${d.chain} ${d.token}: ${d.amount} (${d.status})`)
      })
    }
    console.log()

    // 4. Test monitor initialization
    console.log('4. Initializing blockchain monitor...')
    const monitor = getBlockchainMonitor()
    console.log('✓ Monitor initialized\n')

    // 5. Start monitoring (for 60 seconds)
    console.log('5. Starting monitor (will run for 60 seconds)...')
    console.log('   Press Ctrl+C to stop early\n')

    await monitor.start()

    // Wait for 60 seconds
    await new Promise(resolve => setTimeout(resolve, 60000))

    console.log('\n6. Stopping monitor...')
    await monitor.stop()
    console.log('✓ Monitor stopped\n')

    // 7. Check for new deposits
    console.log('7. Checking for new deposits...')
    const newDeposits = await prisma.cryptoDeposit.findMany({
      where: {
        createdAt: {
          gte: new Date(Date.now() - 60000)
        }
      }
    })
    console.log(`✓ Found ${newDeposits.length} new deposit(s) in the last minute`)
    if (newDeposits.length > 0) {
      newDeposits.forEach(d => {
        console.log(`  - ${d.chain} ${d.token}: ${d.amount} (${d.status})`)
        console.log(`    TX: ${d.txHash}`)
      })
    }
    console.log()

    console.log('=== Test Complete ===')
    console.log('\nTo enable automatic monitoring on server start:')
    console.log('  Set ENABLE_BLOCKCHAIN_MONITOR=true in your .env file')

  } catch (error) {
    console.error('❌ Test failed:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

// Handle Ctrl+C
process.on('SIGINT', async () => {
  console.log('\n\nReceived SIGINT, cleaning up...')
  await prisma.$disconnect()
  process.exit(0)
})

// Run test
testMonitor()
