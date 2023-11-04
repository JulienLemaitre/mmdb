/*
  Warnings:

  - You are about to drop the column `fastestOrnamentalNoteValue` on the `Section` table. All the data in the column will be lost.
  - You are about to drop the column `fastestRepeatedNoteValue` on the `Section` table. All the data in the column will be lost.
  - You are about to drop the column `fastestStaccatoNoteValue` on the `Section` table. All the data in the column will be lost.
  - You are about to drop the column `fastestStructuralNoteValue` on the `Section` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Section" DROP COLUMN "fastestOrnamentalNoteValue",
DROP COLUMN "fastestRepeatedNoteValue",
DROP COLUMN "fastestStaccatoNoteValue",
DROP COLUMN "fastestStructuralNoteValue";
