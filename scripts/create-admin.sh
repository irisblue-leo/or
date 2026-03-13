#!/bin/bash

# 创建或更新管理员账号
# 邮箱: admin@openclaw-relay.com
# 密码: !AgentOPC2026

echo "创建/更新管理员账号..."
echo "邮箱: admin@openclaw-relay.com"
echo "密码: !AgentOPC2026"
echo ""

# 检查是否设置了 DATABASE_URL
if [ -z "$DATABASE_URL" ]; then
    echo "错误: DATABASE_URL 环境变量未设置"
    echo "请先设置: export DATABASE_URL='postgresql://user:password@host:port/database'"
    exit 1
fi

# 创建或更新管理员账号
psql "$DATABASE_URL" << 'EOF'
-- 删除旧的管理员账号（如果存在）
DELETE FROM "User" WHERE email = 'admin@openclaw-relay.com';

-- 创建新的管理员账号
INSERT INTO "User" (
    id,
    email,
    password,
    name,
    role,
    balance,
    "emailVerified",
    "createdAt",
    "updatedAt"
)
VALUES (
    'admin-' || gen_random_uuid()::text,
    'admin@openclaw-relay.com',
    '$2b$10$OjHsvWpJUXV0oZ8beI80U.A2wuiCt.87K3q5ghEYj2nUdpNKC8OXO',
    'Admin',
    'admin',
    1000.00,
    true,
    NOW(),
    NOW()
);

-- 验证创建结果
SELECT
    email,
    role,
    balance,
    "emailVerified",
    "createdAt",
    '✓ 账号已创建' as status
FROM "User"
WHERE email = 'admin@openclaw-relay.com';
EOF

if [ $? -eq 0 ]; then
    echo ""
    echo "✓ 管理员账号创建/更新成功！"
    echo ""
    echo "登录信息:"
    echo "  邮箱: admin@openclaw-relay.com"
    echo "  密码: !AgentOPC2026"
    echo ""
    echo "请访问 https://relay.agentopc.xyz/login 登录"
else
    echo ""
    echo "✗ 操作失败，请检查数据库连接"
    exit 1
fi
