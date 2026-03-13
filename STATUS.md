# 邮箱验证功能 - 测试总结

## 当前状态

✅ **代码已完成**
- 邮箱验证功能已实现
- 数据库 schema 已更新（包含 emailVerified, verificationToken, tokenExpiresAt）
- 前端页面已创建（注册页面、验证页面）
- API 端点已实现（注册、验证、重发验证邮件）

✅ **代码已上传到 GitHub**
- 仓库: https://github.com/irisblue-leo/or
- 包含 SSL 证书
- 包含部署脚本

✅ **远程数据库已配置**
- 服务器: 43.106.122.27
- 数据库: openclaw_relay
- User 表已创建，包含邮箱验证字段

✅ **部署配置已完成**
- Nginx 配置: nginx/relay.agentopc.xyz.conf
- PM2 配置: ecosystem.config.js
- 部署脚本: deploy.sh

## 本地测试

### 开发服务器
```bash
# 当前运行中
http://localhost:3000
```

### 手动测试步骤
1. 打开浏览器访问: http://localhost:3000/register
2. 填写邮箱和密码进行注册
3. 查看是否显示成功消息
4. 检查邮箱是否收到验证邮件
5. 点击邮件中的验证链接
6. 确认验证成功

### 测试账号建议
- 邮箱: 使用真实邮箱（能收到邮件）
- 密码: 至少8位字符

## 生产部署

### 部署命令
```bash
# 1. SSH 登录服务器
ssh root@43.106.122.27

# 2. 克隆代码
cd /root
git clone https://github.com/irisblue-leo/or.git openclaw-relay
cd openclaw-relay

# 3. 配置环境变量
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

# 4. 执行部署
chmod +x deploy.sh
./deploy.sh
```

### 验证部署
```bash
# 检查应用状态
pm2 status

# 检查 Nginx
systemctl status nginx

# 测试访问
curl https://relay.agentopc.xyz/health

# 测试注册
curl -X POST https://relay.agentopc.xyz/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test123456"}'
```

## 注意事项

### DNS 配置
确保域名 relay.agentopc.xyz 已正确解析到 43.106.122.27

### 防火墙
确保服务器开放了 80 和 443 端口

### 数据库
远程数据库已创建并配置好，包含所有必要的表和字段

### SMTP
使用 QQ 邮箱发送验证邮件，授权码已配置

## 下一步

1. ✅ 在本地浏览器中测试注册功能
2. ⏳ 部署到生产服务器
3. ⏳ 在生产环境测试完整流程
4. ⏳ 监控日志确保稳定运行

## 相关文档

- `EMAIL_VERIFICATION.md` - 邮箱验证功能说明
- `DEPLOY_GUIDE.md` - 详细部署指南
- `QUICK_DEPLOY.md` - 快速部署指南
- `TEST_GUIDE.md` - 测试指南
- `DEPLOYMENT_SUMMARY.md` - 部署总结
