/*
  Warnings:

  - You are about to drop the column `commentId` on the `MetronomeMark` table. All the data in the column will be lost.
  - You are about to drop the column `commentId` on the `Section` table. All the data in the column will be lost.
  - You are about to drop the column `commentId` on the `Source` table. All the data in the column will be lost.
  - You are about to drop the `Comment` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "Comment" DROP CONSTRAINT "Comment_creatorId_fkey";

-- DropForeignKey
ALTER TABLE "MetronomeMark" DROP CONSTRAINT "MetronomeMark_commentId_fkey";

-- DropForeignKey
ALTER TABLE "Section" DROP CONSTRAINT "Section_commentId_fkey";

-- DropForeignKey
ALTER TABLE "Source" DROP CONSTRAINT "Source_commentId_fkey";

-- DropIndex
DROP INDEX "MetronomeMark_commentId_key";

-- DropIndex
DROP INDEX "Section_commentId_key";

-- DropIndex
DROP INDEX "Source_commentId_key";

-- AlterTable
ALTER TABLE "MetronomeMark" DROP COLUMN "commentId",
ADD COLUMN     "comment" TEXT;

-- AlterTable
ALTER TABLE "Section" DROP COLUMN "commentId",
ADD COLUMN     "comment" TEXT;

-- AlterTable
ALTER TABLE "Source" DROP COLUMN "commentId",
ADD COLUMN     "comment" TEXT;

-- DropTable
DROP TABLE "Comment";
