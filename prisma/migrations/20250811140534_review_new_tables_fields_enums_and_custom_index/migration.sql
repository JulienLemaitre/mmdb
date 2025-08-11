-- CreateEnum
CREATE TYPE "REVIEW_STATE" AS ENUM ('PENDING', 'IN_REVIEW', 'APPROVED', 'ABORTED');

-- CreateEnum
CREATE TYPE "REVIEWED_ENTITY_TYPE" AS ENUM ('PERSON', 'ORGANIZATION', 'COLLECTION', 'PIECE');

-- CreateEnum
CREATE TYPE "AUDIT_ENTITY_TYPE" AS ENUM ('PERSON', 'ORGANIZATION', 'COLLECTION', 'PIECE', 'PIECE_VERSION', 'MOVEMENT', 'SECTION', 'TEMPO_INDICATION', 'METRONOME_MARK', 'MM_SOURCE', 'REFERENCE', 'CONTRIBUTION');

-- CreateEnum
CREATE TYPE "OPERATION" AS ENUM ('CREATE', 'UPDATE', 'DELETE');

-- AlterTable
ALTER TABLE "MMSource" ADD COLUMN     "reviewState" "REVIEW_STATE" NOT NULL DEFAULT 'PENDING';

-- CreateTable
CREATE TABLE "Review" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "mMSourceId" UUID NOT NULL,
    "creatorId" UUID NOT NULL,
    "state" "REVIEW_STATE" NOT NULL DEFAULT 'PENDING',
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endedAt" TIMESTAMP(3),
    "overallComment" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Review_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReviewedEntity" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "entityType" "REVIEWED_ENTITY_TYPE" NOT NULL,
    "entityId" UUID NOT NULL,
    "reviewedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reviewedById" UUID NOT NULL,
    "reviewId" UUID NOT NULL,

    CONSTRAINT "ReviewedEntity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "reviewId" UUID NOT NULL,
    "entityType" "AUDIT_ENTITY_TYPE" NOT NULL,
    "entityId" UUID NOT NULL,
    "operation" "OPERATION" NOT NULL,
    "before" JSONB,
    "after" JSONB,
    "authorId" UUID NOT NULL,
    "comment" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Review_mMSourceId_idx" ON "Review"("mMSourceId");

-- CreateIndex
CREATE INDEX "ReviewedEntity_reviewId_idx" ON "ReviewedEntity"("reviewId");

-- CreateIndex
CREATE INDEX "ReviewedEntity_reviewedById_idx" ON "ReviewedEntity"("reviewedById");

-- CreateIndex
CREATE UNIQUE INDEX "ReviewedEntity_entityType_entityId_key" ON "ReviewedEntity"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "AuditLog_entityType_entityId_idx" ON "AuditLog"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "AuditLog_reviewId_idx" ON "AuditLog"("reviewId");

-- AddForeignKey
ALTER TABLE "Review" ADD CONSTRAINT "Review_mMSourceId_fkey" FOREIGN KEY ("mMSourceId") REFERENCES "MMSource"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Review" ADD CONSTRAINT "Review_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReviewedEntity" ADD CONSTRAINT "ReviewedEntity_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReviewedEntity" ADD CONSTRAINT "ReviewedEntity_reviewId_fkey" FOREIGN KEY ("reviewId") REFERENCES "Review"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_reviewId_fkey" FOREIGN KEY ("reviewId") REFERENCES "Review"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- A partial unique index to guarantee at most one IN_REVIEW row per MM Source will be applied outside of the migration because using CONCURRENTLY it cannot be executed inside a transaction.
