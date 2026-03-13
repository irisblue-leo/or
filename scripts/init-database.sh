#!/bin/bash

# 初始化数据库数据
# 包括：管理员账号、模型、上游接口

echo "初始化数据库..."
echo ""

# 检查是否设置了 DATABASE_URL
if [ -z "$DATABASE_URL" ]; then
    echo "错误: DATABASE_URL 环境变量未设置"
    echo "请先设置: export DATABASE_URL='postgresql://user:password@host:port/database'"
    exit 1
fi

# 执行初始化
psql "$DATABASE_URL" << 'EOF'
-- ============================================
-- 1. 创建管理员账号
-- ============================================
INSERT INTO "User" (id, email, password, name, role, balance, "emailVerified", "createdAt", "updatedAt")
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
)
ON CONFLICT (email) DO UPDATE SET
  password = EXCLUDED.password,
  "updatedAt" = NOW();

-- ============================================
-- 2. 添加上游接口配置
-- ============================================
INSERT INTO "Provider" (id, name, "baseUrl", "apiKey", active, "createdAt", "updatedAt")
VALUES
  (gen_random_uuid()::text, 'OpenAI', 'https://api.openai.com/v1', '', true, NOW(), NOW()),
  (gen_random_uuid()::text, 'Anthropic', 'https://api.anthropic.com/v1', '', true, NOW(), NOW()),
  (gen_random_uuid()::text, 'OpenRouter', 'https://openrouter.ai/api/v1', '', true, NOW(), NOW())
ON CONFLICT (name) DO NOTHING;

-- ============================================
-- 3. 添加常用模型（定价参考市场标准，单位：$/1M tokens）
-- ============================================
INSERT INTO "Model" (id, name, provider, "inputPrice", "outputPrice", "upstreamInput", "upstreamOutput", active, "createdAt", "updatedAt")
VALUES
  -- Claude 4 系列（最新）
  (gen_random_uuid()::text, 'claude-opus-4-6', 'openai', 15.00, 75.00, 12.00, 60.00, true, NOW(), NOW()),
  (gen_random_uuid()::text, 'claude-sonnet-4-6', 'openai', 3.00, 15.00, 2.40, 12.00, true, NOW(), NOW()),
  (gen_random_uuid()::text, 'claude-haiku-4-5-20251001', 'openai', 0.80, 4.00, 0.64, 3.20, true, NOW(), NOW()),

  -- Claude 3.5 系列
  (gen_random_uuid()::text, 'claude-3-5-sonnet-20241022', 'openai', 3.00, 15.00, 2.40, 12.00, true, NOW(), NOW()),
  (gen_random_uuid()::text, 'claude-3-5-haiku-20241022', 'openai', 0.80, 4.00, 0.64, 3.20, true, NOW(), NOW()),

  -- GPT 系列
  (gen_random_uuid()::text, 'gpt-4o', 'openai', 2.50, 10.00, 2.00, 8.00, true, NOW(), NOW()),
  (gen_random_uuid()::text, 'gpt-4o-mini', 'openai', 0.15, 0.60, 0.12, 0.48, true, NOW(), NOW()),
  (gen_random_uuid()::text, 'gpt-4-turbo', 'openai', 10.00, 30.00, 8.00, 24.00, true, NOW(), NOW()),
  (gen_random_uuid()::text, 'gpt-3.5-turbo', 'openai', 0.50, 1.50, 0.40, 1.20, true, NOW(), NOW()),

  -- Gemini 系列
  (gen_random_uuid()::text, 'gemini-1.5-pro', 'openai', 1.25, 5.00, 1.00, 4.00, true, NOW(), NOW()),
  (gen_random_uuid()::text, 'gemini-1.5-flash', 'openai', 0.075, 0.30, 0.06, 0.24, true, NOW(), NOW()),

  -- DeepSeek 系列
  (gen_random_uuid()::text, 'deepseek-chat', 'openai', 0.14, 0.28, 0.11, 0.22, true, NOW(), NOW()),
  (gen_random_uuid()::text, 'deepseek-coder', 'openai', 0.14, 0.28, 0.11, 0.22, true, NOW(), NOW())
ON CONFLICT (name) DO NOTHING;

-- ============================================
-- 4. 统计结果
-- ============================================
SELECT '✓ 数据库初始化完成' as status;
SELECT COUNT(*) as admin_count FROM "User" WHERE role = 'admin';
SELECT COUNT(*) as provider_count FROM "Provider";
SELECT COUNT(*) as model_count FROM "Model";
EOF

if [ $? -eq 0 ]; then
    echo ""
    echo "✓ 数据库初始化成功！"
    echo ""
    echo "管理员账号:"
    echo "  邮箱: admin@openclaw-relay.com"
    echo "  密码: !AgentOPC2026"
    echo ""
    echo "请访问 https://relay.agentopc.xyz/admin 查看管理后台"
else
    echo ""
    echo "✗ 初始化失败，请检查数据库连接"
    exit 1
fi
