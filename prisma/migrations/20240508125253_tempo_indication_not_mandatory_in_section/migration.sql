/*
  Warnings:

  - The values [COMPOSER] on the enum `CONTRIBUTION_ROLE` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "CONTRIBUTION_ROLE_new" AS ENUM ('MM_PROVIDER', 'EDITOR', 'TRANSLATOR', 'TRANSCRIBER', 'ARRANGER', 'PUBLISHER', 'OTHER');
ALTER TABLE "Contribution" ALTER COLUMN "role" TYPE "CONTRIBUTION_ROLE_new" USING ("role"::text::"CONTRIBUTION_ROLE_new");
ALTER TYPE "CONTRIBUTION_ROLE" RENAME TO "CONTRIBUTION_ROLE_old";
ALTER TYPE "CONTRIBUTION_ROLE_new" RENAME TO "CONTRIBUTION_ROLE";
DROP TYPE "CONTRIBUTION_ROLE_old";
COMMIT;

-- DropForeignKey
ALTER TABLE "Section" DROP CONSTRAINT "Section_tempoIndicationId_fkey";

-- AlterTable
ALTER TABLE "Section" ALTER COLUMN "tempoIndicationId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "Section" ADD CONSTRAINT "Section_tempoIndicationId_fkey" FOREIGN KEY ("tempoIndicationId") REFERENCES "TempoIndication"("id") ON DELETE SET NULL ON UPDATE CASCADE;
