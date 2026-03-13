import { ethers } from 'ethers'
import TronWeb from 'tronweb'
import axios from 'axios'
import { PrismaClient, Prisma } from '@prisma/client'

const prisma = new PrismaClient()

// RPC 配置
const RPC_URLS = {
  ethereum: process.env.ETHEREUM_RPC || 'https://eth.llamarpc.com',
  bsc: process.env.BSC_RPC || 'https://bsc-dataseed.binance.org',
  polygon: process.env.POLYGON_RPC || 'https://polygon-rpc.com',
  tron: process.env.TRON_RPC || 'https://api.trongrid.io'
}

// USDT 合约地址
const USDT_CONTRACTS = {
  ethereum: '0xdac17f958d2ee523a2206206994597c13d831ec7',
  bsc: '0x55d398326f99059ff775485246999027b3197955',
  polygon: '0xc2132d05d31c914a87c6611c10748aeb04b58e8f',
  tron: 'TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t'
}

// ERC20 ABI（简化版）
const ERC20_ABI = [
  'event Transfer(address indexed from, address indexed to, uint256 value)',
  'function decimals() view returns (uint8)',
  'function balanceOf(address) view returns (uint256)'
]

// 获取代币价格（CoinGecko）
async function getTokenPrice(token: string): Promise<number> {
  try {
    const tokenIds: Record<string, string> = {
      ETH: 'ethereum',
      BNB: 'binancecoin',
      MATIC: 'matic-network',
      TRX: 'tron',
      USDT: 'tether',
      USDC: 'usd-coin',
      BUSD: 'binance-usd'
    }

    const id = tokenIds[token] || token.toLowerCase()
    const response = await axios.get(
      `https://api.coingecko.com/api/v3/simple/price?ids=${id}&vs_currencies=usd`
    )

    return response.data[id]?.usd || 0
  } catch (error) {
    console.error('Failed to get token price:', error)
    return 0
  }
}

// 监听以太坊/BSC/Polygon 充值
export async function watchEVMChain(chain: 'ethereum' | 'bsc' | 'polygon') {
  const provider = new ethers.JsonRpcProvider(RPC_URLS[chain])
  const usdtContract = new ethers.Contract(USDT_CONTRACTS[chain], ERC20_ABI, provider)

  console.log(`[${chain}] Blockchain monitor started`)

  // 获取所有用户的充值地址
  const wallets = await prisma.cryptoWallet.findMany({
    where: { chain }
  })

  const addresses = wallets.map(w => w.address.toLowerCase())
  console.log(`[${chain}] Watching ${addresses.length} addresses`)

  // 监听 USDT 转账事件
  usdtContract.on('Transfer', async (from: string, to: string, value: bigint, event: any) => {
    const toAddress = to.toLowerCase()

    if (addresses.includes(toAddress)) {
      console.log(`[${chain}] USDT transfer detected:`, {
        from,
        to,
        value: value.toString(),
        txHash: event.log.transactionHash
      })

      await handleDeposit({
        chain,
        token: 'USDT',
        toAddress,
        fromAddress: from,
        amount: value,
        txHash: event.log.transactionHash,
        blockNumber: event.log.blockNumber
      })
    }
  })

  // 监听原生代币（ETH/BNB/MATIC）
  provider.on('block', async (blockNumber: number) => {
    const block = await provider.getBlock(blockNumber, true)
    if (!block || !block.transactions) return

    for (const tx of block.transactions) {
      if (typeof tx === 'string') continue

      const toAddress = tx.to?.toLowerCase()
      if (toAddress && addresses.includes(toAddress) && tx.value > 0n) {
        console.log(`[${chain}] Native token transfer detected:`, {
          from: tx.from,
          to: tx.to,
          value: tx.value.toString(),
          txHash: tx.hash
        })

        const tokenSymbol = chain === 'ethereum' ? 'ETH' : chain === 'bsc' ? 'BNB' : 'MATIC'

        await handleDeposit({
          chain,
          token: tokenSymbol,
          toAddress: toAddress,
          fromAddress: tx.from,
          amount: tx.value,
          txHash: tx.hash,
          blockNumber
        })
      }
    }
  })
}

// 监听 TRON 充值
export async function watchTronChain() {
  const tronWeb = new TronWeb({
    fullHost: RPC_URLS.tron
  })

  console.log('[tron] Blockchain monitor started')

  // 获取所有 TRON 地址
  const wallets = await prisma.cryptoWallet.findMany({
    where: { chain: 'tron' }
  })

  const addresses = wallets.map(w => w.address)
  console.log(`[tron] Watching ${addresses.length} addresses`)

  // 轮询检查交易（TRON 不支持 WebSocket）
  setInterval(async () => {
    for (const address of addresses) {
      try {
        // 检查 TRX 转账
        const trxTransactions = await tronWeb.trx.getTransactionsRelated(address, 'all', 10)
        
        for (const tx of trxTransactions) {
          if (tx.ret[0].contractRet === 'SUCCESS' && tx.raw_data.contract[0].type === 'TransferContract') {
            const contract = tx.raw_data.contract[0].parameter.value
            if (contract.to_address === address) {
              await handleDeposit({
                chain: 'tron',
                token: 'TRX',
                toAddress: address,
                fromAddress: contract.owner_address,
                amount: BigInt(contract.amount),
                txHash: tx.txID,
                blockNumber: 0
              })
            }
          }
        }

        // 检查 USDT-TRC20 转账
        const usdtContract = await tronWeb.contract().at(USDT_CONTRACTS.tron)
        const events = await usdtContract.Transfer().watch((err: any, event: any) => {
          if (event && event.result.to === address) {
            handleDeposit({
              chain: 'tron',
              token: 'USDT',
              toAddress: address,
              fromAddress: event.result.from,
              amount: BigInt(event.result.value),
              txHash: event.transaction,
              blockNumber: 0
            })
          }
        })
      } catch (error) {
        console.error(`[tron] Error checking address ${address}:`, error)
      }
    }
  }, 10000) // 每 10 秒检查一次
}

// 处理充值
interface DepositData {
  chain: string
  token: string
  toAddress: string
  fromAddress: string
  amount: bigint
  txHash: string
  blockNumber: number
}

async function handleDeposit(data: DepositData) {
  try {
    // 检查是否已处理
    const existing = await prisma.cryptoDeposit.findUnique({
      where: { txHash: data.txHash }
    })

    if (existing) {
      console.log(`[${data.chain}] Transaction already processed: ${data.txHash}`)
      return
    }

    // 查找用户
    const wallet = await prisma.cryptoWallet.findFirst({
      where: {
        chain: data.chain,
        address: data.toAddress
      }
    })

    if (!wallet) {
      console.error(`[${data.chain}] Wallet not found: ${data.toAddress}`)
      return
    }

    // 计算金额（考虑小数位）
    const decimals = data.token === 'USDT' || data.token === 'USDC' || data.token === 'BUSD' ? 6 : 18
    const amount = Number(data.amount) / Math.pow(10, decimals)

    // 获取 USD 价格
    const price = await getTokenPrice(data.token)
    const amountUsd = amount * price

    // 最小充值金额检查（10 USD）
    if (amountUsd < 10) {
      console.log(`[${data.chain}] Amount too small: ${amountUsd} USD`)
      return
    }

    // 创建充值记录
    const deposit = await prisma.cryptoDeposit.create({
      data: {
        userId: wallet.userId,
        chain: data.chain,
        token: data.token,
        amount: new Prisma.Decimal(amount),
        amountUsd: new Prisma.Decimal(amountUsd),
        txHash: data.txHash,
        fromAddress: data.fromAddress,
        toAddress: data.toAddress,
        status: 'pending',
        confirmations: 0
      }
    })

    console.log(`[${data.chain}] Deposit created:`, {
      id: deposit.id,
      amount: `${amount} ${data.token}`,
      amountUsd: `$${amountUsd}`,
      txHash: data.txHash
    })

    // 等待确认
    await waitForConfirmations(data.chain, data.txHash, deposit.id)
  } catch (error) {
    console.error(`[${data.chain}] Failed to handle deposit:`, error)
  }
}

// 等待区块确认
async function waitForConfirmations(chain: string, txHash: string, depositId: string) {
  const requiredConfirmations = 12
  let confirmations = 0

  const checkInterval = setInterval(async () => {
    try {
      if (chain === 'tron') {
        // TRON 确认检查
        confirmations = 19 // TRON 确认很快，直接标记为已确认
      } else {
        // EVM 链确认检查
        const provider = new ethers.JsonRpcProvider(RPC_URLS[chain as 'ethereum' | 'bsc' | 'polygon'])
        const receipt = await provider.getTransactionReceipt(txHash)
        
        if (receipt) {
          const currentBlock = await provider.getBlockNumber()
          confirmations = currentBlock - receipt.blockNumber + 1
        }
      }

      // 更新确认数
      await prisma.cryptoDeposit.update({
        where: { id: depositId },
        data: { confirmations }
      })

      console.log(`[${chain}] Confirmations: ${confirmations}/${requiredConfirmations} (${txHash})`)

      // 达到要求的确认数
      if (confirmations >= requiredConfirmations) {
        clearInterval(checkInterval)

        const deposit = await prisma.cryptoDeposit.findUnique({
          where: { id: depositId }
        })

        if (!deposit) return

        // 更新状态为已确认
        await prisma.cryptoDeposit.update({
          where: { id: depositId },
          data: {
            status: 'confirmed',
            confirmedAt: new Date()
          }
        })

        // 更新用户余额
        await prisma.user.update({
          where: { id: deposit.userId },
          data: {
            balance: {
              increment: deposit.amountUsd.toNumber()
            }
          }
        })

        // 创建交易记录
        await prisma.transaction.create({
          data: {
            userId: deposit.userId,
            type: 'topup',
            amount: deposit.amountUsd.toNumber(),
            note: `Crypto deposit: ${deposit.amount} ${deposit.token} on ${deposit.chain} (${txHash})`
          }
        })

        console.log(`[${chain}] Deposit confirmed and credited:`, {
          depositId,
          amount: `$${deposit.amountUsd}`,
          txHash
        })

        // TODO: 发送通知给用户
      }
    } catch (error) {
      console.error(`[${chain}] Error checking confirmations:`, error)
    }
  }, 15000) // 每 15 秒检查一次
}

// 启动所有监听器
export async function startBlockchainMonitors() {
  console.log('Starting blockchain monitors...')

  try {
    await Promise.all([
      watchEVMChain('ethereum'),
      watchEVMChain('bsc'),
      watchEVMChain('polygon'),
      watchTronChain()
    ])

    console.log('All blockchain monitors started successfully')
  } catch (error) {
    console.error('Failed to start blockchain monitors:', error)
    throw error
  }
}

// 优雅关闭
process.on('SIGTERM', async () => {
  console.log('Shutting down blockchain monitors...')
  await prisma.$disconnect()
  process.exit(0)
})

process.on('SIGINT', async () => {
  console.log('Shutting down blockchain monitors...')
  await prisma.$disconnect()
  process.exit(0)
})
