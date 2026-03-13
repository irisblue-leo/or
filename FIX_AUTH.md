# PostgreSQL 认证失败 - 快速修复

## 问题
```
Error: P1000: Authentication failed against database server
```

## 快速修复（在服务器上执行）

### 方法 1: 运行诊断脚本（推荐）

```bash
cd /root/openclaw-relay
git pull
chmod +x diagnose-db.sh
./diagnose-db.sh
```

### 方法 2: 手动修复

```bash
# 1. 切换到 postgres 用户设置密码
sudo -u postgres psql
```

在 psql 中执行：
```sql
ALTER USER postgres WITH PASSWORD '!AgentOPC2026';
\q
```

```bash
# 2. 修改 pg_hba.conf
PG_VERSION=$(ls /etc/postgresql/ | head -1)
vim /etc/postgresql/$PG_VERSION/main/pg_hba.conf
```

确保包含以下内容：
```conf
# Database administrative login by Unix domain socket
local   all             postgres                                peer

# TYPE  DATABASE        USER            ADDRESS                 METHOD
local   all             all                                     md5
host    all             all             127.0.0.1/32            md5
host    all             all             ::1/128                 md5
```

```bash
# 3. 重启 PostgreSQL
systemctl restart postgresql

# 4. 测试连接
PGPASSWORD='!AgentOPC2026' psql -h localhost -U postgres -c '\l'

# 5. 创建数据库（如果不存在）
PGPASSWORD='!AgentOPC2026' psql -h localhost -U postgres -c 'CREATE DATABASE openclaw_relay;'

# 6. 测试连接到数据库
PGPASSWORD='!AgentOPC2026' psql -h localhost -U postgres -d openclaw_relay -c 'SELECT 1;'
```

## 继续部署

修复后继续：

```bash
cd /root/openclaw-relay

# 推送数据库 schema
npx prisma db push

# 构建项目
pnpm build

# 启动应用
pm2 delete openclaw-relay 2>/dev/null || true
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

## 验证

```bash
# 检查应用
pm2 status
pm2 logs openclaw-relay --lines 50

# 测试 API
curl https://relay.agentopc.xyz/health
curl -X POST https://relay.agentopc.xyz/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test123456"}'
```

## 常见问题

### 问题 1: "peer authentication failed"
**原因**: pg_hba.conf 配置不正确
**解决**: 修改 pg_hba.conf，将 peer 改为 md5

### 问题 2: "password authentication failed"
**原因**: postgres 用户密码未设置或不正确
**解决**: 使用 `ALTER USER` 重新设置密码

### 问题 3: "database does not exist"
**原因**: openclaw_relay 数据库未创建
**解决**: 运行 `CREATE DATABASE openclaw_relay;`

## 检查 .env 配置

确保 `/root/openclaw-relay/.env` 文件中的数据库连接字符串正确：

```env
DATABASE_URL="postgresql://postgres:!AgentOPC2026@localhost:5432/openclaw_relay"
```

注意：
- 使用 `localhost` 而不是 `127.0.0.1`
- 密码中的特殊字符需要正确转义
- 端口是 5432
