# PostgreSQL 远程连接配置指南

## 问题描述

错误信息：
```
FATAL: no pg_hba.conf entry for host "120.229.154.172", user "postgres", database "postgres"
```

这表示 PostgreSQL 服务器拒绝了来自 IP `120.229.154.172` 的连接请求。

## 解决方案

### 方法 1: 允许特定 IP 连接（推荐）

1. **找到 pg_hba.conf 文件位置**

```bash
# 查找 pg_hba.conf 位置
sudo -u postgres psql -c "SHOW hba_file;"

# 或者使用 find 命令
sudo find / -name pg_hba.conf 2>/dev/null

# 常见位置：
# Ubuntu/Debian: /etc/postgresql/{version}/main/pg_hba.conf
# CentOS/RHEL: /var/lib/pgsql/{version}/data/pg_hba.conf
# macOS (Homebrew): /usr/local/var/postgres/pg_hba.conf
```

2. **编辑 pg_hba.conf**

```bash
# 使用你喜欢的编辑器
sudo nano /etc/postgresql/14/main/pg_hba.conf
# 或
sudo vim /etc/postgresql/14/main/pg_hba.conf
```

3. **添加允许规则**

在文件末尾添加（根据你的需求选择）：

```conf
# 允许特定 IP 使用密码连接（推荐）
host    all             all             120.229.154.172/32      md5

# 或允许整个子网
host    all             all             120.229.154.0/24        md5

# 或允许所有 IP（不推荐，仅用于开发环境）
host    all             all             0.0.0.0/0               md5
```

**配置说明**：
- `host`: 允许 TCP/IP 连接
- `all`: 所有数据库
- `all`: 所有用户
- `120.229.154.172/32`: 允许的 IP 地址（/32 表示单个 IP）
- `md5`: 使用 MD5 密码认证

4. **修改 postgresql.conf 允许监听外部连接**

```bash
# 找到 postgresql.conf
sudo -u postgres psql -c "SHOW config_file;"

# 编辑文件
sudo nano /etc/postgresql/14/main/postgresql.conf
```

找到并修改：

```conf
# 修改前
#listen_addresses = 'localhost'

# 修改后（允许所有 IP）
listen_addresses = '*'

# 或只允许特定 IP
listen_addresses = 'localhost,120.229.154.172'
```

5. **重启 PostgreSQL 服务**

```bash
# Ubuntu/Debian
sudo systemctl restart postgresql

# CentOS/RHEL
sudo systemctl restart postgresql-14

# macOS
brew services restart postgresql
```

### 方法 2: 使用 SSL 连接

如果你想使用 SSL 加密连接：

1. **在 pg_hba.conf 中添加**

```conf
hostssl    all             all             120.229.154.172/32      md5
```

2. **在 postgresql.conf 中启用 SSL**

```conf
ssl = on
ssl_cert_file = '/path/to/server.crt'
ssl_key_file = '/path/to/server.key'
```

3. **在 Navicat 中启用 SSL**
   - 连接设置 → SSL 标签
   - 勾选"使用 SSL"

### 方法 3: 使用 SSH 隧道（最安全）

如果服务器支持 SSH，推荐使用 SSH 隧道：

1. **在 Navicat 中配置 SSH**
   - 连接设置 → SSH 标签
   - 勾选"使用 SSH 通道"
   - 填写 SSH 服务器信息：
     - 主机: 你的服务器 IP
     - 端口: 22
     - 用户名: 你的 SSH 用户名
     - 密码或私钥

2. **PostgreSQL 连接设置**
   - 主机: `localhost` 或 `127.0.0.1`
   - 端口: 5432
   - 用户名: postgres
   - 密码: 你的数据库密码

这样所有数据库流量都通过加密的 SSH 隧道传输，无需修改 pg_hba.conf。

## 验证配置

### 1. 检查 PostgreSQL 是否监听外部端口

```bash
# 检查监听端口
sudo netstat -tlnp | grep 5432
# 或
sudo ss -tlnp | grep 5432

# 应该看到类似输出：
# tcp  0  0  0.0.0.0:5432  0.0.0.0:*  LISTEN  1234/postgres
```

### 2. 检查防火墙

```bash
# Ubuntu/Debian (ufw)
sudo ufw status
sudo ufw allow 5432/tcp

# CentOS/RHEL (firewalld)
sudo firewall-cmd --list-all
sudo firewall-cmd --permanent --add-port=5432/tcp
sudo firewall-cmd --reload

# 或使用 iptables
sudo iptables -L -n | grep 5432
```

### 3. 测试连接

```bash
# 从远程机器测试
psql -h YOUR_SERVER_IP -U postgres -d postgres

# 或使用 telnet 测试端口
telnet YOUR_SERVER_IP 5432
```

## 安全建议

### 1. 不要使用默认端口

修改 postgresql.conf：

```conf
port = 5433  # 改为非标准端口
```

### 2. 限制允许的 IP

只允许必要的 IP 地址访问：

```conf
# 只允许特定 IP
host    all             all             120.229.154.172/32      md5
host    all             all             192.168.1.100/32        md5
```

### 3. 使用强密码

```bash
# 修改 postgres 用户密码
sudo -u postgres psql
ALTER USER postgres WITH PASSWORD 'your_strong_password_here';
```

### 4. 创建专用数据库用户

不要使用 postgres 超级用户连接：

```sql
-- 创建新用户
CREATE USER myapp WITH PASSWORD 'strong_password';

-- 创建数据库
CREATE DATABASE myapp_db OWNER myapp;

-- 授予权限
GRANT ALL PRIVILEGES ON DATABASE myapp_db TO myapp;
```

然后在 pg_hba.conf 中：

```conf
host    myapp_db        myapp           120.229.154.172/32      md5
```

### 5. 启用日志记录

在 postgresql.conf 中：

```conf
logging_collector = on
log_connections = on
log_disconnections = on
log_line_prefix = '%t [%p]: [%l-1] user=%u,db=%d,app=%a,client=%h '
```

## 完整配置示例

### pg_hba.conf

```conf
# TYPE  DATABASE        USER            ADDRESS                 METHOD

# 本地连接
local   all             all                                     peer

# IPv4 本地连接
host    all             all             127.0.0.1/32            md5

# IPv6 本地连接
host    all             all             ::1/128                 md5

# 允许特定 IP 远程连接
host    openclaw_relay  openclaw_user   120.229.154.172/32      md5

# 允许内网连接
host    all             all             192.168.1.0/24          md5
```

### postgresql.conf

```conf
# 监听地址
listen_addresses = '*'

# 端口
port = 5432

# 最大连接数
max_connections = 100

# SSL（可选）
ssl = on
ssl_cert_file = '/etc/ssl/certs/ssl-cert-snakeoil.pem'
ssl_key_file = '/etc/ssl/private/ssl-cert-snakeoil.key'
```

## 故障排查

### 1. 配置文件语法错误

```bash
# 检查配置文件语法
sudo -u postgres /usr/lib/postgresql/14/bin/postgres -D /var/lib/postgresql/14/main --check
```

### 2. 查看 PostgreSQL 日志

```bash
# Ubuntu/Debian
sudo tail -f /var/log/postgresql/postgresql-14-main.log

# CentOS/RHEL
sudo tail -f /var/lib/pgsql/14/data/log/postgresql-*.log
```

### 3. 检查 SELinux（CentOS/RHEL）

```bash
# 临时禁用 SELinux 测试
sudo setenforce 0

# 如果解决问题，配置 SELinux 规则
sudo setsebool -P postgresql_can_network_connect on
```

## Navicat 连接配置

### 基本连接

- **连接名**: OpenClaw Relay DB
- **主机**: 你的服务器 IP
- **端口**: 5432
- **数据库**: openclaw_relay
- **用户名**: postgres（或你创建的用户）
- **密码**: 你的密码

### 使用 SSH 隧道（推荐）

1. **常规标签**
   - 主机: `localhost`
   - 端口: 5432
   - 用户名: postgres
   - 密码: 数据库密码

2. **SSH 标签**
   - 勾选"使用 SSH 通道"
   - 主机: 你的服务器 IP
   - 端口: 22
   - 用户名: SSH 用户名
   - 认证方法: 密码或公钥

## 测试连接

配置完成后，点击 Navicat 的"测试连接"按钮。如果成功，你应该看到"连接成功"的消息。

如果仍然失败，请检查：
1. PostgreSQL 服务是否运行
2. 防火墙是否开放 5432 端口
3. pg_hba.conf 配置是否正确
4. postgresql.conf 中 listen_addresses 是否配置
5. 服务是否已重启
