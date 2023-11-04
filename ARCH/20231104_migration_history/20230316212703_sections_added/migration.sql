/*
  Warnings:

  - You are about to drop the column `movementId` on the `MetronomeMark` table. All the data in the column will be lost.
  - You are about to drop the column `metreDenominator` on the `Movement` table. All the data in the column will be lost.
  - You are about to drop the column `metreNumerator` on the `Movement` table. All the data in the column will be lost.
  - You are about to drop the column `tempoIndicationId` on the `Movement` table. All the data in the column will be lost.
  - You are about to drop the column `title` on the `Movement` table. All the data in the column will be lost.
  - You are about to drop the column `date` on the `Source` table. All the data in the column will be lost.
  - Added the required column `sectionId` to the `MetronomeMark` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Contribution" DROP CONSTRAINT "Contribution_personId_fkey";

-- DropForeignKey
ALTER TABLE "MetronomeMark" DROP CONSTRAINT "MetronomeMark_movementId_fkey";

-- DropForeignKey
ALTER TABLE "Movement" DROP CONSTRAINT "Movement_tempoIndicationId_fkey";

-- AlterTable
ALTER TABLE "Contribution" ADD COLUMN     "organizationId" TEXT,
ALTER COLUMN "personId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "MetronomeMark" DROP COLUMN "movementId",
ADD COLUMN     "sectionId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Movement" DROP COLUMN "metreDenominator",
DROP COLUMN "metreNumerator",
DROP COLUMN "tempoIndicationId",
DROP COLUMN "title";

-- AlterTable
ALTER TABLE "Source" DROP COLUMN "date",
ADD COLUMN     "plate_number" TEXT;

-- CreateTable
CREATE TABLE "Section" (
    "id" TEXT NOT NULL,
    "movementId" TEXT,
    "pieceId" TEXT,
    "rank" INTEGER NOT NULL,
    "metreNumerator" INTEGER NOT NULL,
    "metreDenominator" INTEGER NOT NULL,
    "tempoIndicationId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Section_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Organization" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Organization_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Section_movementId_rank_key" ON "Section"("movementId", "rank");

-- CreateIndex
CREATE UNIQUE INDEX "Section_pieceId_rank_key" ON "Section"("pieceId", "rank");

-- AddForeignKey
ALTER TABLE "Section" ADD CONSTRAINT "Section_movementId_fkey" FOREIGN KEY ("movementId") REFERENCES "Movement"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Section" ADD CONSTRAINT "Section_pieceId_fkey" FOREIGN KEY ("pieceId") REFERENCES "Piece"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Section" ADD CONSTRAINT "Section_tempoIndicationId_fkey" FOREIGN KEY ("tempoIndicationId") REFERENCES "TempoIndication"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Contribution" ADD CONSTRAINT "Contribution_personId_fkey" FOREIGN KEY ("personId") REFERENCES "Person"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Contribution" ADD CONSTRAINT "Contribution_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MetronomeMark" ADD CONSTRAINT "MetronomeMark_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "Section"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
