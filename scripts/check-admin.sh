#!/bin/bash

# 检查管理员账号脚本

echo "检查数据库中的管理员账号..."
echo ""

# 检查是否设置了 DATABASE_URL
if [ -z "$DATABASE_URL" ]; then
    echo "错误: DATABASE_URL 环境变量未设置"
    echo "请先设置: export DATABASE_URL='postgresql://user:password@host:port/database'"
    exit 1
fi

# 查询管理员账号
psql "$DATABASE_URL" << 'EOF'
-- 查看所有管理员账号
SELECT
    id,
    email,
    role,
    "emailVerified",
    "createdAt",
    "updatedAt",
    LEFT(password, 20) || '...' as password_hash
FROM "User"
WHERE role = 'admin'
ORDER BY "createdAt";

-- 统计用户数量
SELECT
    role,
    COUNT(*) as count
FROM "User"
GROUP BY role;
EOF

echo ""
echo "如果没有管理员账号，请运行: psql \$DATABASE_URL -f prisma/seed.sql"
