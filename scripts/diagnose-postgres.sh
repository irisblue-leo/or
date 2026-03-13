#!/bin/bash

echo "=== PostgreSQL 远程连接诊断脚本 ==="
echo ""

# 1. 检查 PostgreSQL 是否运行
echo "1. 检查 PostgreSQL 服务状态..."
sudo systemctl status postgresql | grep "Active:"
echo ""

# 2. 查找配置文件位置
echo "2. 查找配置文件位置..."
HBA_FILE=$(sudo -u postgres psql -t -c "SHOW hba_file;" 2>/dev/null | xargs)
CONFIG_FILE=$(sudo -u postgres psql -t -c "SHOW config_file;" 2>/dev/null | xargs)
echo "pg_hba.conf: $HBA_FILE"
echo "postgresql.conf: $CONFIG_FILE"
echo ""

# 3. 检查监听地址
echo "3. 检查监听地址配置..."
sudo grep "^listen_addresses" "$CONFIG_FILE" 2>/dev/null || echo "未找到 listen_addresses 配置"
echo ""

# 4. 检查端口
echo "4. 检查端口配置..."
sudo grep "^port" "$CONFIG_FILE" 2>/dev/null || echo "使用默认端口 5432"
echo ""

# 5. 检查 pg_hba.conf 内容
echo "5. 检查 pg_hba.conf 访问控制规则..."
echo "当前规则（非注释行）："
sudo grep -v "^#" "$HBA_FILE" | grep -v "^$"
echo ""

# 6. 检查监听端口
echo "6. 检查 PostgreSQL 监听端口..."
sudo netstat -tlnp | grep postgres || sudo ss -tlnp | grep postgres
echo ""

# 7. 检查防火墙
echo "7. 检查防火墙状态..."
if command -v ufw &> /dev/null; then
    echo "UFW 状态："
    sudo ufw status | grep 5432
elif command -v firewall-cmd &> /dev/null; then
    echo "Firewalld 状态："
    sudo firewall-cmd --list-ports | grep 5432
else
    echo "未检测到 ufw 或 firewalld"
fi
echo ""

# 8. 测试本地连接
echo "8. 测试本地连接..."
sudo -u postgres psql -c "SELECT version();" 2>&1 | head -1
echo ""

# 9. 显示当前连接
echo "9. 当前数据库连接..."
sudo -u postgres psql -c "SELECT client_addr, usename, application_name, state FROM pg_stat_activity WHERE client_addr IS NOT NULL;" 2>/dev/null
echo ""

echo "=== 诊断完成 ==="
echo ""
echo "修复建议："
echo "1. 如果 listen_addresses 不是 '*' 或包含你的 IP，需要修改"
echo "2. 如果 pg_hba.conf 中没有允许你的 IP，需要添加规则"
echo "3. 如果防火墙没有开放 5432 端口，需要开放"
echo ""
echo "快速修复命令："
echo "sudo nano $HBA_FILE"
echo "# 添加: host    all    all    0.0.0.0/0    md5"
echo ""
echo "sudo nano $CONFIG_FILE"
echo "# 修改: listen_addresses = '*'"
echo ""
echo "sudo systemctl restart postgresql"
