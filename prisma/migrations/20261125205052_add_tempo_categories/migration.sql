-- CreateTable
CREATE TABLE "TempoCategory" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" TEXT NOT NULL,
    "rank" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TempoCategory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TempoCategoriesOnTempoIndications" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "tempoIndicationId" UUID NOT NULL,
    "tempoCategoryId" UUID NOT NULL,
    "isPrimary" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TempoCategoriesOnTempoIndications_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "TempoCategory_name_key" ON "TempoCategory"("name");

-- CreateIndex
CREATE UNIQUE INDEX "TempoCategory_rank_key" ON "TempoCategory"("rank");

-- CreateIndex
CREATE INDEX "TempoCategoriesOnTempoIndications_tempoCategoryId_idx" ON "TempoCategoriesOnTempoIndications"("tempoCategoryId");

-- CreateIndex
CREATE INDEX "TempoCategoriesOnTempoIndications_tempoIndicationId_idx" ON "TempoCategoriesOnTempoIndications"("tempoIndicationId");

-- CreateIndex
CREATE UNIQUE INDEX "TempoCategoriesOnTempoIndications_tempoIndicationId_tempoCa_key" ON "TempoCategoriesOnTempoIndications"("tempoIndicationId", "tempoCategoryId");

-- AddForeignKey
ALTER TABLE "TempoCategoriesOnTempoIndications" ADD CONSTRAINT "TempoCategoriesOnTempoIndications_tempoIndicationId_fkey" FOREIGN KEY ("tempoIndicationId") REFERENCES "TempoIndication"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TempoCategoriesOnTempoIndications" ADD CONSTRAINT "TempoCategoriesOnTempoIndications_tempoCategoryId_fkey" FOREIGN KEY ("tempoCategoryId") REFERENCES "TempoCategory"("id") ON DELETE CASCADE ON UPDATE CASCADE;
