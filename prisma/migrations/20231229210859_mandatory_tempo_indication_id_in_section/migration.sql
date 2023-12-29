/*
  Warnings:

  - Made the column `tempoIndicationId` on table `Section` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "Section" DROP CONSTRAINT "Section_tempoIndicationId_fkey";

-- AlterTable
ALTER TABLE "Section" ALTER COLUMN "tempoIndicationId" SET NOT NULL;

-- AddForeignKey
ALTER TABLE "Section" ADD CONSTRAINT "Section_tempoIndicationId_fkey" FOREIGN KEY ("tempoIndicationId") REFERENCES "TempoIndication"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
