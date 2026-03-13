#!/usr/bin/env node

require('dotenv').config()
const { startBlockchainMonitors } = require('../src/lib/blockchain-monitor')

console.log('OpenClaw Relay - Blockchain Monitor')
console.log('====================================')
console.log('')

startBlockchainMonitors()
  .then(() => {
    console.log('Blockchain monitors are running...')
    console.log('Press Ctrl+C to stop')
  })
  .catch((error) => {
    console.error('Failed to start blockchain monitors:', error)
    process.exit(1)
  })
