-- OpenClaw Relay 数据库初始化脚本

-- 1. 创建管理员账号
-- 密码：admin123（bcrypt hash）
INSERT INTO "User" (id, email, password, name, role, balance, "createdAt", "updatedAt")
VALUES (
  'admin-' || gen_random_uuid()::text,
  'admin@openclaw-relay.com',
  '$2a$10$rOZJKH.qH8qH8qH8qH8qH8qH8qH8qH8qH8qH8qH8qH8qH8qH8qH8q',  -- 需要替换为实际的 bcrypt hash
  'Admin',
  'admin',
  1000.00,
  NOW(),
  NOW()
)
ON CONFLICT (email) DO NOTHING;

-- 2. 添加常用模型（定价参考市场标准，单位：$/1M tokens）
INSERT INTO "Model" (id, name, provider, "inputPrice", "outputPrice", "upstreamInput", "upstreamOutput", active)
VALUES 
  -- Claude 4 系列（最新）
  (gen_random_uuid()::text, 'claude-opus-4-6', 'openai', 15.00, 75.00, 12.00, 60.00, true),
  (gen_random_uuid()::text, 'claude-sonnet-4-6', 'openai', 3.00, 15.00, 2.40, 12.00, true),
  (gen_random_uuid()::text, 'claude-haiku-4-5-20251001', 'openai', 0.80, 4.00, 0.64, 3.20, true),
  
  -- Claude 3.5 系列
  (gen_random_uuid()::text, 'claude-3.5-sonnet', 'openai', 3.00, 15.00, 2.40, 12.00, true),
  (gen_random_uuid()::text, 'claude-3.5-haiku', 'openai', 0.80, 4.00, 0.64, 3.20, true),
  
  -- GPT 系列
  (gen_random_uuid()::text, 'gpt-4o', 'openai', 2.50, 10.00, 2.00, 8.00, true),
  (gen_random_uuid()::text, 'gpt-4o-mini', 'openai', 0.15, 0.60, 0.12, 0.48, true),
  (gen_random_uuid()::text, 'gpt-4-turbo', 'openai', 10.00, 30.00, 8.00, 24.00, true),
  
  -- Gemini 系列
  (gen_random_uuid()::text, 'gemini-1.5-pro', 'openai', 1.25, 5.00, 1.00, 4.00, true),
  (gen_random_uuid()::text, 'gemini-1.5-flash', 'openai', 0.075, 0.30, 0.06, 0.24, true)
ON CONFLICT (name) DO NOTHING;

-- 3. 生成测试充值码（可选）
-- INSERT INTO "RedeemCode" (id, code, amount, status, "createdById", "createdAt")
-- SELECT 
--   gen_random_uuid()::text,
--   'OCR-TEST-' || LPAD(generate_series::text, 4, '0'),
--   100.00,
--   'unused',
--   (SELECT id FROM "User" WHERE role = 'admin' LIMIT 1),
--   NOW()
-- FROM generate_series(1, 10);

SELECT 'Database initialized successfully' as result;
