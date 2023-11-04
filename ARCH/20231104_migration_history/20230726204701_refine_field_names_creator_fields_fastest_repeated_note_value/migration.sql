/*
  Warnings:

  - You are about to drop the column `userId` on the `Comment` table. All the data in the column will be lost.
  - You are about to drop the column `fullName` on the `Person` table. All the data in the column will be lost.
  - You are about to drop the column `isComposerMM` on the `Source` table. All the data in the column will be lost.
  - You are about to drop the column `baseTerm` on the `TempoIndication` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[firstName,lastName]` on the table `Person` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[text]` on the table `TempoIndication` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `creatorId` to the `Comment` table without a default value. This is not possible if the table is not empty.
  - Made the column `firstName` on table `Person` required. This step will fail if there are existing NULL values in that column.
  - Made the column `lastName` on table `Person` required. This step will fail if there are existing NULL values in that column.
  - Made the column `birthYear` on table `Person` required. This step will fail if there are existing NULL values in that column.
  - Added the required column `creatorId` to the `Piece` table without a default value. This is not possible if the table is not empty.
  - Added the required column `creatorId` to the `Source` table without a default value. This is not possible if the table is not empty.
  - Added the required column `text` to the `TempoIndication` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Comment" DROP CONSTRAINT "Comment_userId_fkey";

-- DropIndex
DROP INDEX "Person_fullName_key";

-- DropIndex
DROP INDEX "TempoIndication_baseTerm_key";

-- AlterTable
ALTER TABLE "Comment" DROP COLUMN "userId",
ADD COLUMN     "creatorId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Person" DROP COLUMN "fullName",
ALTER COLUMN "firstName" SET NOT NULL,
ALTER COLUMN "lastName" SET NOT NULL,
ALTER COLUMN "birthYear" SET NOT NULL;

-- AlterTable
ALTER TABLE "Piece" ADD COLUMN     "creatorId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Section" ADD COLUMN     "fastestRepeatedNoteValue" "NOTE_VALUE";

-- AlterTable
ALTER TABLE "Source" DROP COLUMN "isComposerMM",
ADD COLUMN     "creatorId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "TempoIndication" DROP COLUMN "baseTerm",
ADD COLUMN     "text" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Person_firstName_lastName_key" ON "Person"("firstName", "lastName");

-- CreateIndex
CREATE UNIQUE INDEX "TempoIndication_text_key" ON "TempoIndication"("text");

-- AddForeignKey
ALTER TABLE "Piece" ADD CONSTRAINT "Piece_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Source" ADD CONSTRAINT "Source_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Comment" ADD CONSTRAINT "Comment_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
