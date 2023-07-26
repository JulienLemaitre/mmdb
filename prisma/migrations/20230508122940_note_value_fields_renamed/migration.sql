/*
  Warnings:

  - You are about to drop the column `notes` on the `MetronomeMark` table. All the data in the column will be lost.
  - You are about to drop the column `fastestOrnamentalNote` on the `Section` table. All the data in the column will be lost.
  - You are about to drop the column `fastestStaccatoNote` on the `Section` table. All the data in the column will be lost.
  - You are about to drop the column `fastestStructuralNote` on the `Section` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "MetronomeMark" DROP COLUMN "notes",
ADD COLUMN     "noteValues" JSONB;

-- AlterTable
ALTER TABLE "Section" DROP COLUMN "fastestOrnamentalNote",
DROP COLUMN "fastestStaccatoNote",
DROP COLUMN "fastestStructuralNote",
ADD COLUMN     "fastestOrnamentalNoteValue" "NOTE_VALUE",
ADD COLUMN     "fastestStaccatoNoteValue" "NOTE_VALUE",
ADD COLUMN     "fastestStructuralNoteValue" "NOTE_VALUE";
