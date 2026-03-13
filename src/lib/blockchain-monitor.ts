import { PrismaClient, Prisma } from '@prisma/client'
import { ethers } from 'ethers'
import { Connection, PublicKey } from '@solana/web3.js'

// Use dynamic import for TronWeb to avoid TypeScript issues
const TronWeb = require('tronweb')

const prisma = new PrismaClient()

// Token contract addresses
const TOKEN_CONTRACTS = {
  ethereum: {
    USDT: '0xdac17f958d2ee523a2206206994597c13d831ec7'
  },
  bsc: {
    USDT: '0x55d398326f99059ff775485246999027b3197955',
    BUSD: '0xe9e7cea3dedca5984780bafc599bd69add087d56'
  },
  tron: {
    USDT: 'TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t'
  },
  polygon: {
    USDC: '0x2791bca1f2de4661ed88a30c99a7a9449aa84174'
  }
}

// Minimum confirmations required
const MIN_CONFIRMATIONS = {
  ethereum: 12,
  bsc: 15,
  tron: 19,
  polygon: 128,
  solana: 32
}

interface DepositTransaction {
  txHash: string
  fromAddress: string
  toAddress: string
  amount: string
  token: string
  blockNumber: number
  timestamp: number
}

export class BlockchainMonitor {
  private providers: Map<string, any> = new Map()
  private lastProcessedBlock: Map<string, number> = new Map()
  private isRunning = false

  constructor() {
    this.initializeProviders()
  }

  private initializeProviders() {
    // Ethereum
    this.providers.set('ethereum', new ethers.JsonRpcProvider(
      process.env.ETHEREUM_RPC || 'https://eth.llamarpc.com'
    ))

    // BSC
    this.providers.set('bsc', new ethers.JsonRpcProvider(
      process.env.BSC_RPC || 'https://bsc-dataseed.binance.org'
    ))

    // Polygon
    this.providers.set('polygon', new ethers.JsonRpcProvider(
      process.env.POLYGON_RPC || 'https://polygon-rpc.com'
    ))

    // Tron
    this.providers.set('tron', new TronWeb({
      fullHost: process.env.TRON_RPC || 'https://api.trongrid.io'
    }))

    // Solana
    this.providers.set('solana', new Connection(
      process.env.SOLANA_RPC || 'https://api.mainnet-beta.solana.com'
    ))
  }

  async start() {
    if (this.isRunning) {
      console.log('Blockchain monitor already running')
      return
    }

    this.isRunning = true
    console.log('Starting blockchain monitor...')

    // Monitor each chain
    const chains = ['ethereum', 'bsc', 'polygon', 'tron', 'solana']

    for (const chain of chains) {
      this.monitorChain(chain)
    }
  }

  async stop() {
    this.isRunning = false
    console.log('Stopping blockchain monitor...')
  }

  private async monitorChain(chain: string) {
    while (this.isRunning) {
      try {
        await this.checkDeposits(chain)
      } catch (error) {
        console.error(`Error monitoring ${chain}:`, error)
      }

      // Wait before next check (30 seconds)
      await new Promise(resolve => setTimeout(resolve, 30000))
    }
  }

  private async checkDeposits(chain: string) {
    const wallets = await prisma.cryptoWallet.findMany({
      where: { chain },
      select: { address: true, userId: true }
    })

    if (wallets.length === 0) return

    // Get unique addresses
    const addresses = [...new Set(wallets.map(w => w.address))]

    for (const address of addresses) {
      const transactions = await this.getTransactions(chain, address)

      for (const tx of transactions) {
        await this.processTransaction(chain, tx, wallets)
      }
    }
  }

  private async getTransactions(chain: string, address: string): Promise<DepositTransaction[]> {
    const provider = this.providers.get(chain)
    if (!provider) return []

    try {
      if (chain === 'tron') {
        return await this.getTronTransactions(address)
      } else if (chain === 'solana') {
        return await this.getSolanaTransactions(address)
      } else {
        return await this.getEvmTransactions(chain, address)
      }
    } catch (error) {
      console.error(`Failed to get transactions for ${chain}:`, error)
      return []
    }
  }

  private async getEvmTransactions(chain: string, address: string): Promise<DepositTransaction[]> {
    const provider = this.providers.get(chain)
    const currentBlock = await provider.getBlockNumber()
    const lastBlock = this.lastProcessedBlock.get(chain) || currentBlock - 100

    const transactions: DepositTransaction[] = []

    // Check native token transfers
    const filter = {
      address: null,
      topics: [null, null, ethers.zeroPadValue(address, 32)]
    }

    const logs = await provider.getLogs({
      ...filter,
      fromBlock: lastBlock,
      toBlock: currentBlock
    })

    // Check ERC20 transfers
    const tokens = TOKEN_CONTRACTS[chain as keyof typeof TOKEN_CONTRACTS] || {}

    for (const [tokenSymbol, tokenAddress] of Object.entries(tokens)) {
      const transferFilter = {
        address: tokenAddress,
        topics: [
          ethers.id('Transfer(address,address,uint256)'),
          null,
          ethers.zeroPadValue(address, 32)
        ]
      }

      const tokenLogs = await provider.getLogs({
        ...transferFilter,
        fromBlock: lastBlock,
        toBlock: currentBlock
      })

      for (const log of tokenLogs) {
        const iface = new ethers.Interface([
          'event Transfer(address indexed from, address indexed to, uint256 value)'
        ])
        const parsed = iface.parseLog(log)

        if (parsed) {
          const block = await provider.getBlock(log.blockNumber)
          transactions.push({
            txHash: log.transactionHash,
            fromAddress: parsed.args[0],
            toAddress: parsed.args[1],
            amount: parsed.args[2].toString(),
            token: tokenSymbol,
            blockNumber: log.blockNumber,
            timestamp: block?.timestamp || Date.now() / 1000
          })
        }
      }
    }

    this.lastProcessedBlock.set(chain, currentBlock)
    return transactions
  }

  private async getTronTransactions(address: string): Promise<DepositTransaction[]> {
    const tronWeb = this.providers.get('tron')
    const transactions: DepositTransaction[] = []

    try {
      // Get TRC20 USDT transfers
      const result = await tronWeb.getEventResult(
        TOKEN_CONTRACTS.tron.USDT,
        {
          eventName: 'Transfer',
          size: 20,
          onlyConfirmed: true
        }
      )

      for (const event of result) {
        if (event.result.to === tronWeb.address.toHex(address)) {
          transactions.push({
            txHash: event.transaction,
            fromAddress: tronWeb.address.fromHex(event.result.from),
            toAddress: tronWeb.address.fromHex(event.result.to),
            amount: event.result.value,
            token: 'USDT',
            blockNumber: event.block_number,
            timestamp: event.block_timestamp / 1000
          })
        }
      }
    } catch (error) {
      console.error('Failed to get Tron transactions:', error)
    }

    return transactions
  }

  private async getSolanaTransactions(address: string): Promise<DepositTransaction[]> {
    const connection = this.providers.get('solana')
    const transactions: DepositTransaction[] = []

    try {
      const pubkey = new PublicKey(address)
      const signatures = await connection.getSignaturesForAddress(pubkey, { limit: 20 })

      for (const sig of signatures) {
        const tx = await connection.getTransaction(sig.signature, {
          maxSupportedTransactionVersion: 0
        })

        if (tx && tx.meta && !tx.meta.err) {
          // Parse SOL transfers
          const preBalance = tx.meta.preBalances[0]
          const postBalance = tx.meta.postBalances[0]
          const amount = postBalance - preBalance

          if (amount > 0) {
            transactions.push({
              txHash: sig.signature,
              fromAddress: tx.transaction.message.accountKeys[0].toString(),
              toAddress: address,
              amount: amount.toString(),
              token: 'SOL',
              blockNumber: sig.slot,
              timestamp: sig.blockTime || Date.now() / 1000
            })
          }
        }
      }
    } catch (error) {
      console.error('Failed to get Solana transactions:', error)
    }

    return transactions
  }

  private async processTransaction(
    chain: string,
    tx: DepositTransaction,
    wallets: { address: string; userId: string }[]
  ) {
    // Check if already processed
    const existing = await prisma.cryptoDeposit.findUnique({
      where: { txHash: tx.txHash }
    })

    if (existing) return

    // Find user by wallet address
    const wallet = wallets.find(w => w.address.toLowerCase() === tx.toAddress.toLowerCase())
    if (!wallet) return

    // Get current confirmations
    const confirmations = await this.getConfirmations(chain, tx.blockNumber)
    const minConfirmations = MIN_CONFIRMATIONS[chain as keyof typeof MIN_CONFIRMATIONS] || 12

    // Convert amount to decimal
    const decimals = this.getTokenDecimals(chain, tx.token)
    const amount = new Prisma.Decimal(tx.amount).div(new Prisma.Decimal(10).pow(decimals))

    // Create deposit record
    const deposit = await prisma.cryptoDeposit.create({
      data: {
        userId: wallet.userId,
        chain,
        token: tx.token,
        amount,
        amountUsd: amount, // Simplified: assume 1:1 for stablecoins
        txHash: tx.txHash,
        fromAddress: tx.fromAddress,
        toAddress: tx.toAddress,
        status: confirmations >= minConfirmations ? 'confirmed' : 'pending',
        confirmations,
        confirmedAt: confirmations >= minConfirmations ? new Date(tx.timestamp * 1000) : null
      }
    })

    // If confirmed, credit user balance
    if (confirmations >= minConfirmations) {
      await this.creditUserBalance(wallet.userId, amount.toNumber(), deposit.id, chain, tx.token)
    }

    console.log(`Processed deposit: ${tx.txHash} for user ${wallet.userId}, amount: ${amount} ${tx.token}`)
  }

  private async getConfirmations(chain: string, blockNumber: number): Promise<number> {
    try {
      if (chain === 'tron') {
        const tronWeb = this.providers.get('tron')
        const currentBlock = await tronWeb.trx.getCurrentBlock()
        return currentBlock.block_header.raw_data.number - blockNumber
      } else if (chain === 'solana') {
        const connection = this.providers.get('solana')
        const currentSlot = await connection.getSlot()
        return currentSlot - blockNumber
      } else {
        const provider = this.providers.get(chain)
        const currentBlock = await provider.getBlockNumber()
        return currentBlock - blockNumber
      }
    } catch (error) {
      console.error(`Failed to get confirmations for ${chain}:`, error)
      return 0
    }
  }

  private getTokenDecimals(chain: string, token: string): number {
    // Standard decimals for common tokens
    const decimalsMap: Record<string, number> = {
      ETH: 18,
      BNB: 18,
      MATIC: 18,
      TRX: 6,
      SOL: 9,
      USDT: 6,
      USDC: 6,
      BUSD: 18
    }

    return decimalsMap[token] || 18
  }

  private async creditUserBalance(
    userId: string,
    amount: number,
    depositId: string,
    chain: string,
    token: string
  ) {
    await prisma.$transaction(async (tx) => {
      // Update user balance
      await tx.user.update({
        where: { id: userId },
        data: {
          balance: {
            increment: amount
          }
        }
      })

      // Create transaction record
      await tx.transaction.create({
        data: {
          userId,
          type: 'topup',
          amount,
          note: `Crypto deposit: ${amount} ${token} on ${chain} (${depositId})`
        }
      })
    })

    console.log(`Credited ${amount} USD to user ${userId}`)
  }
}

// Singleton instance
let monitorInstance: BlockchainMonitor | null = null

export function getBlockchainMonitor(): BlockchainMonitor {
  if (!monitorInstance) {
    monitorInstance = new BlockchainMonitor()
  }
  return monitorInstance
}
