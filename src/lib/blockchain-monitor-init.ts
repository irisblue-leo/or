import { getBlockchainMonitor } from './blockchain-monitor'

// Auto-start blockchain monitor when server starts
if (process.env.NODE_ENV === 'production' || process.env.ENABLE_BLOCKCHAIN_MONITOR === 'true') {
  console.log('Initializing blockchain monitor...')

  const monitor = getBlockchainMonitor()

  // Start monitoring after a short delay
  setTimeout(() => {
    monitor.start().catch(error => {
      console.error('Failed to start blockchain monitor:', error)
    })
  }, 5000)

  // Graceful shutdown
  process.on('SIGTERM', async () => {
    console.log('SIGTERM received, stopping blockchain monitor...')
    await monitor.stop()
    process.exit(0)
  })

  process.on('SIGINT', async () => {
    console.log('SIGINT received, stopping blockchain monitor...')
    await monitor.stop()
    process.exit(0)
  })
}

export {}
