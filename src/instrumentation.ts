export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    // Import and start blockchain monitor
    const { getBlockchainMonitor } = await import('./lib/blockchain-monitor')

    if (process.env.NODE_ENV === 'production' || process.env.ENABLE_BLOCKCHAIN_MONITOR === 'true') {
      console.log('Starting blockchain monitor...')

      setTimeout(async () => {
        try {
          const monitor = getBlockchainMonitor()
          await monitor.start()
          console.log('Blockchain monitor started successfully')
        } catch (error) {
          console.error('Failed to start blockchain monitor:', error)
        }
      }, 5000)
    }
  }
}
