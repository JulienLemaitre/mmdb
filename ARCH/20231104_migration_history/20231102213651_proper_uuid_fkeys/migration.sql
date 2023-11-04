/*
  Warnings:

  - The `creatorId` column on the `Comment` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `personId` column on the `Contribution` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `organizationId` column on the `Contribution` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `commentId` column on the `MetronomeMark` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `creatorId` column on the `Person` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `creatorId` column on the `Piece` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `tempoIndicationId` column on the `Section` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `commentId` column on the `Section` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `commentId` column on the `Source` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `creatorId` column on the `Source` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - Changed the type of `userId` on the `Account` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `sourceId` on the `Contribution` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `sourceId` on the `MetronomeMark` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `sectionId` on the `MetronomeMark` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `pieceVersionId` on the `Movement` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `composerId` on the `Piece` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `pieceId` on the `PieceVersion` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `movementId` on the `Section` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `userId` on the `Session` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- AlterTable
ALTER TABLE "Account" DROP COLUMN "userId",
ADD COLUMN     "userId" UUID NOT NULL;

-- AlterTable
ALTER TABLE "Comment" DROP COLUMN "creatorId",
ADD COLUMN     "creatorId" UUID;

-- AlterTable
ALTER TABLE "Contribution" DROP COLUMN "sourceId",
ADD COLUMN     "sourceId" UUID NOT NULL,
DROP COLUMN "personId",
ADD COLUMN     "personId" UUID,
DROP COLUMN "organizationId",
ADD COLUMN     "organizationId" UUID;

-- AlterTable
ALTER TABLE "MetronomeMark" DROP COLUMN "sourceId",
ADD COLUMN     "sourceId" UUID NOT NULL,
DROP COLUMN "sectionId",
ADD COLUMN     "sectionId" UUID NOT NULL,
DROP COLUMN "commentId",
ADD COLUMN     "commentId" UUID;

-- AlterTable
ALTER TABLE "Movement" DROP COLUMN "pieceVersionId",
ADD COLUMN     "pieceVersionId" UUID NOT NULL;

-- AlterTable
ALTER TABLE "Person" DROP COLUMN "creatorId",
ADD COLUMN     "creatorId" UUID;

-- AlterTable
ALTER TABLE "Piece" DROP COLUMN "composerId",
ADD COLUMN     "composerId" UUID NOT NULL,
DROP COLUMN "creatorId",
ADD COLUMN     "creatorId" UUID;

-- AlterTable
ALTER TABLE "PieceVersion" DROP COLUMN "pieceId",
ADD COLUMN     "pieceId" UUID NOT NULL;

-- AlterTable
ALTER TABLE "Section" DROP COLUMN "movementId",
ADD COLUMN     "movementId" UUID NOT NULL,
DROP COLUMN "tempoIndicationId",
ADD COLUMN     "tempoIndicationId" UUID,
DROP COLUMN "commentId",
ADD COLUMN     "commentId" UUID;

-- AlterTable
ALTER TABLE "Session" DROP COLUMN "userId",
ADD COLUMN     "userId" UUID NOT NULL;

-- AlterTable
ALTER TABLE "Source" DROP COLUMN "commentId",
ADD COLUMN     "commentId" UUID,
DROP COLUMN "creatorId",
ADD COLUMN     "creatorId" UUID;

-- CreateIndex
CREATE UNIQUE INDEX "MetronomeMark_commentId_key" ON "MetronomeMark"("commentId");

-- CreateIndex
CREATE UNIQUE INDEX "Movement_pieceVersionId_rank_key" ON "Movement"("pieceVersionId", "rank");

-- CreateIndex
CREATE UNIQUE INDEX "Piece_composerId_title_key" ON "Piece"("composerId", "title");

-- CreateIndex
CREATE UNIQUE INDEX "Section_commentId_key" ON "Section"("commentId");

-- CreateIndex
CREATE UNIQUE INDEX "Section_movementId_rank_key" ON "Section"("movementId", "rank");

-- CreateIndex
CREATE UNIQUE INDEX "Source_commentId_key" ON "Source"("commentId");

-- AddForeignKey
ALTER TABLE "Piece" ADD CONSTRAINT "Piece_composerId_fkey" FOREIGN KEY ("composerId") REFERENCES "Person"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Piece" ADD CONSTRAINT "Piece_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PieceVersion" ADD CONSTRAINT "PieceVersion_pieceId_fkey" FOREIGN KEY ("pieceId") REFERENCES "Piece"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Movement" ADD CONSTRAINT "Movement_pieceVersionId_fkey" FOREIGN KEY ("pieceVersionId") REFERENCES "PieceVersion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Section" ADD CONSTRAINT "Section_movementId_fkey" FOREIGN KEY ("movementId") REFERENCES "Movement"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Section" ADD CONSTRAINT "Section_tempoIndicationId_fkey" FOREIGN KEY ("tempoIndicationId") REFERENCES "TempoIndication"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Section" ADD CONSTRAINT "Section_commentId_fkey" FOREIGN KEY ("commentId") REFERENCES "Comment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MetronomeMark" ADD CONSTRAINT "MetronomeMark_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "Source"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MetronomeMark" ADD CONSTRAINT "MetronomeMark_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "Section"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MetronomeMark" ADD CONSTRAINT "MetronomeMark_commentId_fkey" FOREIGN KEY ("commentId") REFERENCES "Comment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Source" ADD CONSTRAINT "Source_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Source" ADD CONSTRAINT "Source_commentId_fkey" FOREIGN KEY ("commentId") REFERENCES "Comment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Contribution" ADD CONSTRAINT "Contribution_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "Source"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Contribution" ADD CONSTRAINT "Contribution_personId_fkey" FOREIGN KEY ("personId") REFERENCES "Person"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Contribution" ADD CONSTRAINT "Contribution_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Person" ADD CONSTRAINT "Person_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Comment" ADD CONSTRAINT "Comment_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Account" ADD CONSTRAINT "Account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
