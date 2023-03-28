/*
  Warnings:

  - You are about to drop the column `metreSymbol` on the `Section` table. All the data in the column will be lost.
  - You are about to drop the column `notesPerSecond` on the `Section` table. All the data in the column will be lost.
  - Added the required column `metreString` to the `Section` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "MetronomeMark" ADD COLUMN     "notesPerSecond" JSONB;

-- AlterTable
ALTER TABLE "Section" DROP COLUMN "metreSymbol",
DROP COLUMN "notesPerSecond",
ADD COLUMN     "metreString" TEXT NOT NULL,
ALTER COLUMN "fastestOrnamentalNote" DROP NOT NULL,
ALTER COLUMN "fastestStacattoNote" DROP NOT NULL,
ALTER COLUMN "fastestStructuralNote" DROP NOT NULL;
