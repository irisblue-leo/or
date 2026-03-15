-- OpenClaw Relay 数据库同步 SQL
-- 用于将本地的数据库更改同步到线上环境
-- 
-- 使用方法：
-- psql $DATABASE_URL -f sync-database.sql

-- ==========================================
-- 1. 添加用户聚合器选择字段
-- ==========================================

-- 添加 preferredAggregator 字段（如果不存在）
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'User' AND column_name = 'preferredAggregator'
  ) THEN
    ALTER TABLE "User" ADD COLUMN "preferredAggregator" TEXT NOT NULL DEFAULT 'default';
    RAISE NOTICE '✅ Added preferredAggregator column';
  ELSE
    RAISE NOTICE 'ℹ️  preferredAggregator column already exists';
  END IF;
END $$;

-- 添加 enableSmartModel 字段（如果不存在）
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'User' AND column_name = 'enableSmartModel'
  ) THEN
    ALTER TABLE "User" ADD COLUMN "enableSmartModel" BOOLEAN NOT NULL DEFAULT false;
    RAISE NOTICE '✅ Added enableSmartModel column';
  ELSE
    RAISE NOTICE 'ℹ️  enableSmartModel column already exists';
  END IF;
END $$;

-- ==========================================
-- 2. 添加 302.ai 上游提供商
-- ==========================================

INSERT INTO "UpstreamProvider" (
  id, 
  name, 
  slug, 
  "apiUrl", 
  "apiKey", 
  "priceMultiplier", 
  active, 
  priority, 
  notes, 
  "createdAt", 
  "updatedAt"
)
VALUES (
  gen_random_uuid(),
  '302.ai',
  '302ai',
  'https://api.302.ai/v1',
  'sk-ZKMmhkzdCtV4PGGOzCbSk4W4nzGDb0GfpjWs6NOLNGuAVGbp',
  1.15,
  true,
  10,
  '302.ai 聚合服务，支持多种 AI 模型',
  NOW(),
  NOW()
)
ON CONFLICT (slug) DO UPDATE SET
  "apiKey" = EXCLUDED."apiKey",
  "apiUrl" = EXCLUDED."apiUrl",
  "updatedAt" = NOW(),
  active = true;

-- ==========================================
-- 3. 添加 302.ai 的模型
-- ==========================================

DO $$
DECLARE
  provider_id UUID;
BEGIN
  -- 获取 302.ai 的 provider ID
  SELECT id INTO provider_id FROM "UpstreamProvider" WHERE slug = '302ai';
  
  IF provider_id IS NULL THEN
    RAISE EXCEPTION '❌ 302.ai provider not found';
  END IF;
  
  -- 添加 GPT-4o (302.ai)
  INSERT INTO "Model" (
    id, name, provider, "upstreamProvider", "upstreamModelId", "providerId",
    "inputPrice", "outputPrice", "upstreamInput", "upstreamOutput",
    "priceMultiplier", active
  )
  VALUES (
    gen_random_uuid(),
    'GPT-4o (302.ai)',
    'openai',
    '302ai',
    'gpt-4o',
    provider_id,
    15.00, 60.00, 10.00, 30.00,
    1.15,
    true
  )
  ON CONFLICT (name) DO UPDATE SET
    "upstreamModelId" = EXCLUDED."upstreamModelId",
    "providerId" = EXCLUDED."providerId",
    active = true;
  
  -- 添加 Claude 3.5 Sonnet (302.ai)
  INSERT INTO "Model" (
    id, name, provider, "upstreamProvider", "upstreamModelId", "providerId",
    "inputPrice", "outputPrice", "upstreamInput", "upstreamOutput",
    "priceMultiplier", active
  )
  VALUES (
    gen_random_uuid(),
    'Claude 3.5 Sonnet (302.ai)',
    'anthropic',
    '302ai',
    'claude-3-5-sonnet-20240620',
    provider_id,
    3.00, 15.00, 2.00, 10.00,
    1.15,
    true
  )
  ON CONFLICT (name) DO UPDATE SET
    "upstreamModelId" = EXCLUDED."upstreamModelId",
    "providerId" = EXCLUDED."providerId",
    active = true;
  
  -- 添加 DeepSeek Chat (302.ai)
  INSERT INTO "Model" (
    id, name, provider, "upstreamProvider", "upstreamModelId", "providerId",
    "inputPrice", "outputPrice", "upstreamInput", "upstreamOutput",
    "priceMultiplier", active
  )
  VALUES (
    gen_random_uuid(),
    'DeepSeek Chat (302.ai)',
    'deepseek',
    '302ai',
    'deepseek-chat',
    provider_id,
    0.30, 0.60, 0.14, 0.28,
    1.15,
    true
  )
  ON CONFLICT (name) DO UPDATE SET
    "upstreamModelId" = EXCLUDED."upstreamModelId",
    "providerId" = EXCLUDED."providerId",
    active = true;
  
  -- 添加 Qwen Max (302.ai)
  INSERT INTO "Model" (
    id, name, provider, "upstreamProvider", "upstreamModelId", "providerId",
    "inputPrice", "outputPrice", "upstreamInput", "upstreamOutput",
    "priceMultiplier", active
  )
  VALUES (
    gen_random_uuid(),
    'Qwen Max (302.ai)',
    'qwen',
    '302ai',
    'qwen-max',
    provider_id,
    0.50, 1.50, 0.40, 1.20,
    1.15,
    true
  )
  ON CONFLICT (name) DO UPDATE SET
    "upstreamModelId" = EXCLUDED."upstreamModelId",
    "providerId" = EXCLUDED."providerId",
    active = true;
  
  -- 添加 GLM-4 (302.ai)
  INSERT INTO "Model" (
    id, name, provider, "upstreamProvider", "upstreamModelId", "providerId",
    "inputPrice", "outputPrice", "upstreamInput", "upstreamOutput",
    "priceMultiplier", active
  )
  VALUES (
    gen_random_uuid(),
    'GLM-4 (302.ai)',
    'zhipu',
    '302ai',
    'glm-4-0520',
    provider_id,
    1.15, 1.15, 1.00, 1.00,
    1.15,
    true
  )
  ON CONFLICT (name) DO UPDATE SET
    "upstreamModelId" = EXCLUDED."upstreamModelId",
    "providerId" = EXCLUDED."providerId",
    active = true;
  
  RAISE NOTICE '✅ 5 models added/updated for 302.ai';
END $$;

-- ==========================================
-- 4. 验证数据
-- ==========================================

\echo ''
\echo '=========================================='
\echo '验证数据'
\echo '=========================================='
\echo ''

\echo '上游提供商列表：'
SELECT 
  name, 
  slug, 
  active, 
  priority,
  SUBSTRING("apiUrl", 1, 30) as "apiUrl"
FROM "UpstreamProvider" 
ORDER BY priority DESC;

\echo ''
\echo '302.ai 模型列表：'
SELECT 
  name, 
  provider, 
  "upstreamModelId", 
  active
FROM "Model" 
WHERE "upstreamProvider" = '302ai';

\echo ''
\echo 'User 表新增字段：'
SELECT 
  column_name, 
  data_type, 
  column_default
FROM information_schema.columns 
WHERE table_name = 'User' 
  AND column_name IN ('preferredAggregator', 'enableSmartModel');

\echo ''
\echo '=========================================='
\echo '✅ 数据库同步完成！'
\echo '=========================================='
