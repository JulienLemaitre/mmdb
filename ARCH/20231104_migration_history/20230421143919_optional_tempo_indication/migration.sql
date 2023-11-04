-- DropForeignKey
ALTER TABLE "Section" DROP CONSTRAINT "Section_tempoIndicationId_fkey";

-- AlterTable
ALTER TABLE "Section" ALTER COLUMN "tempoIndicationId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "Section" ADD CONSTRAINT "Section_tempoIndicationId_fkey" FOREIGN KEY ("tempoIndicationId") REFERENCES "TempoIndication"("id") ON DELETE SET NULL ON UPDATE CASCADE;
