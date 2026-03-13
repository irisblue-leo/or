const { ethers } = require('ethers')
const TronWeb = require('tronweb')
const { Keypair } = require('@solana/web3.js')
const crypto = require('crypto')

// 固定充值地址（所有用户共用，通过链区分）
const FIXED_ADDRESSES = {
  solana: '3WjY9e4URD5GYiKvFKQ9BiGFiHrNChWWnMT33PxHZrRT',
  ethereum: '0x9a7136f7c48d15b01e0d3ab312d3cbf29e63abfc',
  bsc: '0x9a7136f7c48d15b01e0d3ab312d3cbf29e63abfc',
  polygon: '0x9a7136f7c48d15b01e0d3ab312d3cbf29e63abfc',
  tron: 'TJP4eFUn4rfvx3cRXXJPNqvzkHTVwMaVM6'
}

// 生成钱包地址（返回固定地址）
function generateWalletAddress(userId, chain) {
  // 返回固定地址，所有用户共用
  return FIXED_ADDRESSES[chain] || FIXED_ADDRESSES.ethereum
}

// 验证地址格式
function isValidAddress(address, chain) {
  try {
    if (chain === 'tron') {
      const tronWeb = new TronWeb({
        fullHost: 'https://api.trongrid.io'
      })
      return tronWeb.isAddress(address)
    } else if (chain === 'solana') {
      // Solana 地址是 Base58 编码，长度 32-44 字符
      return /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(address)
    } else {
      return ethers.isAddress(address)
    }
  } catch {
    return false
  }
}

// 获取地址余额
async function getAddressBalance(address, chain, token) {
  try {
    if (chain === 'tron') {
      const tronWeb = new TronWeb({
        fullHost: 'https://api.trongrid.io'
      })

      if (token) {
        // TRC20 代币余额
        const contract = await tronWeb.contract().at(token)
        const balance = await contract.balanceOf(address).call()
        return balance.toString()
      } else {
        // TRX 余额
        const balance = await tronWeb.trx.getBalance(address)
        return balance.toString()
      }
    } else if (chain === 'solana') {
      // Solana 余额查询
      const { Connection, PublicKey } = require('@solana/web3.js')
      const connection = new Connection(
        process.env.SOLANA_RPC || 'https://api.mainnet-beta.solana.com'
      )

      if (token) {
        // SPL Token 余额
        const { getAssociatedTokenAddress, getAccount } = require('@solana/spl-token')
        const tokenMint = new PublicKey(token)
        const ownerPubkey = new PublicKey(address)
        const tokenAccount = await getAssociatedTokenAddress(tokenMint, ownerPubkey)
        const account = await getAccount(connection, tokenAccount)
        return account.amount.toString()
      } else {
        // SOL 余额
        const pubkey = new PublicKey(address)
        const balance = await connection.getBalance(pubkey)
        return balance.toString()
      }
    } else {
      // EVM 链
      const rpcUrls = {
        ethereum: process.env.ETHEREUM_RPC || 'https://eth.llamarpc.com',
        bsc: process.env.BSC_RPC || 'https://bsc-dataseed.binance.org',
        polygon: process.env.POLYGON_RPC || 'https://polygon-rpc.com'
      }

      const provider = new ethers.JsonRpcProvider(rpcUrls[chain])

      if (token) {
        // ERC20 代币余额
        const contract = new ethers.Contract(
          token,
          ['function balanceOf(address) view returns (uint256)'],
          provider
        )
        const balance = await contract.balanceOf(address)
        return balance.toString()
      } else {
        // 原生代币余额
        const balance = await provider.getBalance(address)
        return balance.toString()
      }
    }
  } catch (error) {
    console.error('Failed to get balance:', error)
    return '0'
  }
}

module.exports = {
  generateWalletAddress,
  isValidAddress,
  getAddressBalance
}
