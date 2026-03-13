# 加密货币充值功能

## 概述

OpenClaw Relay 支持通过多个区块链网络进行真实的加密货币充值。系统会自动监控链上交易并在确认后自动为用户账户充值。

## 支持的区块链

- **Ethereum**: ETH, USDT
- **BSC (Binance Smart Chain)**: BNB, USDT, BUSD
- **TRON**: TRX, USDT
- **Polygon**: MATIC, USDC
- **Solana**: SOL, USDC

## 工作原理

### 1. 充值地址生成

系统为每个区块链网络维护固定的充值地址。用户可以通过前端页面获取对应网络的充值地址。

### 2. 区块链监控

后台服务 `BlockchainMonitor` 会定期（每30秒）扫描各个区块链网络，检测发送到充值地址的交易。

### 3. 交易确认

- 检测到新交易后，系统会创建一个 `pending` 状态的充值记录
- 等待足够的区块确认（不同链的确认数要求不同）
- 达到最小确认数后，状态变更为 `confirmed`

### 4. 自动入账

交易确认后，系统会自动：
- 更新用户余额
- 创建交易记录
- 发送通知（如果配置了）

## 最小确认数要求

| 区块链 | 最小确认数 | 预计时间 |
|--------|-----------|---------|
| Ethereum | 12 | ~3分钟 |
| BSC | 15 | ~45秒 |
| TRON | 19 | ~1分钟 |
| Polygon | 128 | ~5分钟 |
| Solana | 32 | ~15秒 |

## 配置说明

### 环境变量

在 `.env` 文件中配置：

```bash
# 启用区块链监控
ENABLE_BLOCKCHAIN_MONITOR="true"

# RPC 端点（可选，使用公共 RPC 或配置付费服务）
ETHEREUM_RPC="https://eth.llamarpc.com"
BSC_RPC="https://bsc-dataseed.binance.org"
POLYGON_RPC="https://polygon-rpc.com"
TRON_RPC="https://api.trongrid.io"
SOLANA_RPC="https://api.mainnet-beta.solana.com"

# 推荐使用付费 RPC 服务以获得更好的可靠性：
# ETHEREUM_RPC="https://mainnet.infura.io/v3/YOUR_INFURA_KEY"
# POLYGON_RPC="https://polygon-mainnet.g.alchemy.com/v2/YOUR_ALCHEMY_KEY"
```

### 启动监控服务

监控服务会在以下情况自动启动：

1. 生产环境 (`NODE_ENV=production`)
2. 或设置了 `ENABLE_BLOCKCHAIN_MONITOR=true`

也可以通过管理员 API 手动控制：

```bash
# 启动监控
curl -X POST http://localhost:3000/api/admin/blockchain-monitor \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"action": "start"}'

# 停止监控
curl -X POST http://localhost:3000/api/admin/blockchain-monitor \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"action": "stop"}'
```

## 代币合约地址

系统已配置以下代币合约：

### Ethereum
- USDT: `0xdac17f958d2ee523a2206206994597c13d831ec7`

### BSC
- USDT: `0x55d398326f99059ff775485246999027b3197955`
- BUSD: `0xe9e7cea3dedca5984780bafc599bd69add087d56`

### TRON
- USDT (TRC20): `TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t`

### Polygon
- USDC: `0x2791bca1f2de4661ed88a30c99a7a9449aa84174`

## 数据库表结构

### CryptoWallet

存储用户的充值地址：

```prisma
model CryptoWallet {
  id        String   @id @default(uuid())
  userId    String
  chain     String   // ethereum, bsc, tron, polygon, solana
  address   String
  createdAt DateTime @default(now())

  @@unique([userId, chain])
}
```

### CryptoDeposit

存储充值记录：

```prisma
model CryptoDeposit {
  id            String    @id @default(uuid())
  userId        String
  chain         String
  token         String
  amount        Decimal   @db.Decimal(18, 8)
  amountUsd     Decimal   @db.Decimal(18, 2)
  txHash        String    @unique
  fromAddress   String
  toAddress     String
  status        String    @default("pending") // pending, confirmed, failed
  confirmations Int       @default(0)
  createdAt     DateTime  @default(now())
  confirmedAt   DateTime?

  @@index([userId])
  @@index([status])
}
```

## API 端点

### 获取充值地址

```
GET /api/crypto/wallet/{chain}
Authorization: Bearer {token}
```

返回：
```json
{
  "chain": "ethereum",
  "address": "0x...",
  "qrCode": "https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=0x..."
}
```

### 查看充值历史

```
GET /api/crypto/deposit/history
Authorization: Bearer {token}
```

返回：
```json
{
  "deposits": [
    {
      "id": "...",
      "chain": "ethereum",
      "token": "USDT",
      "amount": 100,
      "amountUsd": 100,
      "txHash": "0x...",
      "status": "confirmed",
      "confirmations": 12,
      "createdAt": "2026-03-13T...",
      "confirmedAt": "2026-03-13T..."
    }
  ]
}
```

## 安全注意事项

1. **私钥管理**: 充值地址使用固定地址，确保私钥安全存储
2. **RPC 安全**: 使用可信的 RPC 端点，避免中间人攻击
3. **确认数**: 不要降低最小确认数要求，以防止双花攻击
4. **监控日志**: 定期检查监控日志，确保服务正常运行
5. **余额检查**: 定期核对链上余额与数据库记录

## 故障排查

### 监控服务未启动

检查：
1. `ENABLE_BLOCKCHAIN_MONITOR` 是否设置为 `true`
2. 查看服务器日志是否有错误信息
3. 确认 RPC 端点可访问

### 交易未被检测

检查：
1. 交易是否已在链上确认
2. 充值地址是否正确
3. 代币合约地址是否正确配置
4. RPC 端点是否正常工作

### 余额未自动到账

检查：
1. 交易确认数是否达到要求
2. 数据库中充值记录的状态
3. 服务器日志中是否有错误

## 性能优化建议

1. **使用付费 RPC**: 公共 RPC 可能有速率限制，建议使用 Infura、Alchemy 等付费服务
2. **调整扫描间隔**: 根据实际需求调整监控间隔（默认30秒）
3. **数据库索引**: 确保 `txHash`、`userId`、`status` 字段有索引
4. **缓存优化**: 缓存最近处理的区块号，避免重复扫描

## 未来改进

- [ ] 支持更多代币（DAI, USDC 等）
- [ ] 添加 Webhook 通知
- [ ] 实现充值金额限制
- [ ] 添加反洗钱（AML）检查
- [ ] 支持批量处理交易
- [ ] 添加充值手续费计算
