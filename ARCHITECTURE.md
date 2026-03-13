# 系统架构说明

## 流量路由逻辑

OpenClaw Relay 使用**环境变量配置**的上游 API 来处理所有流量。

### 上游 API 配置

系统从以下环境变量获取上游 API 配置：

```bash
# 主要上游 API（处理大部分模型）
UPSTREAM_API_URL="https://hone.vvvv.ee/v1"
UPSTREAM_API_KEY="sk-n0ZA7JNBbyZMnKJfdj5WNbADKYbISXqKB0jwfDDJxjL9EHHt"

# OpenRouter API（处理 OpenRouter 模型）
OPENROUTER_API_URL="https://openrouter.ai/api/v1"
OPENROUTER_API_KEY="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"
OPENROUTER_REFERER="https://openclaw-relay.com"
```

### 路由规则

1. **模型的 `provider` 字段决定使用哪个上游 API**：
   - `provider: "openai"` → 使用 `UPSTREAM_API_URL`
   - `provider: "anthropic"` → 使用 `UPSTREAM_API_URL`
   - `provider: "google"` → 使用 `UPSTREAM_API_URL`
   - `provider: "openrouter"` → 使用 `OPENROUTER_API_URL`

2. **所有流量都通过环境变量配置的 API**，不使用数据库的 Provider 配置

3. **数据库的 Provider 表仅用于管理后台显示**，不影响实际路由

### 代理配置

OpenRouter 请求会自动使用代理（如果配置了）：

```bash
HTTP_PROXY="http://127.0.0.1:7890"
HTTPS_PROXY="http://127.0.0.1:7890"
```

### 模型配置示例

在数据库中，模型配置如下：

```sql
INSERT INTO "Model" (name, provider, inputPrice, outputPrice, upstreamInput, upstreamOutput, active)
VALUES
  -- 这些模型会路由到 UPSTREAM_API_URL
  ('claude-opus-4-6', 'openai', 15.00, 75.00, 12.00, 60.00, true),
  ('gpt-4o', 'openai', 2.50, 10.00, 2.00, 8.00, true),

  -- 这些模型会路由到 OPENROUTER_API_URL
  ('claude-3-opus-20240229', 'openrouter', 15.00, 75.00, 12.00, 60.00, true);
```

### 请求流程

```
用户请求
  ↓
API Key 验证
  ↓
模型查询（从数据库）
  ↓
根据 provider 字段选择上游 API
  ↓
  ├─ provider="openai" → UPSTREAM_API_URL
  ├─ provider="anthropic" → UPSTREAM_API_URL
  ├─ provider="google" → UPSTREAM_API_URL
  └─ provider="openrouter" → OPENROUTER_API_URL
  ↓
转发请求到上游 API
  ↓
记录用量和扣费
  ↓
返回响应给用户
```

### 智能路由（可选）

如果启用智能路由模式（`router_mode: "smart"`），系统会：

1. 分析请求内容（消息长度、复杂度等）
2. 匹配路由规则
3. 自动选择最合适的模型
4. 仍然使用环境变量配置的上游 API

### 定价配置

每个模型有两套定价：

- **用户定价**（`inputPrice`, `outputPrice`）：向用户收费的价格
- **上游定价**（`upstreamInput`, `upstreamOutput`）：上游 API 的成本

差价即为利润。

### 管理后台

管理后台的"接口管理"页面显示的 Provider 配置**仅用于展示**，不影响实际的流量路由。

实际路由完全由环境变量控制：
- `UPSTREAM_API_URL` + `UPSTREAM_API_KEY`
- `OPENROUTER_API_URL` + `OPENROUTER_API_KEY`

### 修改上游 API

如果需要更换上游 API：

1. 修改 `.env` 文件中的环境变量
2. 重启服务：`pm2 restart all`
3. 无需修改数据库配置

### 安全建议

1. **保护 API Key**：不要将 `.env` 文件提交到 Git
2. **使用强密钥**：定期轮换 `UPSTREAM_API_KEY` 和 `OPENROUTER_API_KEY`
3. **监控用量**：定期检查上游 API 的用量和费用
4. **设置告警**：当用量异常时及时通知

## 相关文件

- `src/app/api/relay/v1/chat/completions/route.ts` - 主要路由逻辑
- `.env` - 环境变量配置
- `prisma/schema.prisma` - 数据库模型定义
