#!/bin/bash

echo "=== PostgreSQL 远程访问一键配置脚本 ==="
echo ""
echo "警告：此脚本将修改 PostgreSQL 配置以允许远程连接"
echo "请确保你了解安全风险"
echo ""
read -p "是否继续？(y/n) " -n 1 -r
echo ""
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "已取消"
    exit 1
fi

# 获取配置文件路径
echo "1. 获取配置文件路径..."
HBA_FILE=$(sudo -u postgres psql -t -c "SHOW hba_file;" 2>/dev/null | xargs)
CONFIG_FILE=$(sudo -u postgres psql -t -c "SHOW config_file;" 2>/dev/null | xargs)

if [ -z "$HBA_FILE" ] || [ -z "$CONFIG_FILE" ]; then
    echo "错误：无法获取配置文件路径"
    echo "请确保 PostgreSQL 正在运行"
    exit 1
fi

echo "pg_hba.conf: $HBA_FILE"
echo "postgresql.conf: $CONFIG_FILE"
echo ""

# 备份配置文件
echo "2. 备份配置文件..."
sudo cp "$HBA_FILE" "${HBA_FILE}.backup.$(date +%Y%m%d_%H%M%S)"
sudo cp "$CONFIG_FILE" "${CONFIG_FILE}.backup.$(date +%Y%m%d_%H%M%S)"
echo "备份完成"
echo ""

# 修改 pg_hba.conf
echo "3. 修改 pg_hba.conf..."
if ! sudo grep -q "host.*all.*all.*0.0.0.0/0.*md5" "$HBA_FILE"; then
    echo "host    all             all             0.0.0.0/0               md5" | sudo tee -a "$HBA_FILE" > /dev/null
    echo "已添加允许所有 IP 的规则"
else
    echo "规则已存在，跳过"
fi
echo ""

# 修改 postgresql.conf
echo "4. 修改 postgresql.conf..."
if sudo grep -q "^listen_addresses.*=.*'localhost'" "$CONFIG_FILE"; then
    sudo sed -i "s/^listen_addresses.*=.*'localhost'/listen_addresses = '*'/" "$CONFIG_FILE"
    echo "已修改 listen_addresses 为 '*'"
elif sudo grep -q "^#listen_addresses" "$CONFIG_FILE"; then
    sudo sed -i "s/^#listen_addresses.*=.*/listen_addresses = '*'/" "$CONFIG_FILE"
    echo "已启用并修改 listen_addresses 为 '*'"
else
    echo "listen_addresses = '*'" | sudo tee -a "$CONFIG_FILE" > /dev/null
    echo "已添加 listen_addresses = '*'"
fi
echo ""

# 开放防火墙端口
echo "5. 配置防火墙..."
if command -v ufw &> /dev/null; then
    sudo ufw allow 5432/tcp
    echo "已通过 UFW 开放 5432 端口"
elif command -v firewall-cmd &> /dev/null; then
    sudo firewall-cmd --permanent --add-port=5432/tcp
    sudo firewall-cmd --reload
    echo "已通过 Firewalld 开放 5432 端口"
else
    echo "未检测到防火墙管理工具，请手动开放 5432 端口"
fi
echo ""

# 重启 PostgreSQL
echo "6. 重启 PostgreSQL 服务..."
sudo systemctl restart postgresql
sleep 2

if sudo systemctl is-active --quiet postgresql; then
    echo "PostgreSQL 重启成功"
else
    echo "错误：PostgreSQL 重启失败"
    echo "请检查日志：sudo journalctl -u postgresql -n 50"
    exit 1
fi
echo ""

# 验证配置
echo "7. 验证配置..."
echo "监听地址："
sudo grep "^listen_addresses" "$CONFIG_FILE"
echo ""
echo "监听端口："
sudo netstat -tlnp | grep postgres || sudo ss -tlnp | grep postgres
echo ""

echo "=== 配置完成 ==="
echo ""
echo "现在可以尝试从 Navicat 连接了"
echo ""
echo "连接信息："
echo "  主机: $(curl -s ifconfig.me 2>/dev/null || hostname -I | awk '{print $1}')"
echo "  端口: 5432"
echo "  用户: postgres"
echo "  数据库: postgres"
echo ""
echo "如果仍然无法连接，请检查："
echo "1. 云服务器安全组是否开放 5432 端口"
echo "2. PostgreSQL 用户密码是否正确"
echo "3. 查看日志：sudo tail -f /var/log/postgresql/postgresql-*-main.log"
