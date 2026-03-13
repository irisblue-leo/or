#!/bin/bash

# PostgreSQL 一键配置脚本
# 在服务器上运行此脚本

set -e

echo "=========================================="
echo "PostgreSQL 自动配置脚本"
echo "=========================================="

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

DB_PASSWORD="!AgentOPC2026"
DB_NAME="openclaw_relay"

echo -e "${YELLOW}1. 检查 PostgreSQL 是否安装...${NC}"
if ! command -v psql &> /dev/null; then
    echo -e "${YELLOW}PostgreSQL 未安装，正在安装...${NC}"
    apt update
    apt install -y postgresql postgresql-contrib
    echo -e "${GREEN}✓ PostgreSQL 安装完成${NC}"
else
    echo -e "${GREEN}✓ PostgreSQL 已安装${NC}"
fi

echo -e "${YELLOW}2. 启动 PostgreSQL 服务...${NC}"
systemctl start postgresql
systemctl enable postgresql
echo -e "${GREEN}✓ PostgreSQL 服务已启动${NC}"

echo -e "${YELLOW}3. 设置 postgres 用户密码...${NC}"
sudo -u postgres psql -c "ALTER USER postgres WITH PASSWORD '$DB_PASSWORD';" 2>/dev/null || true
echo -e "${GREEN}✓ 密码已设置${NC}"

echo -e "${YELLOW}4. 创建数据库...${NC}"
sudo -u postgres psql -c "CREATE DATABASE $DB_NAME;" 2>/dev/null || echo "数据库已存在"
echo -e "${GREEN}✓ 数据库已创建${NC}"

echo -e "${YELLOW}5. 配置 pg_hba.conf...${NC}"
PG_VERSION=$(ls /etc/postgresql/ | head -1)
PG_HBA="/etc/postgresql/$PG_VERSION/main/pg_hba.conf"

# 备份原配置
cp $PG_HBA ${PG_HBA}.backup

# 添加 md5 认证配置
cat > $PG_HBA << 'EOF'
# Database administrative login by Unix domain socket
local   all             postgres                                peer

# TYPE  DATABASE        USER            ADDRESS                 METHOD
local   all             all                                     md5
host    all             all             127.0.0.1/32            md5
host    all             all             ::1/128                 md5
EOF

echo -e "${GREEN}✓ pg_hba.conf 已配置${NC}"

echo -e "${YELLOW}6. 重启 PostgreSQL...${NC}"
systemctl restart postgresql
sleep 2
echo -e "${GREEN}✓ PostgreSQL 已重启${NC}"

echo -e "${YELLOW}7. 测试数据库连接...${NC}"
if PGPASSWORD="$DB_PASSWORD" psql -h localhost -U postgres -d $DB_NAME -c '\dt' &>/dev/null; then
    echo -e "${GREEN}✓ 数据库连接成功${NC}"
else
    echo -e "${RED}✗ 数据库连接失败${NC}"
    echo "请检查配置"
    exit 1
fi

echo -e "${GREEN}=========================================="
echo "PostgreSQL 配置完成！"
echo "=========================================="
echo "数据库: $DB_NAME"
echo "用户: postgres"
echo "密码: $DB_PASSWORD"
echo "连接字符串: postgresql://postgres:$DB_PASSWORD@localhost:5432/$DB_NAME"
echo -e "${GREEN}=========================================="
