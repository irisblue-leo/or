# 启用虚拟货币充值功能

## 快速开始

虚拟货币充值功能已经完全实现，只需要启用即可使用。

### 1. 配置环境变量

编辑 `.env` 文件，设置：

```bash
# 启用区块链监控服务
ENABLE_BLOCKCHAIN_MONITOR=true
```

### 2. 重启服务

```bash
# 如果使用 PM2
pm2 restart all

# 或者直接重启
pnpm build
pnpm start
```

### 3. 验证服务启动

查看日志，应该看到：

```
Starting blockchain monitor...
Blockchain monitor started successfully
```

## 工作原理

1. **用户充值流程**：
   - 用户访问 `/dashboard/crypto`
   - 选择区块链网络（Ethereum、BSC、TRON、Polygon、Solana）
   - 获取专属充值地址和二维码
   - 从钱包发送 USDT/USDC 等稳定币到该地址
   - 系统自动检测交易并在确认后入账

2. **自动监控**：
   - 监控服务每 30 秒扫描一次所有支持的区块链
   - 检测到新交易后创建充值记录
   - 等待足够的区块确认（防止双花攻击）
   - 确认后自动更新用户余额

3. **安全保障**：
   - 使用固定充值地址（私钥离线管理）
   - 要求最小确认数（Ethereum: 12, BSC: 15, TRON: 19, Polygon: 128, Solana: 32）
   - 交易哈希唯一性检查
   - 完整的审计日志

## 支持的代币

| 区块链 | 代币 | 到账时间 |
|--------|------|---------|
| Ethereum | USDT | ~3分钟 |
| BSC | USDT, BUSD | ~45秒 |
| TRON | USDT (TRC20) | ~1分钟 |
| Polygon | USDC | ~5分钟 |
| Solana | USDC | ~15秒 |

## 测试充值

### 方法 1：使用测试网络（推荐）

1. 修改 `src/lib/wallet.js` 中的地址为测试网地址
2. 配置测试网 RPC 端点
3. 使用测试网水龙头获取测试币
4. 发送测试交易

### 方法 2：主网小额测试

1. 发送小额 USDT（如 10 USDT）到充值地址
2. 观察日志确认交易被检测
3. 检查 `/dashboard/crypto/history` 查看充值记录
4. 验证余额是否正确到账

## 管理功能

### 查看充值记录

管理员可以在 `/admin` 页面的"虚拟货币"标签查看所有用户的充值记录。

### 控制监控服务

使用 API 手动启动/停止监控服务：

```bash
# 启动
curl -X POST http://localhost:3000/api/admin/blockchain-monitor \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"action": "start"}'

# 停止
curl -X POST http://localhost:3000/api/admin/blockchain-monitor \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"action": "stop"}'
```

## 生产环境建议

### 1. 使用付费 RPC 服务

免费的公共 RPC 可能不稳定，建议使用付费服务：

```bash
# Infura (Ethereum)
ETHEREUM_RPC="https://mainnet.infura.io/v3/YOUR_API_KEY"

# Alchemy (Ethereum, Polygon)
ETHEREUM_RPC="https://eth-mainnet.g.alchemy.com/v2/YOUR_API_KEY"
POLYGON_RPC="https://polygon-mainnet.g.alchemy.com/v2/YOUR_API_KEY"

# QuickNode (多链支持)
BSC_RPC="https://YOUR_ENDPOINT.bsc.quiknode.pro/YOUR_API_KEY/"
```

### 2. 配置监控告警

设置告警通知，当出现以下情况时及时处理：
- 监控服务停止
- RPC 连接失败
- 大额充值（需要人工审核）
- 异常交易模式

### 3. 定期核对

建议每天核对：
- 链上实际余额
- 数据库记录的充值总额
- 用户余额总和

### 4. 备份策略

- 定期备份数据库
- 保存充值地址私钥的离线备份
- 记录所有充值交易的哈希

## 故障排查

### 监控服务未启动

检查：
1. `ENABLE_BLOCKCHAIN_MONITOR` 是否设置为 `true`
2. 查看服务器启动日志
3. 确认 RPC 端点可访问

```bash
# 测试 RPC 连接
curl -X POST https://eth.llamarpc.com \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}'
```

### 交易未被检测

1. 确认交易已在链上确认（使用区块浏览器）
2. 检查充值地址是否正确
3. 验证代币合约地址配置（`src/lib/blockchain-monitor.ts`）
4. 查看监控服务日志

### 余额未到账

1. 检查交易确认数是否足够
2. 查看数据库 `CryptoDeposit` 表的记录状态
3. 检查服务器日志中的错误信息

## 安全注意事项

⚠️ **重要**：

1. **私钥管理**：充值地址的私钥必须安全存储，建议使用硬件钱包或冷存储
2. **不要降低确认数**：最小确认数是防止双花攻击的关键
3. **使用 HTTPS**：确保所有 RPC 连接使用 HTTPS
4. **监控异常**：设置告警监控大额充值和异常交易
5. **定期审计**：定期核对链上余额与数据库记录

## 相关文档

- 详细技术文档：`CRYPTO_IMPLEMENTATION.md`
- 技术实现细节：`docs/CRYPTO_DEPOSIT.md`
- 使用指南：`docs/CRYPTO_USAGE.md`
- 测试脚本：`scripts/test-blockchain-monitor.js`

## 需要帮助？

如有问题：
1. 查看详细文档
2. 检查服务器日志
3. 运行测试脚本诊断：`node scripts/test-blockchain-monitor.js`
