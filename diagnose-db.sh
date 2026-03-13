#!/bin/bash

echo "=========================================="
echo "PostgreSQL 连接诊断和修复"
echo "=========================================="

DB_PASSWORD="!AgentOPC2026"

echo ""
echo "1. 检查 PostgreSQL 服务状态..."
systemctl status postgresql --no-pager | head -10

echo ""
echo "2. 检查 PostgreSQL 是否监听..."
netstat -tlnp | grep 5432 || ss -tlnp | grep 5432

echo ""
echo "3. 测试 postgres 用户连接（peer 认证）..."
sudo -u postgres psql -c "SELECT version();" 2>&1 | head -5

echo ""
echo "4. 设置 postgres 用户密码..."
sudo -u postgres psql -c "ALTER USER postgres WITH PASSWORD '$DB_PASSWORD';" 2>&1

echo ""
echo "5. 测试密码认证..."
PGPASSWORD="$DB_PASSWORD" psql -h localhost -U postgres -c "SELECT 1;" 2>&1 | head -5

echo ""
echo "6. 检查数据库是否存在..."
PGPASSWORD="$DB_PASSWORD" psql -h localhost -U postgres -c "\l" 2>&1 | grep openclaw_relay

echo ""
echo "7. 创建数据库（如果不存在）..."
PGPASSWORD="$DB_PASSWORD" psql -h localhost -U postgres -c "CREATE DATABASE openclaw_relay;" 2>&1 || echo "数据库已存在或创建失败"

echo ""
echo "8. 检查 pg_hba.conf 配置..."
PG_VERSION=$(ls /etc/postgresql/ 2>/dev/null | head -1)
if [ -n "$PG_VERSION" ]; then
    echo "PostgreSQL 版本: $PG_VERSION"
    echo "pg_hba.conf 内容:"
    cat /etc/postgresql/$PG_VERSION/main/pg_hba.conf | grep -v "^#" | grep -v "^$"
else
    echo "未找到 PostgreSQL 配置目录"
fi

echo ""
echo "9. 修复 pg_hba.conf（允许密码认证）..."
if [ -n "$PG_VERSION" ]; then
    PG_HBA="/etc/postgresql/$PG_VERSION/main/pg_hba.conf"

    # 备份
    cp $PG_HBA ${PG_HBA}.backup.$(date +%Y%m%d_%H%M%S)

    # 写入新配置
    cat > $PG_HBA << 'HBAEOF'
# Database administrative login by Unix domain socket
local   all             postgres                                peer

# TYPE  DATABASE        USER            ADDRESS                 METHOD
# "local" is for Unix domain socket connections only
local   all             all                                     md5
# IPv4 local connections:
host    all             all             127.0.0.1/32            md5
# IPv6 local connections:
host    all             all             ::1/128                 md5
HBAEOF

    echo "pg_hba.conf 已更新"

    # 重启 PostgreSQL
    echo ""
    echo "10. 重启 PostgreSQL..."
    systemctl restart postgresql
    sleep 3

    echo ""
    echo "11. 再次测试连接..."
    PGPASSWORD="$DB_PASSWORD" psql -h localhost -U postgres -d openclaw_relay -c "SELECT 'Connection successful!' as status;" 2>&1
else
    echo "无法修复 pg_hba.conf - 未找到配置文件"
fi

echo ""
echo "=========================================="
echo "诊断完成"
echo "=========================================="
echo ""
echo "如果连接成功，请运行："
echo "cd /root/openclaw-relay"
echo "npx prisma db push"
echo "pnpm build"
echo "pm2 start ecosystem.config.js"
