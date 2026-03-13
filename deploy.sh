#!/bin/bash

# OpenClaw Relay 部署脚本
# 服务器: root@43.106.122.27

set -e

echo "=========================================="
echo "OpenClaw Relay 部署脚本"
echo "=========================================="

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 项目配置
PROJECT_DIR="/root/openclaw-relay"
NGINX_CONF_DIR="/etc/nginx/sites-available"
NGINX_ENABLED_DIR="/etc/nginx/sites-enabled"
SSL_DIR="/etc/nginx/ssl"

echo -e "${YELLOW}1. 检查依赖...${NC}"
command -v node >/dev/null 2>&1 || { echo -e "${RED}Node.js 未安装${NC}"; exit 1; }
command -v pnpm >/dev/null 2>&1 || { echo -e "${RED}pnpm 未安装，正在安装...${NC}"; npm install -g pnpm; }
command -v pm2 >/dev/null 2>&1 || { echo -e "${RED}PM2 未安装，正在安装...${NC}"; npm install -g pm2; }
command -v nginx >/dev/null 2>&1 || { echo -e "${RED}Nginx 未安装${NC}"; exit 1; }
command -v psql >/dev/null 2>&1 || { echo -e "${RED}PostgreSQL 未安装，正在安装...${NC}"; apt update && apt install -y postgresql postgresql-contrib; }

echo -e "${GREEN}✓ 依赖检查完成${NC}"

echo -e "${YELLOW}2. 配置 PostgreSQL...${NC}"
if [ -f "$PROJECT_DIR/setup-postgres.sh" ]; then
    bash $PROJECT_DIR/setup-postgres.sh
else
    echo -e "${YELLOW}手动配置 PostgreSQL...${NC}"
    systemctl start postgresql
    systemctl enable postgresql
    sudo -u postgres psql -c "ALTER USER postgres WITH PASSWORD '!AgentOPC2026';" 2>/dev/null || true
    sudo -u postgres psql -c "CREATE DATABASE openclaw_relay;" 2>/dev/null || echo "数据库已存在"
fi
echo -e "${GREEN}✓ PostgreSQL 配置完成${NC}"

echo -e "${YELLOW}3. 创建必要的目录...${NC}"
mkdir -p $PROJECT_DIR/logs
mkdir -p $SSL_DIR

echo -e "${YELLOW}4. 复制 SSL 证书...${NC}"
if [ -f "$PROJECT_DIR/nginx/relay.agentopc.xyz.pem" ]; then
    cp $PROJECT_DIR/nginx/relay.agentopc.xyz.pem $SSL_DIR/
    cp $PROJECT_DIR/nginx/relay.agentopc.xyz.key $SSL_DIR/
    chmod 644 $SSL_DIR/relay.agentopc.xyz.pem
    chmod 600 $SSL_DIR/relay.agentopc.xyz.key
    echo -e "${GREEN}✓ SSL 证书已复制${NC}"
else
    echo -e "${RED}✗ SSL 证书文件不存在${NC}"
    exit 1
fi

echo -e "${YELLOW}5. 配置 Nginx...${NC}"
cp $PROJECT_DIR/nginx/relay.agentopc.xyz.conf $NGINX_CONF_DIR/
ln -sf $NGINX_CONF_DIR/relay.agentopc.xyz.conf $NGINX_ENABLED_DIR/relay.agentopc.xyz.conf
nginx -t
if [ $? -eq 0 ]; then
    systemctl reload nginx
    echo -e "${GREEN}✓ Nginx 配置成功${NC}"
else
    echo -e "${RED}✗ Nginx 配置测试失败${NC}"
    exit 1
fi

echo -e "${YELLOW}6. 安装项目依赖...${NC}"
cd $PROJECT_DIR
pnpm install

echo -e "${YELLOW}7. 生成 Prisma Client...${NC}"
npx prisma generate

echo -e "${YELLOW}8. 配置数据库...${NC}"
npx prisma db push

echo -e "${YELLOW}9. 构建项目...${NC}"
pnpm build

echo -e "${YELLOW}10. 清理开发依赖（可选）...${NC}"
# 构建完成后可以删除 devDependencies 以节省空间
# pnpm prune --prod

echo -e "${YELLOW}11. 启动应用...${NC}"
pm2 delete openclaw-relay 2>/dev/null || true
pm2 start ecosystem.config.js
pm2 save
pm2 startup

echo -e "${GREEN}=========================================="
echo -e "部署完成！"
echo -e "=========================================="
echo -e "应用地址: https://relay.agentopc.xyz"
echo -e "PM2 状态: pm2 status"
echo -e "查看日志: pm2 logs openclaw-relay"
echo -e "重启应用: pm2 restart openclaw-relay"
echo -e "${GREEN}=========================================="
