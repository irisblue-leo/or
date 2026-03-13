# 管理员账号信息

## 默认管理员账号

**重要：首次部署后请立即修改密码！**

- **邮箱**: `admin@openclaw-relay.com`
- **密码**: `admin123`

## 初始化数据库

运行以下命令来初始化数据库并创建管理员账号：

```bash
# 1. 运行数据库迁移
pnpm prisma migrate deploy

# 2. 执行种子数据脚本
psql $DATABASE_URL -f prisma/seed.sql
```

或者使用 Docker：

```bash
docker exec -i postgres_container psql -U user -d openclaw_relay < prisma/seed.sql
```

## 访问管理后台

1. 访问 `https://your-domain.com/login`
2. 使用上述邮箱和密码登录
3. 登录后会自动跳转到管理后台 `/admin`

## 修改管理员密码

### 方法 1：通过数据库直接修改

```bash
# 生成新密码的 bcrypt hash
node -e "const bcrypt = require('bcryptjs'); console.log(bcrypt.hashSync('your-new-password', 10));"

# 更新数据库
psql $DATABASE_URL -c "UPDATE \"User\" SET password = 'YOUR_BCRYPT_HASH' WHERE email = 'admin@openclaw-relay.com';"
```

### 方法 2：通过 API（推荐）

登录后台后，可以在用户管理页面修改密码。

## 安全建议

1. **立即修改默认密码** - 默认密码 `admin123` 仅用于初始化
2. **使用强密码** - 至少 12 位，包含大小写字母、数字和特殊字符
3. **定期更换密码** - 建议每 3-6 个月更换一次
4. **启用 HTTPS** - 确保所有通信都通过 HTTPS 加密
5. **限制管理后台访问** - 可以通过防火墙或 IP 白名单限制访问
6. **监控登录日志** - 定期检查异常登录行为

## 创建额外的管理员账号

可以通过 SQL 直接创建：

```sql
-- 生成密码 hash（在 Node.js 中运行）
-- node -e "const bcrypt = require('bcryptjs'); console.log(bcrypt.hashSync('password', 10));"

INSERT INTO "User" (id, email, password, name, role, balance, "createdAt", "updatedAt")
VALUES (
  'admin-' || gen_random_uuid()::text,
  'new-admin@example.com',
  '$2b$10$YOUR_BCRYPT_HASH_HERE',
  'New Admin',
  'admin',
  0.00,
  NOW(),
  NOW()
);
```

## 故障排查

### 无法登录

1. 确认数据库中存在管理员账号：
   ```sql
   SELECT email, role FROM "User" WHERE role = 'admin';
   ```

2. 重置管理员密码（使用上述方法）

3. 检查 JWT_SECRET 环境变量是否正确配置

### 登录后无法访问管理后台

确认用户的 `role` 字段为 `admin`：

```sql
UPDATE "User" SET role = 'admin' WHERE email = 'admin@openclaw-relay.com';
```

## 相关文件

- `prisma/seed.sql` - 数据库初始化脚本
- `src/app/api/auth/login/route.ts` - 登录 API
- `src/app/admin/page.tsx` - 管理后台页面
