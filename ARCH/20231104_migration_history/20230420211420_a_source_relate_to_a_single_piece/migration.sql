/*
  Warnings:

  - You are about to drop the `_PieceToSource` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `pieceId` to the `Source` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "_PieceToSource" DROP CONSTRAINT "_PieceToSource_A_fkey";

-- DropForeignKey
ALTER TABLE "_PieceToSource" DROP CONSTRAINT "_PieceToSource_B_fkey";

-- AlterTable
ALTER TABLE "Source" ADD COLUMN     "pieceId" TEXT NOT NULL;

-- DropTable
DROP TABLE "_PieceToSource";

-- AddForeignKey
ALTER TABLE "Source" ADD CONSTRAINT "Source_pieceId_fkey" FOREIGN KEY ("pieceId") REFERENCES "Piece"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
