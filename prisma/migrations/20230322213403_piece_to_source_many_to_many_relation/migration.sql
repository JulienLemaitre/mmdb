/*
  Warnings:

  - You are about to drop the column `pieceId` on the `Source` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[plate_number]` on the table `Source` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `metreSymbol` to the `Section` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Source" DROP CONSTRAINT "Source_pieceId_fkey";

-- AlterTable
ALTER TABLE "Section" ADD COLUMN     "metreSymbol" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Source" DROP COLUMN "pieceId",
ALTER COLUMN "title" DROP NOT NULL,
ALTER COLUMN "isComposerMM" SET DEFAULT false;

-- CreateTable
CREATE TABLE "_PieceToSource" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "_PieceToSource_AB_unique" ON "_PieceToSource"("A", "B");

-- CreateIndex
CREATE INDEX "_PieceToSource_B_index" ON "_PieceToSource"("B");

-- CreateIndex
CREATE UNIQUE INDEX "Source_plate_number_key" ON "Source"("plate_number");

-- AddForeignKey
ALTER TABLE "_PieceToSource" ADD CONSTRAINT "_PieceToSource_A_fkey" FOREIGN KEY ("A") REFERENCES "Piece"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_PieceToSource" ADD CONSTRAINT "_PieceToSource_B_fkey" FOREIGN KEY ("B") REFERENCES "Source"("id") ON DELETE CASCADE ON UPDATE CASCADE;
