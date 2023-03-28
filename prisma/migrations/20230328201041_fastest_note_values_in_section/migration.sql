/*
  Warnings:

  - You are about to drop the column `additionalTerm` on the `TempoIndication` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[baseTerm,additionalTermAppend,additionalTermPrepend]` on the table `TempoIndication` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `category` to the `Piece` table without a default value. This is not possible if the table is not empty.
  - Added the required column `fastestOrnamentalNote` to the `Section` table without a default value. This is not possible if the table is not empty.
  - Added the required column `fastestStacattoNote` to the `Section` table without a default value. This is not possible if the table is not empty.
  - Added the required column `fastestStructuralNote` to the `Section` table without a default value. This is not possible if the table is not empty.
  - Added the required column `notesPerSecond` to the `Section` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "PIECE_CATEGORY" AS ENUM ('KEYBOARD', 'CHAMBER_INSTRUMENTAL', 'ORCHESTRAL', 'VOCAL');

-- DropIndex
DROP INDEX "TempoIndication_baseTerm_additionalTerm_key";

-- AlterTable
ALTER TABLE "Piece" ADD COLUMN     "category" "PIECE_CATEGORY" NOT NULL;

-- AlterTable
ALTER TABLE "Section" ADD COLUMN     "fastestOrnamentalNote" "BEAT_UNIT" NOT NULL,
ADD COLUMN     "fastestStacattoNote" "BEAT_UNIT" NOT NULL,
ADD COLUMN     "fastestStructuralNote" "BEAT_UNIT" NOT NULL,
ADD COLUMN     "notesPerSecond" JSONB NOT NULL;

-- AlterTable
ALTER TABLE "TempoIndication" DROP COLUMN "additionalTerm",
ADD COLUMN     "additionalTermAppend" TEXT,
ADD COLUMN     "additionalTermPrepend" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "TempoIndication_baseTerm_additionalTermAppend_additionalTer_key" ON "TempoIndication"("baseTerm", "additionalTermAppend", "additionalTermPrepend");
