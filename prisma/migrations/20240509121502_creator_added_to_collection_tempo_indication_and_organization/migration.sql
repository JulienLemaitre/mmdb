-- AlterTable
ALTER TABLE "Collection" ADD COLUMN     "creatorId" UUID;

-- AlterTable
ALTER TABLE "Organization" ADD COLUMN     "creatorId" UUID;

-- AlterTable
ALTER TABLE "TempoIndication" ADD COLUMN     "creatorId" UUID;

-- AddForeignKey
ALTER TABLE "Collection" ADD CONSTRAINT "Collection_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TempoIndication" ADD CONSTRAINT "TempoIndication_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Organization" ADD CONSTRAINT "Organization_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
