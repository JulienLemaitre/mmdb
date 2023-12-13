-- AlterTable
ALTER TABLE "PieceVersion" ADD COLUMN     "creatorId" UUID;

-- AddForeignKey
ALTER TABLE "PieceVersion" ADD CONSTRAINT "PieceVersion_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
