-- 邮箱验证功能数据库迁移脚本
-- 在线上数据库执行此脚本

-- 添加邮箱验证相关字段到 User 表
ALTER TABLE "User"
ADD COLUMN IF NOT EXISTS "emailVerified" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS "verificationToken" TEXT,
ADD COLUMN IF NOT EXISTS "tokenExpiresAt" TIMESTAMP(3);

-- 为已存在的用户设置邮箱已验证（可选，根据需求决定）
-- UPDATE "User" SET "emailVerified" = true WHERE "emailVerified" = false;

-- 查看更新结果
SELECT id, email, "emailVerified", "verificationToken", "tokenExpiresAt"
FROM "User"
LIMIT 5;
