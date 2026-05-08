/*
  Warnings:

  - A unique constraint covering the columns `[composerId,title,collectionId]` on the table `Piece` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "Piece_composerId_title_key";

-- CreateIndex
CREATE UNIQUE INDEX "Piece_composerId_title_collectionId_key" ON "Piece"("composerId", "title", "collectionId");
