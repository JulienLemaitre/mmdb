-- CreateEnum
CREATE TYPE "KEY" AS ENUM ('C', 'D', 'E', 'F', 'G', 'A', 'B', 'C_SHARP', 'D_SHARP', 'F_SHARP', 'G_SHARP', 'A_SHARP', 'C_FLAT', 'D_FLAT', 'E_FLAT', 'F_FLAT', 'G_FLAT', 'A_FLAT', 'B_FLAT');

-- CreateEnum
CREATE TYPE "SOURCE_TYPE" AS ENUM ('ORIGINAL_SCORE', 'LETTER', 'EDITION');

-- CreateEnum
CREATE TYPE "CONTRIBUTION_ROLE" AS ENUM ('COMPOSER', 'EDITOR', 'TRANSLATOR', 'TRANSCRIBER', 'ARRANGER', 'PUBLISHER', 'OTHER');

-- CreateEnum
CREATE TYPE "BEAT_UNIT" AS ENUM ('WHOLE', 'HALF', 'DOTTED_HALF', 'QUARTER', 'DOTTED_QUARTER', 'EIGHTH', 'DOTTED_EIGHTH', 'SIXTEENTH', 'DOTTED_SIXTEENTH', 'THIRTYSECOND', 'DOTTED_THIRTYSECOND', 'SIXTYFOURTH', 'DOTTED_SIXTYFOURTH', 'HUNDREDTWENTYEIGHTH', 'DOTTED_HUNDREDTWENTYEIGHTH');

-- CreateTable
CREATE TABLE "Piece" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "composerId" TEXT NOT NULL,
    "yearOfComposition" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Piece_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TempoIndication" (
    "id" TEXT NOT NULL,
    "baseTerm" TEXT NOT NULL,
    "additionalTerm" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TempoIndication_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Movement" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "pieceId" TEXT NOT NULL,
    "rank" INTEGER NOT NULL,
    "key" "KEY" NOT NULL,
    "metreNumerator" INTEGER NOT NULL,
    "metreDenominator" INTEGER NOT NULL,
    "tempoIndicationId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Movement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Source" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "pieceId" TEXT NOT NULL,
    "isComposerMM" BOOLEAN NOT NULL,
    "type" "SOURCE_TYPE" NOT NULL,
    "link" TEXT,
    "year" INTEGER NOT NULL,
    "date" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Source_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Contribution" (
    "id" TEXT NOT NULL,
    "sourceId" TEXT NOT NULL,
    "personId" TEXT NOT NULL,
    "role" "CONTRIBUTION_ROLE" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Contribution_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Person" (
    "id" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "birthYear" INTEGER NOT NULL,
    "deathYear" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Person_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MetronomeMark" (
    "id" TEXT NOT NULL,
    "sourceId" TEXT NOT NULL,
    "movementId" TEXT NOT NULL,
    "beatUnit" "BEAT_UNIT" NOT NULL,
    "bpm" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MetronomeMark_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "TempoIndication_baseTerm_additionalTerm_key" ON "TempoIndication"("baseTerm", "additionalTerm");

-- CreateIndex
CREATE UNIQUE INDEX "Movement_pieceId_rank_key" ON "Movement"("pieceId", "rank");

-- AddForeignKey
ALTER TABLE "Piece" ADD CONSTRAINT "Piece_composerId_fkey" FOREIGN KEY ("composerId") REFERENCES "Person"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Movement" ADD CONSTRAINT "Movement_pieceId_fkey" FOREIGN KEY ("pieceId") REFERENCES "Piece"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Movement" ADD CONSTRAINT "Movement_tempoIndicationId_fkey" FOREIGN KEY ("tempoIndicationId") REFERENCES "TempoIndication"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Source" ADD CONSTRAINT "Source_pieceId_fkey" FOREIGN KEY ("pieceId") REFERENCES "Piece"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Contribution" ADD CONSTRAINT "Contribution_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "Source"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Contribution" ADD CONSTRAINT "Contribution_personId_fkey" FOREIGN KEY ("personId") REFERENCES "Person"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MetronomeMark" ADD CONSTRAINT "MetronomeMark_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "Source"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MetronomeMark" ADD CONSTRAINT "MetronomeMark_movementId_fkey" FOREIGN KEY ("movementId") REFERENCES "Movement"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
