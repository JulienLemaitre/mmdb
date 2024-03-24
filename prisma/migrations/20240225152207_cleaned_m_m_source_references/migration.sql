/*
  Warnings:

  - You are about to drop the column `sourceId` on the `Contribution` table. All the data in the column will be lost.
  - You are about to drop the column `sourceId` on the `MetronomeMark` table. All the data in the column will be lost.
  - You are about to drop the column `mMSourceId` on the `PieceVersion` table. All the data in the column will be lost.
  - You are about to drop the column `sourceId` on the `Reference` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[mMSourceId,sectionId]` on the table `MetronomeMark` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `mMSourceId` to the `Contribution` table without a default value. This is not possible if the table is not empty.
  - Added the required column `mMSourceId` to the `MetronomeMark` table without a default value. This is not possible if the table is not empty.
  - Added the required column `mMSourceId` to the `Reference` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Contribution" DROP CONSTRAINT "Contribution_sourceId_fkey";

-- DropForeignKey
ALTER TABLE "MetronomeMark" DROP CONSTRAINT "MetronomeMark_sourceId_fkey";

-- DropForeignKey
ALTER TABLE "PieceVersion" DROP CONSTRAINT "PieceVersion_mMSourceId_fkey";

-- DropForeignKey
ALTER TABLE "Reference" DROP CONSTRAINT "Reference_sourceId_fkey";

-- DropIndex
DROP INDEX "MetronomeMark_sourceId_sectionId_key";

-- AlterTable
ALTER TABLE "Contribution" DROP COLUMN "sourceId",
ADD COLUMN     "mMSourceId" UUID NOT NULL;

-- AlterTable
ALTER TABLE "MetronomeMark" DROP COLUMN "sourceId",
ADD COLUMN     "mMSourceId" UUID NOT NULL;

-- AlterTable
ALTER TABLE "PieceVersion" DROP COLUMN "mMSourceId";

-- AlterTable
ALTER TABLE "Reference" DROP COLUMN "sourceId",
ADD COLUMN     "mMSourceId" UUID NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "MetronomeMark_mMSourceId_sectionId_key" ON "MetronomeMark"("mMSourceId", "sectionId");

-- AddForeignKey
ALTER TABLE "MetronomeMark" ADD CONSTRAINT "MetronomeMark_mMSourceId_fkey" FOREIGN KEY ("mMSourceId") REFERENCES "MMSource"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reference" ADD CONSTRAINT "Reference_mMSourceId_fkey" FOREIGN KEY ("mMSourceId") REFERENCES "MMSource"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Contribution" ADD CONSTRAINT "Contribution_mMSourceId_fkey" FOREIGN KEY ("mMSourceId") REFERENCES "MMSource"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
