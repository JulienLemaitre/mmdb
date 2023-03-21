/*
  Warnings:

  - You are about to drop the column `composerId` on the `Piece` table. All the data in the column will be lost.
  - Added the required column `personId` to the `Piece` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Piece" DROP CONSTRAINT "Piece_composerId_fkey";

-- AlterTable
ALTER TABLE "Piece" DROP COLUMN "composerId",
ADD COLUMN     "personId" TEXT NOT NULL;

-- AddForeignKey
ALTER TABLE "Piece" ADD CONSTRAINT "Piece_personId_fkey" FOREIGN KEY ("personId") REFERENCES "Person"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
