/*
  Warnings:

  - You are about to drop the column `references` on the `Source` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "REFERENCE_TYPE" AS ENUM ('PLATE_NUMBER', 'ISBN', 'ISMN');

-- AlterTable
ALTER TABLE "Source" DROP COLUMN "references";

-- CreateTable
CREATE TABLE "Reference" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "sourceId" UUID NOT NULL,
    "type" "REFERENCE_TYPE" NOT NULL,
    "reference" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Reference_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Reference_sourceId_reference_key" ON "Reference"("sourceId", "reference");

-- AddForeignKey
ALTER TABLE "Reference" ADD CONSTRAINT "Reference_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "Source"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
