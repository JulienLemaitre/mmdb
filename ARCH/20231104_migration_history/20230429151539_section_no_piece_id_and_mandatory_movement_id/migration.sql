/*
  Warnings:

  - You are about to drop the column `pieceId` on the `Section` table. All the data in the column will be lost.
  - Made the column `movementId` on table `Section` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "Section" DROP CONSTRAINT "Section_movementId_fkey";

-- AlterTable
ALTER TABLE "Section" DROP COLUMN "pieceId",
ALTER COLUMN "movementId" SET NOT NULL;

-- AddForeignKey
ALTER TABLE "Section" ADD CONSTRAINT "Section_movementId_fkey" FOREIGN KEY ("movementId") REFERENCES "Movement"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
