/*
  Warnings:

  - You are about to drop the column `noteValues` on the `MetronomeMark` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "MetronomeMark" DROP COLUMN "noteValues",
ADD COLUMN     "notesPerBar" JSONB;
