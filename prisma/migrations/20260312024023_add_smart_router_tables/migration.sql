-- CreateTable
CREATE TABLE "RouterStats" (
    "id" TEXT NOT NULL,
    "ruleId" TEXT,
    "modelId" TEXT NOT NULL,
    "hitCount" INTEGER NOT NULL DEFAULT 0,
    "totalCost" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "avgLatency" INTEGER,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RouterStats_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "RouterStats_date_idx" ON "RouterStats"("date");

-- CreateIndex
CREATE INDEX "RouterStats_ruleId_idx" ON "RouterStats"("ruleId");
