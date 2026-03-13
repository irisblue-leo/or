# 🎉 OpenClaw Relay - 部署就绪

## ✅ 已完成的工作

### 1. 邮箱验证功能
- ✅ 用户注册时发送验证邮件
- ✅ 邮箱验证 API
- ✅ 重发验证邮件功能
- ✅ 验证成功/失败页面
- ✅ 数据库字段（emailVerified, verificationToken, tokenExpiresAt）

### 2. 数据库配置
- ✅ 远程数据库已创建（43.106.122.27）
- ✅ User 表已创建，包含邮箱验证字段
- ✅ PostgreSQL 自动配置脚本
- ✅ 数据库连接测试脚本

### 3. 部署配置
- ✅ Nginx 配置（SSL + 反向代理）
- ✅ PM2 配置（进程管理）
- ✅ 自动化部署脚本
- ✅ SSL 证书已包含

### 4. 代码仓库
- ✅ GitHub: https://github.com/irisblue-leo/or
- ✅ 所有代码已提交
- ✅ SSL 证书已上传
- ✅ 部署脚本已包含

## 📋 部署步骤

### 方式一：一键部署（推荐）

```bash
ssh root@43.106.122.27
cd /root
git clone https://github.com/irisblue-leo/or.git openclaw-relay
cd openclaw-relay

# 创建 .env 文件
cat > .env << 'EOF'
DATABASE_URL="postgresql://postgres:!AgentOPC2026@localhost:5432/openclaw_relay"
JWT_SECRET="openclaw-relay-production-secret"
UPSTREAM_API_URL="https://hone.vvvv.ee/v1"
UPSTREAM_API_KEY="sk-n0ZA7JNBbyZMnKJfdj5WNbADKYbISXqKB0jwfDDJxjL9EHHt"
OPENROUTER_API_URL="https://openrouter.ai/api/v1"
OPENROUTER_API_KEY="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"
OPENROUTER_REFERER="https://relay.agentopc.xyz"
SMTP_HOST="smtp.qq.com"
SMTP_PORT="465"
SMTP_USER="2351147520@qq.com"
SMTP_PASS="qvmafudxqqehecej"
SMTP_FROM="2351147520@qq.com"
NEXT_PUBLIC_APP_URL="https://relay.agentopc.xyz"
EOF

# 执行部署
chmod +x deploy.sh
./deploy.sh
```

### 方式二：手动部署

查看 `DEPLOY_GUIDE.md` 获取详细步骤。

## 🔍 验证部署

```bash
# 1. 检查 PostgreSQL
systemctl status postgresql
PGPASSWORD='!AgentOPC2026' psql -h localhost -U postgres -d openclaw_relay -c '\dt'

# 2. 检查应用
pm2 status
pm2 logs openclaw-relay

# 3. 检查 Nginx
systemctl status nginx

# 4. 测试访问
curl https://relay.agentopc.xyz/health

# 5. 测试注册
curl -X POST https://relay.agentopc.xyz/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test123456"}'
```

## 📚 文档索引

| 文档 | 说明 |
|------|------|
| `DEPLOY_NOW.md` | 🚀 快速部署指南（推荐） |
| `DEPLOY_GUIDE.md` | 📖 详细部署文档 |
| `POSTGRES_SETUP.md` | 🗄️ PostgreSQL 配置指南 |
| `EMAIL_VERIFICATION.md` | 📧 邮箱验证功能说明 |
| `TEST_GUIDE.md` | 🧪 测试指南 |
| `STATUS.md` | 📊 当前状态总结 |
| `QUICK_DEPLOY.md` | ⚡ 快速部署命令 |

## 🛠️ 常用命令

### PM2 管理
```bash
pm2 status                    # 查看状态
pm2 logs openclaw-relay       # 查看日志
pm2 restart openclaw-relay    # 重启应用
pm2 stop openclaw-relay       # 停止应用
pm2 monit                     # 监控
```

### Nginx 管理
```bash
nginx -t                      # 测试配置
systemctl reload nginx        # 重新加载
systemctl restart nginx       # 重启
systemctl status nginx        # 查看状态
```

### 数据库管理
```bash
# 连接数据库
PGPASSWORD='!AgentOPC2026' psql -h localhost -U postgres -d openclaw_relay

# 查看表
\dt

# 查看用户
SELECT id, email, "emailVerified" FROM "User";

# 退出
\q
```

### 更新部署
```bash
cd /root/openclaw-relay
git pull
pnpm install --prod
pnpm build
npx prisma generate
npx prisma db push
pm2 restart openclaw-relay
```

## ⚠️ 注意事项

### DNS 配置
确保域名 `relay.agentopc.xyz` 已正确解析到 `43.106.122.27`

### 防火墙
确保开放以下端口：
- 80 (HTTP)
- 443 (HTTPS)
- 22 (SSH)

### PostgreSQL
- 数据库服务器在新加坡
- 使用本地连接（localhost）
- 不要从外部直接连接

### SMTP
- 使用 QQ 邮箱发送验证邮件
- 授权码已配置
- 确保网络可以访问 smtp.qq.com

## 🎯 下一步

1. ✅ 代码已准备好
2. ⏳ 部署到服务器（运行 `./deploy.sh`）
3. ⏳ 测试注册和邮箱验证功能
4. ⏳ 监控日志确保稳定运行

## 📞 需要帮助？

如果遇到问题：
1. 查看相关文档
2. 检查日志：`pm2 logs openclaw-relay`
3. 运行诊断脚本：`./setup-postgres.sh`

---

**准备就绪！现在可以开始部署了。** 🚀
