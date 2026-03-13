# OpenClaw Relay 部署文档

## 服务器信息
- 服务器 IP: 43.106.122.27
- 域名: relay.agentopc.xyz
- 用户: root
- 密码: !2351147520Wy

## 部署步骤

### 1. 上传代码到服务器

```bash
# 在本地执行
rsync -avz --exclude 'node_modules' --exclude '.next' --exclude '.git' \
  /Users/shodan/project/openclaw-relay/ \
  root@43.106.122.27:/root/openclaw-relay/
```

或者使用 Git：

```bash
# 在服务器上执行
cd /root
git clone <your-repo-url> openclaw-relay
cd openclaw-relay
```

### 2. 安装依赖

```bash
# SSH 登录服务器
ssh root@43.106.122.27

# 安装 Node.js (如果未安装)
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt-get install -y nodejs

# 安装 pnpm
npm install -g pnpm

# 安装 PM2
npm install -g pm2

# 安装 Nginx (如果未安装)
apt-get install -y nginx
```

### 3. 配置环境变量

```bash
cd /root/openclaw-relay

# 创建 .env 文件
cat > .env << 'EOF'
DATABASE_URL="postgresql://postgres:!AgentOPC2026@localhost:5432/openclaw_relay"
JWT_SECRET="openclaw-relay-production-secret-change-me"

# Upstream OpenAI-compatible API
UPSTREAM_API_URL="https://hone.vvvv.ee/v1"
UPSTREAM_API_KEY="sk-n0ZA7JNBbyZMnKJfdj5WNbADKYbISXqKB0jwfDDJxjL9EHHt"
OPENROUTER_API_URL="https://openrouter.ai/api/v1"
OPENROUTER_API_KEY="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"
OPENROUTER_REFERER="https://relay.agentopc.xyz"

# Proxy for OpenRouter
HTTPS_PROXY=http://127.0.0.1:7890
HTTP_PROXY=http://127.0.0.1:7890

# SMTP邮件配置
SMTP_HOST="smtp.qq.com"
SMTP_PORT="465"
SMTP_USER="2351147520@qq.com"
SMTP_PASS="qvmafudxqqehecej"
SMTP_FROM="2351147520@qq.com"

# 应用 URL
NEXT_PUBLIC_APP_URL="https://relay.agentopc.xyz"
EOF
```

### 4. 执行部署脚本

```bash
cd /root/openclaw-relay
chmod +x deploy.sh
./deploy.sh
```

或者手动部署：

```bash
# 创建日志目录
mkdir -p /root/openclaw-relay/logs

# 复制 SSL 证书
mkdir -p /etc/nginx/ssl
cp nginx/relay.agentopc.xyz.pem /etc/nginx/ssl/
cp nginx/relay.agentopc.xyz.key /etc/nginx/ssl/
chmod 644 /etc/nginx/ssl/relay.agentopc.xyz.pem
chmod 600 /etc/nginx/ssl/relay.agentopc.xyz.key

# 配置 Nginx
cp nginx/relay.agentopc.xyz.conf /etc/nginx/sites-available/
ln -sf /etc/nginx/sites-available/relay.agentopc.xyz.conf /etc/nginx/sites-enabled/
nginx -t
systemctl reload nginx

# 安装依赖
pnpm install --prod

# 构建项目
pnpm build

# 配置数据库
npx prisma generate
npx prisma db push

# 启动应用
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

## PM2 管理命令

```bash
# 查看应用状态
pm2 status

# 查看日志
pm2 logs openclaw-relay

# 实时日志
pm2 logs openclaw-relay --lines 100

# 重启应用
pm2 restart openclaw-relay

# 停止应用
pm2 stop openclaw-relay

# 删除应用
pm2 delete openclaw-relay

# 查看详细信息
pm2 show openclaw-relay

# 监控
pm2 monit
```

## Nginx 管理命令

```bash
# 测试配置
nginx -t

# 重新加载配置
systemctl reload nginx

# 重启 Nginx
systemctl restart nginx

# 查看状态
systemctl status nginx

# 查看日志
tail -f /var/log/nginx/relay.agentopc.xyz.access.log
tail -f /var/log/nginx/relay.agentopc.xyz.error.log
```

## 更新部署

```bash
# 拉取最新代码
cd /root/openclaw-relay
git pull

# 安装依赖
pnpm install --prod

# 构建
pnpm build

# 数据库迁移（如果有变更）
npx prisma generate
npx prisma db push

# 重启应用
pm2 restart openclaw-relay
```

## 故障排查

### 1. 检查应用是否运行
```bash
pm2 status
curl http://localhost:3003
```

### 2. 检查 Nginx 配置
```bash
nginx -t
systemctl status nginx
```

### 3. 检查端口占用
```bash
netstat -tlnp | grep 3003
netstat -tlnp | grep 80
netstat -tlnp | grep 443
```

### 4. 查看日志
```bash
# PM2 日志
pm2 logs openclaw-relay --lines 100

# Nginx 日志
tail -100 /var/log/nginx/relay.agentopc.xyz.error.log

# 应用日志
tail -100 /root/openclaw-relay/logs/pm2-error.log
```

### 5. 检查数据库连接
```bash
PGPASSWORD='!AgentOPC2026' psql -h localhost -U postgres -d openclaw_relay -c '\dt'
```

## 防火墙配置

```bash
# 允许 HTTP/HTTPS
ufw allow 80/tcp
ufw allow 443/tcp

# 查看状态
ufw status
```

## SSL 证书更新

如果需要更新 SSL 证书：

```bash
# 上传新证书
scp relay.agentopc.xyz.pem root@43.106.122.27:/etc/nginx/ssl/
scp relay.agentopc.xyz.key root@43.106.122.27:/etc/nginx/ssl/

# 设置权限
chmod 644 /etc/nginx/ssl/relay.agentopc.xyz.pem
chmod 600 /etc/nginx/ssl/relay.agentopc.xyz.key

# 重新加载 Nginx
nginx -t
systemctl reload nginx
```

## 监控和维护

### 设置 PM2 开机自启
```bash
pm2 startup
pm2 save
```

### 定期备份数据库
```bash
# 创建备份脚本
cat > /root/backup-db.sh << 'EOF'
#!/bin/bash
BACKUP_DIR="/root/backups"
DATE=$(date +%Y%m%d_%H%M%S)
mkdir -p $BACKUP_DIR
PGPASSWORD='!AgentOPC2026' pg_dump -h localhost -U postgres openclaw_relay > $BACKUP_DIR/openclaw_relay_$DATE.sql
# 保留最近 7 天的备份
find $BACKUP_DIR -name "openclaw_relay_*.sql" -mtime +7 -delete
EOF

chmod +x /root/backup-db.sh

# 添加到 crontab (每天凌晨 2 点备份)
crontab -e
# 添加: 0 2 * * * /root/backup-db.sh
```

## 访问地址

- 主站: https://relay.agentopc.xyz
- API: https://relay.agentopc.xyz/api
- 健康检查: https://relay.agentopc.xyz/health
