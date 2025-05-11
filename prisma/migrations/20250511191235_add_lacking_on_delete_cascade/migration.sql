-- DropForeignKey
ALTER TABLE "Contribution" DROP CONSTRAINT "Contribution_mMSourceId_fkey";

-- DropForeignKey
ALTER TABLE "Contribution" DROP CONSTRAINT "Contribution_organizationId_fkey";

-- DropForeignKey
ALTER TABLE "Contribution" DROP CONSTRAINT "Contribution_personId_fkey";

-- DropForeignKey
ALTER TABLE "MMSourcesOnPieceVersions" DROP CONSTRAINT "MMSourcesOnPieceVersions_mMSourceId_fkey";

-- DropForeignKey
ALTER TABLE "MMSourcesOnPieceVersions" DROP CONSTRAINT "MMSourcesOnPieceVersions_pieceVersionId_fkey";

-- DropForeignKey
ALTER TABLE "MetronomeMark" DROP CONSTRAINT "MetronomeMark_mMSourceId_fkey";

-- DropForeignKey
ALTER TABLE "MetronomeMark" DROP CONSTRAINT "MetronomeMark_sectionId_fkey";

-- DropForeignKey
ALTER TABLE "Movement" DROP CONSTRAINT "Movement_pieceVersionId_fkey";

-- DropForeignKey
ALTER TABLE "PieceVersion" DROP CONSTRAINT "PieceVersion_pieceId_fkey";

-- DropForeignKey
ALTER TABLE "Reference" DROP CONSTRAINT "Reference_mMSourceId_fkey";

-- DropForeignKey
ALTER TABLE "Section" DROP CONSTRAINT "Section_movementId_fkey";

-- AddForeignKey
ALTER TABLE "PieceVersion" ADD CONSTRAINT "PieceVersion_pieceId_fkey" FOREIGN KEY ("pieceId") REFERENCES "Piece"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Movement" ADD CONSTRAINT "Movement_pieceVersionId_fkey" FOREIGN KEY ("pieceVersionId") REFERENCES "PieceVersion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Section" ADD CONSTRAINT "Section_movementId_fkey" FOREIGN KEY ("movementId") REFERENCES "Movement"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MetronomeMark" ADD CONSTRAINT "MetronomeMark_mMSourceId_fkey" FOREIGN KEY ("mMSourceId") REFERENCES "MMSource"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MetronomeMark" ADD CONSTRAINT "MetronomeMark_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "Section"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MMSourcesOnPieceVersions" ADD CONSTRAINT "MMSourcesOnPieceVersions_pieceVersionId_fkey" FOREIGN KEY ("pieceVersionId") REFERENCES "PieceVersion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MMSourcesOnPieceVersions" ADD CONSTRAINT "MMSourcesOnPieceVersions_mMSourceId_fkey" FOREIGN KEY ("mMSourceId") REFERENCES "MMSource"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reference" ADD CONSTRAINT "Reference_mMSourceId_fkey" FOREIGN KEY ("mMSourceId") REFERENCES "MMSource"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Contribution" ADD CONSTRAINT "Contribution_mMSourceId_fkey" FOREIGN KEY ("mMSourceId") REFERENCES "MMSource"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Contribution" ADD CONSTRAINT "Contribution_personId_fkey" FOREIGN KEY ("personId") REFERENCES "Person"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Contribution" ADD CONSTRAINT "Contribution_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
