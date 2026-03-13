-- AlterTable
ALTER TABLE "Model" ADD COLUMN     "providerId" TEXT;

-- CreateTable
CREATE TABLE "UpstreamProvider" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "apiUrl" TEXT NOT NULL,
    "apiKey" TEXT NOT NULL,
    "priceMultiplier" DOUBLE PRECISION NOT NULL DEFAULT 1.25,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UpstreamProvider_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "UpstreamProvider_name_key" ON "UpstreamProvider"("name");

-- CreateIndex
CREATE UNIQUE INDEX "UpstreamProvider_slug_key" ON "UpstreamProvider"("slug");

-- CreateIndex
CREATE INDEX "Model_providerId_idx" ON "Model"("providerId");

-- AddForeignKey
ALTER TABLE "Model" ADD CONSTRAINT "Model_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "UpstreamProvider"("id") ON DELETE SET NULL ON UPDATE CASCADE;
