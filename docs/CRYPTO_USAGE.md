# 真实加密货币充值使用指南

## 快速开始

### 1. 启用区块链监控

在 `.env` 文件中添加：

```bash
ENABLE_BLOCKCHAIN_MONITOR=true
```

### 2. 配置 RPC 端点（可选）

为了获得更好的性能和可靠性，建议配置付费 RPC 服务：

```bash
# Ethereum (推荐使用 Infura 或 Alchemy)
ETHEREUM_RPC="https://mainnet.infura.io/v3/YOUR_KEY"

# BSC
BSC_RPC="https://bsc-dataseed.binance.org"

# Polygon (推荐使用 Alchemy)
POLYGON_RPC="https://polygon-mainnet.g.alchemy.com/v2/YOUR_KEY"

# TRON
TRON_RPC="https://api.trongrid.io"

# Solana (推荐使用 QuickNode)
SOLANA_RPC="https://api.mainnet-beta.solana.com"
```

### 3. 启动服务

```bash
pnpm install
pnpm build
pnpm start
```

监控服务会自动启动并开始扫描区块链交易。

## 用户充值流程

### 步骤 1: 获取充值地址

1. 用户登录后访问 `/dashboard/crypto`
2. 选择要使用的区块链网络（Ethereum、BSC、TRON、Polygon、Solana）
3. 系统显示该网络的充值地址和二维码

### 步骤 2: 发送加密货币

用户从自己的钱包向显示的地址发送支持的代币：

- **Ethereum**: USDT
- **BSC**: USDT, BUSD
- **TRON**: USDT (TRC20)
- **Polygon**: USDC
- **Solana**: USDC

### 步骤 3: 等待确认

- 交易提交后，系统会在下一次扫描时检测到（最多30秒）
- 创建 `pending` 状态的充值记录
- 等待足够的区块确认

### 步骤 4: 自动到账

达到最小确认数后：
- 充值状态变更为 `confirmed`
- 用户余额自动增加
- 创建交易记录

## 监控和管理

### 查看充值记录

**用户端**:
- 访问 `/dashboard/crypto/history` 查看个人充值记录

**管理员端**:
- 访问 `/admin` 并切换到"虚拟货币"标签
- 查看所有用户的充值记录
- 查看统计数据（总充值金额、笔数、待确认数）

### 手动控制监控服务

使用管理员 API：

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

## 测试

### 运行测试脚本

```bash
node scripts/test-blockchain-monitor.js
```

这个脚本会：
1. 检查数据库连接
2. 列出现有钱包和充值记录
3. 启动监控服务运行60秒
4. 检查是否有新的充值

### 测试充值

1. 在测试网络上进行小额充值测试
2. 或在主网上发送最小金额（如 10 USDT）
3. 观察日志输出，确认交易被检测到
4. 等待确认后检查余额是否到账

## 常见问题

### Q: 充值多久能到账？

A: 取决于区块链网络的确认速度：
- Solana: ~15秒（32确认）
- BSC: ~45秒（15确认）
- TRON: ~1分钟（19确认）
- Ethereum: ~3分钟（12确认）
- Polygon: ~5分钟（128确认）

### Q: 支持哪些代币？

A: 目前支持主流稳定币：
- USDT (Ethereum, BSC, TRON)
- USDC (Polygon, Solana)
- BUSD (BSC)

### Q: 如何添加新的代币支持？

A: 在 `src/lib/blockchain-monitor.ts` 的 `TOKEN_CONTRACTS` 中添加代币合约地址。

### Q: 监控服务占用多少资源？

A: 非常少。每30秒扫描一次，每次只查询最近的交易。建议使用付费 RPC 以避免速率限制。

### Q: 如何确保安全？

A:
1. 使用固定的充值地址，私钥离线保存
2. 定期核对链上余额与数据库记录
3. 监控异常交易和大额充值
4. 启用双因素认证
5. 定期备份数据库

## 生产环境建议

1. **使用付费 RPC 服务**
   - Infura (Ethereum)
   - Alchemy (Ethereum, Polygon)
   - QuickNode (多链支持)

2. **设置监控告警**
   - 监控服务运行状态
   - 大额充值通知
   - 异常交易告警

3. **定期维护**
   - 检查 RPC 端点可用性
   - 清理旧的充值记录
   - 更新代币合约地址

4. **备份策略**
   - 每日数据库备份
   - 保存关键交易记录
   - 定期导出充值数据

## 技术支持

如有问题，请查看：
- 详细文档: `docs/CRYPTO_DEPOSIT.md`
- 服务器日志: 检查监控服务的输出
- 数据库记录: 查询 `CryptoDeposit` 表

或联系技术支持团队。
