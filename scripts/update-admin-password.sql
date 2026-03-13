-- 更新管理员密码
-- 邮箱: admin@openclaw-relay.com
-- 新密码: !AgentOPC2026

UPDATE "User"
SET password = '$2b$10$OjHsvWpJUXV0oZ8beI80U.A2wuiCt.87K3q5ghEYj2nUdpNKC8OXO',
    "updatedAt" = NOW()
WHERE email = 'admin@openclaw-relay.com';

-- 验证更新
SELECT email, role, "updatedAt"
FROM "User"
WHERE email = 'admin@openclaw-relay.com';
