/*
  Warnings:

  - You are about to drop the column `nickName` on the `Piece` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Piece" DROP COLUMN "nickName",
ADD COLUMN     "nickname" TEXT;
