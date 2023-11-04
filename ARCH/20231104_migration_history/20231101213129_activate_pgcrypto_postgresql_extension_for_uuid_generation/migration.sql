/*
  Warnings:

  - The primary key for the `Account` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The `id` column on the `Account` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The primary key for the `Comment` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The `id` column on the `Comment` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The primary key for the `Contribution` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The `id` column on the `Contribution` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The primary key for the `MetronomeMark` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The `id` column on the `MetronomeMark` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The primary key for the `Movement` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The `id` column on the `Movement` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The primary key for the `Organization` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The `id` column on the `Organization` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The primary key for the `Person` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The `id` column on the `Person` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The primary key for the `Piece` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The `id` column on the `Piece` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The primary key for the `PieceVersion` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The `id` column on the `PieceVersion` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The primary key for the `Section` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The `id` column on the `Section` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The primary key for the `Session` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The `id` column on the `Session` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The primary key for the `Source` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The `id` column on the `Source` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The primary key for the `TempoIndication` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The `id` column on the `TempoIndication` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The primary key for the `User` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The `id` column on the `User` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - Changed the type of `A` on the `_PieceVersionToSource` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `B` on the `_PieceVersionToSource` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- CreateExtension
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- DropForeignKey
ALTER TABLE "_PieceVersionToSource" DROP CONSTRAINT "_PieceVersionToSource_A_fkey";

-- DropForeignKey
ALTER TABLE "_PieceVersionToSource" DROP CONSTRAINT "_PieceVersionToSource_B_fkey";

-- AlterTable
ALTER TABLE "Account" DROP CONSTRAINT "Account_pkey",
DROP COLUMN "id",
ADD COLUMN     "id" UUID NOT NULL DEFAULT gen_random_uuid(),
ADD CONSTRAINT "Account_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "Comment" DROP CONSTRAINT "Comment_pkey" CASCADE,
DROP COLUMN "id",
ADD COLUMN     "id" UUID NOT NULL DEFAULT gen_random_uuid(),
ADD CONSTRAINT "Comment_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "Contribution" DROP CONSTRAINT "Contribution_pkey",
DROP COLUMN "id",
ADD COLUMN     "id" UUID NOT NULL DEFAULT gen_random_uuid(),
ADD CONSTRAINT "Contribution_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "MetronomeMark" DROP CONSTRAINT "MetronomeMark_pkey",
DROP COLUMN "id",
ADD COLUMN     "id" UUID NOT NULL DEFAULT gen_random_uuid(),
ADD CONSTRAINT "MetronomeMark_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "Movement" DROP CONSTRAINT "Movement_pkey" CASCADE,
DROP COLUMN "id",
ADD COLUMN     "id" UUID NOT NULL DEFAULT gen_random_uuid(),
ADD CONSTRAINT "Movement_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "Organization" DROP CONSTRAINT "Organization_pkey" CASCADE,
DROP COLUMN "id",
ADD COLUMN     "id" UUID NOT NULL DEFAULT gen_random_uuid(),
ADD CONSTRAINT "Organization_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "Person" DROP CONSTRAINT "Person_pkey" CASCADE,
DROP COLUMN "id",
ADD COLUMN     "id" UUID NOT NULL DEFAULT gen_random_uuid(),
ADD CONSTRAINT "Person_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "Piece" DROP CONSTRAINT "Piece_pkey" CASCADE,
DROP COLUMN "id",
ADD COLUMN     "id" UUID NOT NULL DEFAULT gen_random_uuid(),
ADD CONSTRAINT "Piece_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "PieceVersion" DROP CONSTRAINT "PieceVersion_pkey" CASCADE,
DROP COLUMN "id",
ADD COLUMN     "id" UUID NOT NULL DEFAULT gen_random_uuid(),
ADD CONSTRAINT "PieceVersion_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "Section" DROP CONSTRAINT "Section_pkey" CASCADE,
DROP COLUMN "id",
ADD COLUMN     "id" UUID NOT NULL DEFAULT gen_random_uuid(),
ADD CONSTRAINT "Section_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "Session" DROP CONSTRAINT "Session_pkey",
DROP COLUMN "id",
ADD COLUMN     "id" UUID NOT NULL DEFAULT gen_random_uuid(),
ADD CONSTRAINT "Session_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "Source" DROP CONSTRAINT "Source_pkey" CASCADE,
DROP COLUMN "id",
ADD COLUMN     "id" UUID NOT NULL DEFAULT gen_random_uuid(),
ADD CONSTRAINT "Source_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "TempoIndication" DROP CONSTRAINT "TempoIndication_pkey" CASCADE,
DROP COLUMN "id",
ADD COLUMN     "id" UUID NOT NULL DEFAULT gen_random_uuid(),
ADD CONSTRAINT "TempoIndication_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "User" DROP CONSTRAINT "User_pkey" CASCADE,
DROP COLUMN "id",
ADD COLUMN     "id" UUID NOT NULL DEFAULT gen_random_uuid(),
ADD CONSTRAINT "User_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "_PieceVersionToSource" DROP COLUMN "A",
ADD COLUMN     "A" UUID NOT NULL,
DROP COLUMN "B",
ADD COLUMN     "B" UUID NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "_PieceVersionToSource_AB_unique" ON "_PieceVersionToSource"("A", "B");

-- CreateIndex
CREATE INDEX "_PieceVersionToSource_B_index" ON "_PieceVersionToSource"("B");

-- AddForeignKey
ALTER TABLE "_PieceVersionToSource" ADD CONSTRAINT "_PieceVersionToSource_A_fkey" FOREIGN KEY ("A") REFERENCES "PieceVersion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_PieceVersionToSource" ADD CONSTRAINT "_PieceVersionToSource_B_fkey" FOREIGN KEY ("B") REFERENCES "Source"("id") ON DELETE CASCADE ON UPDATE CASCADE;
