/*
  Warnings:

  - Made the column `link` on table `Source` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "Source" ALTER COLUMN "link" SET NOT NULL;
