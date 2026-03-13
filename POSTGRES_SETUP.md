# PostgreSQL 数据库配置指南

## 问题诊断

数据库服务器在新加坡，可能存在以下问题：
1. PostgreSQL 未安装或未启动
2. PostgreSQL 配置不允许远程连接
3. 防火墙阻止了 5432 端口
4. 网络延迟或连接超时

## 解决方案

### 1. SSH 登录服务器

```bash
ssh root@43.106.122.27
# 密码: !2351147520Wy
```

### 2. 检查 PostgreSQL 是否安装

```bash
# 检查 PostgreSQL 服务状态
systemctl status postgresql

# 如果未安装，执行安装
apt update
apt install -y postgresql postgresql-contrib
```

### 3. 检查 PostgreSQL 是否运行

```bash
# 启动 PostgreSQL
systemctl start postgresql

# 设置开机自启
systemctl enable postgresql

# 查看状态
systemctl status postgresql
```

### 4. 检查端口监听

```bash
# 检查 5432 端口是否监听
netstat -tlnp | grep 5432
# 或
ss -tlnp | grep 5432

# 应该看到类似输出：
# tcp  0  0 127.0.0.1:5432  0.0.0.0:*  LISTEN  1234/postgres
```

### 5. 配置 PostgreSQL 允许本地连接

#### 5.1 修改 postgresql.conf

```bash
# 查找配置文件位置
find /etc/postgresql -name postgresql.conf

# 编辑配置文件（根据实际路径）
vim /etc/postgresql/14/main/postgresql.conf
# 或
vim /etc/postgresql/15/main/postgresql.conf
```

找到并修改以下行：
```conf
# 允许本地连接（默认即可）
listen_addresses = 'localhost'

# 或者允许所有连接（不推荐，仅用于调试）
# listen_addresses = '*'
```

#### 5.2 修改 pg_hba.conf

```bash
# 编辑 pg_hba.conf
vim /etc/postgresql/14/main/pg_hba.conf
# 或
vim /etc/postgresql/15/main/pg_hba.conf
```

确保包含以下配置：
```conf
# 允许本地 Unix socket 连接
local   all             postgres                                peer

# 允许本地 TCP/IP 连接（使用密码认证）
host    all             all             127.0.0.1/32            md5
host    all             all             ::1/128                 md5

# 允许本地所有连接
local   all             all                                     md5
```

### 6. 重启 PostgreSQL

```bash
systemctl restart postgresql

# 检查状态
systemctl status postgresql
```

### 7. 设置 postgres 用户密码

```bash
# 切换到 postgres 用户
sudo -u postgres psql

# 在 psql 中执行
ALTER USER postgres WITH PASSWORD '!AgentOPC2026';

# 退出
\q
```

### 8. 测试数据库连接

```bash
# 使用密码连接
PGPASSWORD='!AgentOPC2026' psql -h localhost -U postgres -d postgres -c '\l'

# 应该能看到数据库列表
```

### 9. 确认 openclaw_relay 数据库存在

```bash
PGPASSWORD='!AgentOPC2026' psql -h localhost -U postgres -c '\l' | grep openclaw_relay

# 如果不存在，创建它
PGPASSWORD='!AgentOPC2026' psql -h localhost -U postgres -c 'CREATE DATABASE openclaw_relay;'
```

### 10. 检查防火墙

```bash
# 检查防火墙状态
ufw status

# 如果需要，允许 5432 端口（仅本地访问不需要）
# ufw allow 5432/tcp
```

## 快速诊断脚本

在服务器上创建并运行此脚本：

```bash
cat > /root/check-db.sh << 'EOF'
#!/bin/bash

echo "=========================================="
echo "PostgreSQL 诊断脚本"
echo "=========================================="

echo ""
echo "1. 检查 PostgreSQL 服务状态..."
systemctl status postgresql --no-pager

echo ""
echo "2. 检查端口监听..."
netstat -tlnp | grep 5432

echo ""
echo "3. 检查 PostgreSQL 版本..."
sudo -u postgres psql --version

echo ""
echo "4. 测试数据库连接..."
PGPASSWORD='!AgentOPC2026' psql -h localhost -U postgres -c 'SELECT version();' 2>&1

echo ""
echo "5. 列出所有数据库..."
PGPASSWORD='!AgentOPC2026' psql -h localhost -U postgres -c '\l' 2>&1

echo ""
echo "6. 检查 openclaw_relay 数据库..."
PGPASSWORD='!AgentOPC2026' psql -h localhost -U postgres -d openclaw_relay -c '\dt' 2>&1

echo ""
echo "=========================================="
echo "诊断完成"
echo "=========================================="
EOF

chmod +x /root/check-db.sh
/root/check-db.sh
```

## 常见问题

### 问题 1: "peer authentication failed"
**解决方案**: 修改 pg_hba.conf，将 `peer` 改为 `md5`

### 问题 2: "connection refused"
**解决方案**:
- 检查 PostgreSQL 是否运行
- 检查 listen_addresses 配置
- 检查防火墙

### 问题 3: "password authentication failed"
**解决方案**: 重置 postgres 用户密码

### 问题 4: "database does not exist"
**解决方案**: 创建 openclaw_relay 数据库

## 应用配置

确保应用的 .env 文件配置正确：

```env
# 在服务器上，使用 localhost
DATABASE_URL="postgresql://postgres:!AgentOPC2026@localhost:5432/openclaw_relay"

# 不要使用服务器 IP（从应用内部连接）
# DATABASE_URL="postgresql://postgres:!AgentOPC2026@43.106.122.27:5432/openclaw_relay"
```

## 验证步骤

1. SSH 登录服务器
2. 运行诊断脚本
3. 根据输出结果修复问题
4. 确认数据库可以连接
5. 部署应用并测试

## 需要帮助？

如果遇到问题，请提供以下信息：
- PostgreSQL 服务状态
- 端口监听情况
- 错误日志内容
- pg_hba.conf 配置
