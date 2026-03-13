# 邮箱验证功能测试指南

## 环境配置

### 本地测试环境
```env
DATABASE_URL="postgresql://shodan@localhost:5432/openclaw_relay"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

### 生产环境（服务器）
```env
DATABASE_URL="postgresql://postgres:!AgentOPC2026@localhost:5432/openclaw_relay"
NEXT_PUBLIC_APP_URL="https://relay.agentopc.xyz"
```

## 测试步骤

### 1. 本地测试

#### 启动开发服务器
```bash
pnpm dev
```

#### 测试注册功能
1. 打开浏览器访问: http://localhost:3000/register
2. 填写测试邮箱和密码
3. 点击注册按钮
4. 查看是否显示成功消息
5. 检查邮箱是否收到验证邮件

#### 测试邮箱验证
1. 打开验证邮件
2. 点击验证链接
3. 应该跳转到验证成功页面

#### 测试重发验证邮件
```bash
# 获取 token（从注册响应中）
TOKEN="your-jwt-token"

# 重发验证邮件
curl -X POST http://localhost:3000/api/auth/resend-verification \
  -H "Authorization: Bearer $TOKEN"
```

### 2. API 测试

#### 注册 API
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test123456",
    "name": "Test User"
  }'
```

预期响应：
```json
{
  "token": "jwt-token",
  "user": {
    "id": "user-id",
    "email": "test@example.com",
    "name": "Test User",
    "role": "user",
    "balance": 0,
    "emailVerified": false
  },
  "message": "注册成功，请查收验证邮件"
}
```

#### 验证邮箱 API
```bash
curl "http://localhost:3000/api/auth/verify-email?token=VERIFICATION_TOKEN"
```

预期响应：
```json
{
  "message": "邮箱验证成功"
}
```

#### 重发验证邮件 API
```bash
curl -X POST http://localhost:3000/api/auth/resend-verification \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

预期响应：
```json
{
  "message": "验证邮件已重新发送"
}
```

### 3. 数据库验证

#### 检查用户表
```sql
SELECT id, email, "emailVerified", "verificationToken", "tokenExpiresAt"
FROM "User"
WHERE email = 'test@example.com';
```

#### 验证前
- emailVerified: false
- verificationToken: 有值（64位十六进制字符串）
- tokenExpiresAt: 24小时后的时间戳

#### 验证后
- emailVerified: true
- verificationToken: null
- tokenExpiresAt: null

## 服务器部署测试

### 1. 部署到服务器
```bash
# 克隆代码
ssh root@43.106.122.27
cd /root
git clone https://github.com/irisblue-leo/or.git openclaw-relay
cd openclaw-relay

# 执行部署
./deploy.sh
```

### 2. 测试生产环境
```bash
# 测试注册
curl -X POST https://relay.agentopc.xyz/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test123456"
  }'

# 测试健康检查
curl https://relay.agentopc.xyz/health
```

### 3. 查看日志
```bash
# PM2 日志
pm2 logs openclaw-relay

# Nginx 日志
tail -f /var/log/nginx/relay.agentopc.xyz.access.log
tail -f /var/log/nginx/relay.agentopc.xyz.error.log
```

## 常见问题

### 1. 邮件发送失败
- 检查 SMTP 配置是否正确
- 确认 QQ 邮箱授权码是否有效
- 查看应用日志中的错误信息

### 2. 数据库连接失败
- 本地无法直接连接远程数据库（防火墙限制）
- 需要在服务器上测试
- 或使用 SSH 隧道

### 3. 验证链接无效
- 检查 NEXT_PUBLIC_APP_URL 配置
- 确认 token 未过期（24小时有效期）
- 验证数据库中的 token 是否匹配

## 测试清单

- [ ] 用户注册成功
- [ ] 收到验证邮件
- [ ] 邮件内容正确（包含验证链接）
- [ ] 点击验证链接成功
- [ ] 验证后 emailVerified 变为 true
- [ ] 重发验证邮件功能正常
- [ ] 已验证用户无法重复验证
- [ ] 过期 token 无法验证
- [ ] 无效 token 返回错误

## 下一步

1. 在本地完成所有测试
2. 确认邮件发送正常
3. 部署到生产服务器
4. 在生产环境重新测试
5. 监控日志确保稳定运行
