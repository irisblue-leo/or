-- CreateTable
CREATE TABLE "SystemConfig" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "description" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "updatedBy" TEXT,

    CONSTRAINT "SystemConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RouterConfig" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "conditions" JSONB NOT NULL,
    "targetModelId" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RouterConfig_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SystemConfig_key_key" ON "SystemConfig"("key");

-- CreateIndex
CREATE INDEX "RouterConfig_enabled_priority_idx" ON "RouterConfig"("enabled", "priority" DESC);

-- AddForeignKey
ALTER TABLE "RouterConfig" ADD CONSTRAINT "RouterConfig_targetModelId_fkey" FOREIGN KEY ("targetModelId") REFERENCES "Model"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Insert initial system config
INSERT INTO "SystemConfig" ("id", "key", "value", "description", "updatedAt") VALUES
    ('cfg_router_mode', 'router_mode', 'normal', '路由模式：normal=普通模式, smart=智能路由', NOW()),
    ('cfg_default_model', 'default_model', 'anthropic/claude-opus-4.6', '普通模式默认模型', NOW());
