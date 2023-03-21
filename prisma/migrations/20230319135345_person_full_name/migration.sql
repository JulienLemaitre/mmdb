/*
  Warnings:

  - A unique constraint covering the columns `[fullName]` on the table `Person` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `fullName` to the `Person` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Person" ADD COLUMN     "fullName" TEXT NOT NULL,
ALTER COLUMN "firstName" DROP NOT NULL,
ALTER COLUMN "lastName" DROP NOT NULL,
ALTER COLUMN "birthYear" DROP NOT NULL;

-- AlterTable
ALTER TABLE "Piece" ADD COLUMN     "nickName" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Person_fullName_key" ON "Person"("fullName");
