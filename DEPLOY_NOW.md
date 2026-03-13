# 快速部署到服务器（新加坡）

## 一键部署命令

```bash
# 1. SSH 登录服务器
ssh root@43.106.122.27
# 密码: !2351147520Wy

# 2. 克隆代码
cd /root
git clone https://github.com/irisblue-leo/or.git openclaw-relay
cd openclaw-relay

# 3. 配置环境变量
cat > .env << 'EOF'
DATABASE_URL="postgresql://postgres:!AgentOPC2026@localhost:5432/openclaw_relay"
JWT_SECRET="openclaw-relay-production-secret-$(openssl rand -hex 32)"

# Upstream OpenAI-compatible API
UPSTREAM_API_URL="https://hone.vvvv.ee/v1"
UPSTREAM_API_KEY="sk-n0ZA7JNBbyZMnKJfdj5WNbADKYbISXqKB0jwfDDJxjL9EHHt"
OPENROUTER_API_URL="https://openrouter.ai/api/v1"
OPENROUTER_API_KEY="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"
OPENROUTER_REFERER="https://relay.agentopc.xyz"

# SMTP邮件配置
SMTP_HOST="smtp.qq.com"
SMTP_PORT="465"
SMTP_USER="2351147520@qq.com"
SMTP_PASS="qvmafudxqqehecej"
SMTP_FROM="2351147520@qq.com"

# 应用 URL
NEXT_PUBLIC_APP_URL="https://relay.agentopc.xyz"
EOF

# 4. 执行部署（会自动配置 PostgreSQL）
chmod +x deploy.sh
./deploy.sh
```

## 如果 PostgreSQL 连接有问题

单独运行 PostgreSQL 配置脚本：

```bash
cd /root/openclaw-relay
chmod +x setup-postgres.sh
./setup-postgres.sh
```

## 验证部署

```bash
# 检查 PostgreSQL
systemctl status postgresql
PGPASSWORD='!AgentOPC2026' psql -h localhost -U postgres -d openclaw_relay -c '\dt'

# 检查应用
pm2 status
pm2 logs openclaw-relay --lines 50

# 检查 Nginx
systemctl status nginx
curl https://relay.agentopc.xyz/health

# 测试注册
curl -X POST https://relay.agentopc.xyz/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test123456"}'
```

## 常见问题

### PostgreSQL 连接失败
```bash
# 运行诊断
cd /root/openclaw-relay
bash setup-postgres.sh

# 手动测试连接
PGPASSWORD='!AgentOPC2026' psql -h localhost -U postgres -c '\l'
```

### 应用启动失败
```bash
# 查看日志
pm2 logs openclaw-relay --lines 100

# 重启应用
pm2 restart openclaw-relay

# 重新构建
cd /root/openclaw-relay
pnpm build
pm2 restart openclaw-relay
```

### Nginx 配置错误
```bash
# 测试配置
nginx -t

# 查看错误日志
tail -50 /var/log/nginx/error.log
```

## 更新部署

```bash
cd /root/openclaw-relay
git pull
pnpm install --prod
pnpm build
npx prisma generate
npx prisma db push
pm2 restart openclaw-relay
```

## 监控

```bash
# 实时日志
pm2 logs openclaw-relay

# 应用状态
pm2 monit

# 系统资源
htop
```
