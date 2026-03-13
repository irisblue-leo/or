# 修复 Prisma Client 并继续部署

## 在服务器上执行以下命令：

```bash
cd /root/openclaw-relay

# 1. 拉取最新代码
git pull

# 2. 生成 Prisma Client
npx prisma generate

# 3. 推送数据库 schema
npx prisma db push

# 4. 构建项目
pnpm build

# 5. 启动应用
pm2 delete openclaw-relay 2>/dev/null || true
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

## 或者重新运行部署脚本

```bash
cd /root/openclaw-relay
git pull
./deploy.sh
```

## 验证部署

```bash
# 检查应用状态
pm2 status

# 查看日志
pm2 logs openclaw-relay

# 测试访问
curl https://relay.agentopc.xyz/health
```
