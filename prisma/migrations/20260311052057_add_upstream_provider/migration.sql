-- AlterTable
ALTER TABLE "Model" ADD COLUMN     "upstreamModelId" TEXT,
ADD COLUMN     "upstreamProvider" TEXT NOT NULL DEFAULT 'openai';
