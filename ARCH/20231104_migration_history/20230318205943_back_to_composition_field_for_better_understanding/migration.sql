/*
  Warnings:

  - You are about to drop the column `personId` on the `Piece` table. All the data in the column will be lost.
  - Added the required column `composerId` to the `Piece` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Piece" DROP CONSTRAINT "Piece_personId_fkey";

-- AlterTable
ALTER TABLE "Piece" DROP COLUMN "personId",
ADD COLUMN     "composerId" TEXT NOT NULL;

-- AddForeignKey
ALTER TABLE "Piece" ADD CONSTRAINT "Piece_composerId_fkey" FOREIGN KEY ("composerId") REFERENCES "Person"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
