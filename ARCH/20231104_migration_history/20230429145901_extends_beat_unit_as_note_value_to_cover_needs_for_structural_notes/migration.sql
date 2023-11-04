/*
  Warnings:

  - The `fastestOrnamentalNote` column on the `Section` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `fastestStaccatoNote` column on the `Section` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `fastestStructuralNote` column on the `Section` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - Changed the type of `beatUnit` on the `MetronomeMark` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- CreateEnum
CREATE TYPE "NOTE_VALUE" AS ENUM ('WHOLE', 'HALF', 'DOTTED_HALF', 'QUARTER', 'DOTTED_QUARTER', 'EIGHTH', 'DOTTED_EIGHTH', 'SIXTEENTH', 'DOTTED_SIXTEENTH', 'THIRTYSECOND', 'DOTTED_THIRTYSECOND', 'SIXTYFOURTH', 'DOTTED_SIXTYFOURTH', 'HUNDREDTWENTYEIGHTH', 'DOTTED_HUNDREDTWENTYEIGHTH', 'TRIPLET_EIGHTH', 'TRIPLET_SIXTEENTH', 'QUADRUPLET_EIGHTH', 'QUINTUPLET_SIXTEENTH', 'QUINTUPLET_THIRTYSECOND', 'SEXTUPLET_SIXTEENTH', 'SEXTUPLET_THIRTYSECOND', 'SEPTUPLET_SIXTEENTH', 'SEPTUPLET_HUNDREDTWENTYEIGHTH');

-- AlterTable
ALTER TABLE "MetronomeMark" DROP COLUMN "beatUnit",
ADD COLUMN     "beatUnit" "NOTE_VALUE" NOT NULL;

-- AlterTable
ALTER TABLE "Section" DROP COLUMN "fastestOrnamentalNote",
ADD COLUMN     "fastestOrnamentalNote" "NOTE_VALUE",
DROP COLUMN "fastestStaccatoNote",
ADD COLUMN     "fastestStaccatoNote" "NOTE_VALUE",
DROP COLUMN "fastestStructuralNote",
ADD COLUMN     "fastestStructuralNote" "NOTE_VALUE";

-- DropEnum
DROP TYPE "BEAT_UNIT";
