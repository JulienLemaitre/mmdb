-- CreateExtension
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- CreateEnum
CREATE TYPE "PIECE_CATEGORY" AS ENUM ('KEYBOARD', 'CHAMBER_INSTRUMENTAL', 'ORCHESTRAL', 'VOCAL', 'OTHER');

-- CreateEnum
CREATE TYPE "NOTE_VALUE" AS ENUM ('WHOLE', 'HALF', 'DOTTED_HALF', 'QUARTER', 'DOTTED_QUARTER', 'EIGHTH', 'DOTTED_EIGHTH', 'SIXTEENTH', 'DOTTED_SIXTEENTH', 'THIRTYSECOND', 'DOTTED_THIRTYSECOND', 'SIXTYFOURTH', 'DOTTED_SIXTYFOURTH', 'HUNDREDTWENTYEIGHTH', 'DOTTED_HUNDREDTWENTYEIGHTH', 'TRIPLET_EIGHTH', 'TRIPLET_SIXTEENTH', 'QUADRUPLET_EIGHTH', 'QUINTUPLET_SIXTEENTH', 'QUINTUPLET_THIRTYSECOND', 'SEXTUPLET_SIXTEENTH', 'SEXTUPLET_THIRTYSECOND', 'SEPTUPLET_SIXTEENTH', 'SEPTUPLET_HUNDREDTWENTYEIGHTH');

-- CreateEnum
CREATE TYPE "KEY" AS ENUM ('A_FLAT_MAJOR', 'A_FLAT_MINOR', 'A_MAJOR', 'A_MINOR', 'A_SHARP_MAJOR', 'A_SHARP_MINOR', 'B_FLAT_MAJOR', 'B_FLAT_MINOR', 'B_MAJOR', 'B_MINOR', 'C_FLAT_MAJOR', 'C_FLAT_MINOR', 'C_MAJOR', 'C_MINOR', 'C_SHARP_MAJOR', 'C_SHARP_MINOR', 'D_FLAT_MAJOR', 'D_FLAT_MINOR', 'D_MAJOR', 'D_MINOR', 'D_SHARP_MAJOR', 'D_SHARP_MINOR', 'E_FLAT_MAJOR', 'E_FLAT_MINOR', 'E_MAJOR', 'E_MINOR', 'F_FLAT_MAJOR', 'F_FLAT_MINOR', 'F_MAJOR', 'F_MINOR', 'F_SHARP_MAJOR', 'F_SHARP_MINOR', 'G_FLAT_MAJOR', 'G_FLAT_MINOR', 'G_MAJOR', 'G_MINOR', 'G_SHARP_MAJOR', 'G_SHARP_MINOR');

-- CreateEnum
CREATE TYPE "SOURCE_TYPE" AS ENUM ('ORIGINAL_SCORE', 'LETTER', 'EDITION');

-- CreateEnum
CREATE TYPE "CONTRIBUTION_ROLE" AS ENUM ('COMPOSER', 'EDITOR', 'TRANSLATOR', 'TRANSCRIBER', 'ARRANGER', 'PUBLISHER', 'OTHER');

-- CreateTable
CREATE TABLE "Piece" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "title" TEXT NOT NULL,
    "nickname" TEXT,
    "composerId" UUID NOT NULL,
    "yearOfComposition" INTEGER,
    "creatorId" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Piece_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PieceVersion" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "pieceId" UUID NOT NULL,
    "category" "PIECE_CATEGORY" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PieceVersion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Movement" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "pieceVersionId" UUID NOT NULL,
    "rank" INTEGER NOT NULL,
    "key" "KEY" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Movement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Section" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "movementId" UUID NOT NULL,
    "rank" INTEGER NOT NULL,
    "metreNumerator" INTEGER NOT NULL,
    "metreDenominator" INTEGER NOT NULL,
    "isCommonTime" BOOLEAN NOT NULL DEFAULT false,
    "isCutTime" BOOLEAN NOT NULL DEFAULT false,
    "fastestStructuralNotesPerBar" DOUBLE PRECISION NOT NULL,
    "fastestStaccatoNotesPerBar" DOUBLE PRECISION,
    "fastestRepeatedNotesPerBar" DOUBLE PRECISION,
    "fastestOrnamentalNotesPerBar" DOUBLE PRECISION,
    "isFastestStructuralNoteBelCanto" BOOLEAN NOT NULL DEFAULT false,
    "tempoIndicationId" UUID,
    "commentId" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Section_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TempoIndication" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "text" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TempoIndication_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MetronomeMark" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "sourceId" UUID NOT NULL,
    "beatUnit" "NOTE_VALUE" NOT NULL,
    "bpm" INTEGER NOT NULL,
    "notesPerSecond" JSONB,
    "notesPerBar" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "sectionId" UUID NOT NULL,
    "commentId" UUID,

    CONSTRAINT "MetronomeMark_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Source" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "title" TEXT,
    "type" "SOURCE_TYPE" NOT NULL,
    "link" TEXT,
    "year" INTEGER NOT NULL,
    "references" JSONB,
    "creatorId" UUID,
    "commentId" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Source_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Contribution" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "sourceId" UUID NOT NULL,
    "personId" UUID,
    "organizationId" UUID,
    "role" "CONTRIBUTION_ROLE" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Contribution_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Organization" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Organization_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Person" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "birthYear" INTEGER NOT NULL,
    "deathYear" INTEGER,
    "creatorId" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Person_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Comment" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "text" TEXT NOT NULL,
    "creatorId" UUID,

    CONSTRAINT "Comment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Account" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "userId" UUID NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,

    CONSTRAINT "Account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Session" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "sessionToken" TEXT NOT NULL,
    "userId" UUID NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" TEXT,
    "email" TEXT,
    "emailVerified" TIMESTAMP(3),
    "image" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VerificationToken" (
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL
);

-- CreateTable
CREATE TABLE "_PieceVersionToSource" (
    "A" UUID NOT NULL,
    "B" UUID NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "Piece_composerId_title_key" ON "Piece"("composerId", "title");

-- CreateIndex
CREATE UNIQUE INDEX "Movement_pieceVersionId_rank_key" ON "Movement"("pieceVersionId", "rank");

-- CreateIndex
CREATE UNIQUE INDEX "Section_commentId_key" ON "Section"("commentId");

-- CreateIndex
CREATE UNIQUE INDEX "Section_movementId_rank_key" ON "Section"("movementId", "rank");

-- CreateIndex
CREATE UNIQUE INDEX "TempoIndication_text_key" ON "TempoIndication"("text");

-- CreateIndex
CREATE UNIQUE INDEX "MetronomeMark_commentId_key" ON "MetronomeMark"("commentId");

-- CreateIndex
CREATE UNIQUE INDEX "Source_commentId_key" ON "Source"("commentId");

-- CreateIndex
CREATE UNIQUE INDEX "Organization_name_key" ON "Organization"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Person_firstName_lastName_key" ON "Person"("firstName", "lastName");

-- CreateIndex
CREATE UNIQUE INDEX "Account_provider_providerAccountId_key" ON "Account"("provider", "providerAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "Session_sessionToken_key" ON "Session"("sessionToken");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_token_key" ON "VerificationToken"("token");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_identifier_token_key" ON "VerificationToken"("identifier", "token");

-- CreateIndex
CREATE UNIQUE INDEX "_PieceVersionToSource_AB_unique" ON "_PieceVersionToSource"("A", "B");

-- CreateIndex
CREATE INDEX "_PieceVersionToSource_B_index" ON "_PieceVersionToSource"("B");

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

-- AddForeignKey
ALTER TABLE "_PieceVersionToSource" ADD CONSTRAINT "_PieceVersionToSource_A_fkey" FOREIGN KEY ("A") REFERENCES "PieceVersion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_PieceVersionToSource" ADD CONSTRAINT "_PieceVersionToSource_B_fkey" FOREIGN KEY ("B") REFERENCES "Source"("id") ON DELETE CASCADE ON UPDATE CASCADE;
