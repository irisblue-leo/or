# 快速部署指南

## 一键部署命令

```bash
# 1. 上传代码到服务器
rsync -avz --exclude 'node_modules' --exclude '.next' --exclude '.git' \
  . root@43.106.122.27:/root/openclaw-relay/

# 2. SSH 登录服务器
ssh root@43.106.122.27

# 3. 执行部署脚本
cd /root/openclaw-relay
chmod +x deploy.sh
./deploy.sh
```

## 验证部署

```bash
# 检查应用状态
pm2 status

# 检查 Nginx
systemctl status nginx

# 测试访问
curl https://relay.agentopc.xyz/health
```

## 常用命令

```bash
# 重启应用
pm2 restart openclaw-relay

# 查看日志
pm2 logs openclaw-relay

# 更新代码后重新部署
cd /root/openclaw-relay
git pull
pnpm install --prod
pnpm build
pm2 restart openclaw-relay
```

详细文档请查看 `DEPLOY_GUIDE.md`
