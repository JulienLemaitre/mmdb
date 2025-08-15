/*
  Warnings:

  - The primary key for the `MMSourcesOnPieceVersions` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - A unique constraint covering the columns `[mMSourceId,rank]` on the table `MMSourcesOnPieceVersions` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[mMSourceId,pieceVersionId]` on the table `MMSourcesOnPieceVersions` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "MMSourcesOnPieceVersions" DROP CONSTRAINT "MMSourcesOnPieceVersions_pkey",
ADD COLUMN     "id" UUID NOT NULL DEFAULT gen_random_uuid(),
ADD CONSTRAINT "MMSourcesOnPieceVersions_pkey" PRIMARY KEY ("id");

-- CreateIndex
CREATE UNIQUE INDEX "MMSourcesOnPieceVersions_mMSourceId_rank_key" ON "MMSourcesOnPieceVersions"("mMSourceId", "rank");

-- CreateIndex
CREATE UNIQUE INDEX "MMSourcesOnPieceVersions_mMSourceId_pieceVersionId_key" ON "MMSourcesOnPieceVersions"("mMSourceId", "pieceVersionId");
