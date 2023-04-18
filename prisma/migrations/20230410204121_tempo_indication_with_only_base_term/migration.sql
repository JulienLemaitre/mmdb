/*
  Warnings:

  - You are about to drop the column `additionalTermAppend` on the `TempoIndication` table. All the data in the column will be lost.
  - You are about to drop the column `additionalTermPrepend` on the `TempoIndication` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[baseTerm]` on the table `TempoIndication` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "TempoIndication_baseTerm_additionalTermAppend_additionalTer_key";

-- AlterTable
ALTER TABLE "TempoIndication" DROP COLUMN "additionalTermAppend",
DROP COLUMN "additionalTermPrepend";

-- CreateIndex
CREATE UNIQUE INDEX "TempoIndication_baseTerm_key" ON "TempoIndication"("baseTerm");
