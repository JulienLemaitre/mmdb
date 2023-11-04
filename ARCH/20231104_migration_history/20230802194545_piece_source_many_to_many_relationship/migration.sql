/*
  Warnings:

  - You are about to drop the column `pieceId` on the `Source` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "Source" DROP CONSTRAINT "Source_pieceId_fkey";

-- AlterTable
ALTER TABLE "Source" DROP COLUMN "pieceId";

-- CreateTable
CREATE TABLE "_PieceToSource" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "_PieceToSource_AB_unique" ON "_PieceToSource"("A", "B");

-- CreateIndex
CREATE INDEX "_PieceToSource_B_index" ON "_PieceToSource"("B");

-- AddForeignKey
ALTER TABLE "_PieceToSource" ADD CONSTRAINT "_PieceToSource_A_fkey" FOREIGN KEY ("A") REFERENCES "Piece"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_PieceToSource" ADD CONSTRAINT "_PieceToSource_B_fkey" FOREIGN KEY ("B") REFERENCES "Source"("id") ON DELETE CASCADE ON UPDATE CASCADE;
