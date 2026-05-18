/*
  Warnings:

  - You are about to drop the column `isFastestStructuralNoteBelCanto` on the `Section` table. All the data in the column will be lost.

*/
-- Copy the structural note value into the new Bel Canto field
UPDATE "Section" AS s
SET "fastestBelCantoNotesPerBar" = s."fastestStructuralNotesPerBar"
WHERE s."isFastestStructuralNoteBelCanto" = true;

-- AlterTable
ALTER TABLE "Section" DROP COLUMN "isFastestStructuralNoteBelCanto";
