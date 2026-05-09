/*
  Warnings:

  - A unique constraint covering the columns `[composerId,title,collectionId]` on the table `Piece` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[composerId,title]` on the table `Piece` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[type,reference]` on the table `Reference` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "Piece_composerId_title_collectionId_key";

-- DropIndex
DROP INDEX "Reference_type_reference_isbn_ismn_key";

-- CreateIndex
CREATE UNIQUE INDEX "Piece_composerId_title_collectionId_key" ON "Piece"("composerId", "title", "collectionId") WHERE ("collectionId" IS NOT NULL);

-- CreateIndex
CREATE UNIQUE INDEX "Piece_composerId_title_key" ON "Piece"("composerId", "title") WHERE ("collectionId" IS NULL);

-- CreateIndex
CREATE UNIQUE INDEX "Reference_type_reference_key" ON "Reference"("type", "reference") WHERE (type IN ('ISBN', 'ISMN'));
