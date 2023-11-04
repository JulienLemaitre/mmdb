-- AlterTable
ALTER TABLE "Section" ADD COLUMN     "fastestOrnamentalNotePerBar" INTEGER,
ADD COLUMN     "fastestRepeatedNotePerBar" INTEGER,
ADD COLUMN     "fastestStaccatoNotePerBar" INTEGER,
ADD COLUMN     "fastestStructuralNotePerBar" INTEGER,
ADD COLUMN     "isCommonTime" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "isCutTime" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "isFastestStructuralNoteBelCanto" BOOLEAN NOT NULL DEFAULT false;
