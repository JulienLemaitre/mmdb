/*
  Warnings:

  - You are about to drop the column `pieceId` on the `Movement` table. All the data in the column will be lost.
  - You are about to drop the column `category` on the `Piece` table. All the data in the column will be lost.
  - You are about to drop the `_PieceToSource` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[pieceVersionId,rank]` on the table `Movement` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `pieceVersionId` to the `Movement` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Movement" DROP CONSTRAINT "Movement_pieceId_fkey";

-- DropForeignKey
ALTER TABLE "_PieceToSource" DROP CONSTRAINT "_PieceToSource_A_fkey";

-- DropForeignKey
ALTER TABLE "_PieceToSource" DROP CONSTRAINT "_PieceToSource_B_fkey";

-- DropIndex
DROP INDEX "Movement_pieceId_rank_key";

-- AlterTable
ALTER TABLE "Movement" DROP COLUMN "pieceId",
ADD COLUMN     "pieceVersionId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Piece" DROP COLUMN "category",
ALTER COLUMN "yearOfComposition" DROP NOT NULL;

-- DropTable
DROP TABLE "_PieceToSource";

-- CreateTable
CREATE TABLE "PieceVersion" (
    "id" TEXT NOT NULL,
    "pieceId" TEXT NOT NULL,
    "category" "PIECE_CATEGORY" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PieceVersion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_PieceVersionToSource" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "_PieceVersionToSource_AB_unique" ON "_PieceVersionToSource"("A", "B");

-- CreateIndex
CREATE INDEX "_PieceVersionToSource_B_index" ON "_PieceVersionToSource"("B");

-- CreateIndex
CREATE UNIQUE INDEX "Movement_pieceVersionId_rank_key" ON "Movement"("pieceVersionId", "rank");

-- AddForeignKey
ALTER TABLE "PieceVersion" ADD CONSTRAINT "PieceVersion_pieceId_fkey" FOREIGN KEY ("pieceId") REFERENCES "Piece"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Movement" ADD CONSTRAINT "Movement_pieceVersionId_fkey" FOREIGN KEY ("pieceVersionId") REFERENCES "PieceVersion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_PieceVersionToSource" ADD CONSTRAINT "_PieceVersionToSource_A_fkey" FOREIGN KEY ("A") REFERENCES "PieceVersion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_PieceVersionToSource" ADD CONSTRAINT "_PieceVersionToSource_B_fkey" FOREIGN KEY ("B") REFERENCES "Source"("id") ON DELETE CASCADE ON UPDATE CASCADE;
