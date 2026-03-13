#!/bin/bash

# 更新管理员密码脚本
# 使用方法: ./update-admin-password.sh

echo "正在更新管理员密码..."
echo "邮箱: admin@openclaw-relay.com"
echo "新密码: !AgentOPC2026"
echo ""

# 检查是否设置了 DATABASE_URL
if [ -z "$DATABASE_URL" ]; then
    echo "错误: DATABASE_URL 环境变量未设置"
    echo "请先设置: export DATABASE_URL='postgresql://user:password@host:port/database'"
    exit 1
fi

# 执行 SQL 更新
psql "$DATABASE_URL" << 'EOF'
UPDATE "User"
SET password = '$2b$10$OjHsvWpJUXV0oZ8beI80U.A2wuiCt.87K3q5ghEYj2nUdpNKC8OXO',
    "updatedAt" = NOW()
WHERE email = 'admin@openclaw-relay.com';

-- 验证更新
SELECT
    email,
    role,
    "updatedAt",
    CASE
        WHEN password = '$2b$10$OjHsvWpJUXV0oZ8beI80U.A2wuiCt.87K3q5ghEYj2nUdpNKC8OXO'
        THEN '✓ 密码已更新'
        ELSE '✗ 密码未更新'
    END as status
FROM "User"
WHERE email = 'admin@openclaw-relay.com';
EOF

if [ $? -eq 0 ]; then
    echo ""
    echo "✓ 管理员密码更新成功！"
    echo ""
    echo "登录信息:"
    echo "  邮箱: admin@openclaw-relay.com"
    echo "  密码: !AgentOPC2026"
    echo ""
    echo "请访问 https://your-domain.com/login 登录"
else
    echo ""
    echo "✗ 更新失败，请检查数据库连接"
    exit 1
fi
