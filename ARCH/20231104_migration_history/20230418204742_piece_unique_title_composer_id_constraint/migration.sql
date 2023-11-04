/*
  Warnings:

  - A unique constraint covering the columns `[composerId,title]` on the table `Piece` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Piece_composerId_title_key" ON "Piece"("composerId", "title");
