/*
  Warnings:

  - You are about to drop the column `fastestOrnamentalNotePerBar` on the `Section` table. All the data in the column will be lost.
  - You are about to drop the column `fastestRepeatedNotePerBar` on the `Section` table. All the data in the column will be lost.
  - You are about to drop the column `fastestStaccatoNotePerBar` on the `Section` table. All the data in the column will be lost.
  - You are about to drop the column `fastestStructuralNotePerBar` on the `Section` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Section" DROP COLUMN "fastestOrnamentalNotePerBar",
DROP COLUMN "fastestRepeatedNotePerBar",
DROP COLUMN "fastestStaccatoNotePerBar",
DROP COLUMN "fastestStructuralNotePerBar",
ADD COLUMN     "fastestOrnamentalNotesPerBar" INTEGER,
ADD COLUMN     "fastestRepeatedNotesPerBar" INTEGER,
ADD COLUMN     "fastestStaccatoNotesPerBar" INTEGER,
ADD COLUMN     "fastestStructuralNotesPerBar" INTEGER;
