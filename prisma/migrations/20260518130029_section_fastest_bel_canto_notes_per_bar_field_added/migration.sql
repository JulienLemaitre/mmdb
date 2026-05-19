/*
  Warnings:

  - A unique constraint covering the columns `[type,reference]` on the table `Reference` will be added. If there are existing duplicate values, this will fail.

*/

-- AlterTable
ALTER TABLE "Section" ADD COLUMN     "fastestBelCantoNotesPerBar" DOUBLE PRECISION;
