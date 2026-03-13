# Navicat SSH 隧道连接失败解决方案

## 问题分析

从截图看，你使用了 SSH 隧道，但错误显示：
```
FATAL: no pg_hba.conf entry for host "43.106.122.27"
```

这说明 Navicat 在"常规"标签页的主机填写错误。使用 SSH 隧道时，数据库主机应该填 `localhost` 或 `127.0.0.1`，而不是服务器的公网 IP。

## 解决方案

### 方案 1：正确配置 SSH 隧道（推荐）

#### 步骤 1：SSH 标签配置
- ✅ 使用 SSH 隧道：勾选
- 主机：`43.106.122.27`
- 端口：`22`
- 用户名：`root`
- 认证方法：密码
- 密码：`!2351147520Wy`

#### 步骤 2：常规标签配置（重要！）
- 主机：**改为 `localhost` 或 `127.0.0.1`**（不是 43.106.122.27）
- 端口：`5432`
- 用户名：`postgres`
- 密码：你的 PostgreSQL 密码

#### 为什么要用 localhost？
使用 SSH 隧道时，Navicat 会：
1. 先通过 SSH 连接到服务器
2. 然后在服务器上连接 `localhost:5432`
3. 所以数据库主机必须填 `localhost`

### 方案 2：直接连接（需要配置服务器）

如果不想用 SSH 隧道，需要在服务器上执行以下操作：

#### 在服务器上运行

```bash
# 1. 上传并运行修复脚本
wget https://your-server/scripts/fix-postgres-remote.sh
chmod +x fix-postgres-remote.sh
sudo ./fix-postgres-remote.sh

# 或手动执行以下命令：

# 2. 找到配置文件
sudo -u postgres psql -c "SHOW hba_file;"
sudo -u postgres psql -c "SHOW config_file;"

# 3. 编辑 pg_hba.conf（假设路径是 /etc/postgresql/14/main/pg_hba.conf）
sudo nano /etc/postgresql/14/main/pg_hba.conf

# 在文件末尾添加：
host    all    all    0.0.0.0/0    md5

# 4. 编辑 postgresql.conf
sudo nano /etc/postgresql/14/main/postgresql.conf

# 找到并修改：
listen_addresses = '*'

# 5. 重启 PostgreSQL
sudo systemctl restart postgresql

# 6. 开放防火墙
sudo ufw allow 5432/tcp

# 7. 检查云服务器安全组
# 在云服务器控制台添加安全组规则：
# 协议：TCP
# 端口：5432
# 来源：0.0.0.0/0（或你的 IP）
```

#### Navicat 配置（直接连接）
- SSH 标签：**取消勾选** "使用 SSH 隧道"
- 常规标签：
  - 主机：`43.106.122.27`
  - 端口：`5432`
  - 用户名：`postgres`
  - 密码：PostgreSQL 密码

## 快速诊断

在服务器上运行诊断脚本：

```bash
# 下载诊断脚本
cd /tmp
cat > diagnose.sh << 'EOF'
#!/bin/bash
echo "=== PostgreSQL 诊断 ==="
echo "1. 服务状态："
sudo systemctl status postgresql | grep Active
echo ""
echo "2. 监听端口："
sudo ss -tlnp | grep 5432
echo ""
echo "3. 配置文件："
sudo -u postgres psql -t -c "SHOW hba_file;"
sudo -u postgres psql -t -c "SHOW config_file;"
echo ""
echo "4. 监听地址："
sudo grep "^listen_addresses" /etc/postgresql/*/main/postgresql.conf
echo ""
echo "5. 访问规则："
sudo grep -v "^#" /etc/postgresql/*/main/pg_hba.conf | grep -v "^$"
EOF

chmod +x diagnose.sh
sudo ./diagnose.sh
```

## 常见错误和解决方法

### 错误 1：no pg_hba.conf entry
**原因**：PostgreSQL 拒绝该 IP 的连接

**解决**：
```bash
# 编辑 pg_hba.conf
sudo nano /etc/postgresql/14/main/pg_hba.conf

# 添加规则
host    all    all    0.0.0.0/0    md5

# 重启
sudo systemctl restart postgresql
```

### 错误 2：Connection refused
**原因**：PostgreSQL 未监听外部连接

**解决**：
```bash
# 编辑 postgresql.conf
sudo nano /etc/postgresql/14/main/postgresql.conf

# 修改
listen_addresses = '*'

# 重启
sudo systemctl restart postgresql
```

### 错误 3：Connection timeout
**原因**：防火墙或安全组阻止

**解决**：
```bash
# 开放防火墙
sudo ufw allow 5432/tcp

# 检查云服务器安全组（在控制台操作）
```

### 错误 4：SSH 连接失败
**原因**：SSH 配置错误

**解决**：
- 检查 SSH 端口是否是 22
- 检查用户名和密码
- 尝试用终端 SSH 连接测试：`ssh root@43.106.122.27`

## 推荐配置

### 最安全的方式：SSH 隧道 + 本地连接

**优点**：
- 不需要开放 5432 端口
- 所有流量通过 SSH 加密
- 更安全

**Navicat 配置**：
```
SSH 标签：
  ✓ 使用 SSH 隧道
  主机: 43.106.122.27
  端口: 22
  用户名: root
  密码: !2351147520Wy

常规标签：
  主机: localhost  ← 重点！
  端口: 5432
  用户名: postgres
  密码: [PostgreSQL密码]
```

**服务器配置**：
```bash
# 不需要修改 pg_hba.conf
# 不需要修改 listen_addresses
# 不需要开放 5432 端口
# PostgreSQL 只监听 localhost 即可
```

## 测试连接

### 测试 SSH 连接
```bash
ssh root@43.106.122.27
```

### 测试 PostgreSQL 本地连接
```bash
# 在服务器上
sudo -u postgres psql -c "SELECT version();"
```

### 测试 PostgreSQL 远程连接
```bash
# 在本地
psql -h 43.106.122.27 -U postgres -d postgres
```

## 获取 PostgreSQL 密码

如果不知道 PostgreSQL 密码，在服务器上重置：

```bash
# 切换到 postgres 用户
sudo -u postgres psql

# 修改密码
ALTER USER postgres WITH PASSWORD 'your_new_password';

# 退出
\q
```

## 下一步

1. **首选方案**：使用 SSH 隧道，主机改为 `localhost`
2. **备选方案**：运行修复脚本配置直接连接
3. **测试连接**：点击 Navicat 的"测试连接"

如果还有问题，请提供：
- 诊断脚本的输出
- Navicat 的完整错误信息
- 服务器系统版本：`cat /etc/os-release`
