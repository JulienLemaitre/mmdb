/*
  Warnings:

  - Made the column `tempoIndicationId` on table `Section` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "Section" DROP CONSTRAINT "Section_tempoIndicationId_fkey";

-- Replace NULL values with TEMPO_INDICATION_NONE_ID
UPDATE "Section" SET "tempoIndicationId" = '6a16e457-6aeb-4802-a59e-4ce3b91cafa2' WHERE "tempoIndicationId" IS NULL;

-- AlterTable
ALTER TABLE "Section" ALTER COLUMN "tempoIndicationId" SET NOT NULL;

-- AddForeignKey
ALTER TABLE "Section" ADD CONSTRAINT "Section_tempoIndicationId_fkey" FOREIGN KEY ("tempoIndicationId") REFERENCES "TempoIndication"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
