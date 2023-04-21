-- DropForeignKey
ALTER TABLE "Section" DROP CONSTRAINT "Section_pieceId_fkey";

-- DropIndex
DROP INDEX "Section_pieceId_rank_key";
