/*
  Warnings:

  - You are about to drop the `Source` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `_PieceVersionToSource` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[collectionId,collectionRank]` on the table `Piece` will be added. If there are existing duplicate values, this will fail.

*/
-- DropForeignKey
ALTER TABLE "Contribution" DROP CONSTRAINT "Contribution_sourceId_fkey";

-- DropForeignKey
ALTER TABLE "MetronomeMark" DROP CONSTRAINT "MetronomeMark_sourceId_fkey";

-- DropForeignKey
ALTER TABLE "Reference" DROP CONSTRAINT "Reference_sourceId_fkey";

-- DropForeignKey
ALTER TABLE "Source" DROP CONSTRAINT "Source_creatorId_fkey";

-- DropForeignKey
ALTER TABLE "_PieceVersionToSource" DROP CONSTRAINT "_PieceVersionToSource_A_fkey";

-- DropForeignKey
ALTER TABLE "_PieceVersionToSource" DROP CONSTRAINT "_PieceVersionToSource_B_fkey";

-- AlterTable
ALTER TABLE "Piece" ADD COLUMN     "collectionId" UUID,
ADD COLUMN     "collectionRank" INTEGER;

-- AlterTable
ALTER TABLE "PieceVersion" ADD COLUMN     "mMSourceId" UUID;

-- DropTable
DROP TABLE "Source";

-- DropTable
DROP TABLE "_PieceVersionToSource";

-- CreateTable
CREATE TABLE "Collection" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "title" TEXT NOT NULL,
    "composerId" UUID NOT NULL,

    CONSTRAINT "Collection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MMSourcesOnPieceVersions" (
    "pieceVersionId" UUID NOT NULL,
    "mMSourceId" UUID NOT NULL,
    "rank" INTEGER NOT NULL,

    CONSTRAINT "MMSourcesOnPieceVersions_pkey" PRIMARY KEY ("mMSourceId","rank")
);

-- CreateTable
CREATE TABLE "MMSource" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "title" TEXT,
    "type" "SOURCE_TYPE" NOT NULL,
    "link" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "creatorId" UUID,
    "comment" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MMSource_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Collection_composerId_title_key" ON "Collection"("composerId", "title");

-- CreateIndex
CREATE UNIQUE INDEX "Piece_collectionId_collectionRank_key" ON "Piece"("collectionId", "collectionRank");

-- AddForeignKey
ALTER TABLE "Collection" ADD CONSTRAINT "Collection_composerId_fkey" FOREIGN KEY ("composerId") REFERENCES "Person"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Piece" ADD CONSTRAINT "Piece_collectionId_fkey" FOREIGN KEY ("collectionId") REFERENCES "Collection"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PieceVersion" ADD CONSTRAINT "PieceVersion_mMSourceId_fkey" FOREIGN KEY ("mMSourceId") REFERENCES "MMSource"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MetronomeMark" ADD CONSTRAINT "MetronomeMark_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "MMSource"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MMSourcesOnPieceVersions" ADD CONSTRAINT "MMSourcesOnPieceVersions_pieceVersionId_fkey" FOREIGN KEY ("pieceVersionId") REFERENCES "PieceVersion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MMSourcesOnPieceVersions" ADD CONSTRAINT "MMSourcesOnPieceVersions_mMSourceId_fkey" FOREIGN KEY ("mMSourceId") REFERENCES "MMSource"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MMSource" ADD CONSTRAINT "MMSource_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reference" ADD CONSTRAINT "Reference_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "MMSource"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Contribution" ADD CONSTRAINT "Contribution_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "MMSource"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
