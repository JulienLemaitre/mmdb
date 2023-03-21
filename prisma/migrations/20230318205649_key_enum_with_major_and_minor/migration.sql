/*
  Warnings:

  - The values [C,D,E,F,G,A,B,C_SHARP,D_SHARP,F_SHARP,G_SHARP,A_SHARP,C_FLAT,D_FLAT,E_FLAT,F_FLAT,G_FLAT,A_FLAT,B_FLAT] on the enum `KEY` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "KEY_new" AS ENUM ('A_FLAT_MAJOR', 'A_FLAT_MINOR', 'A_MAJOR', 'A_MINOR', 'A_SHARP_MAJOR', 'A_SHARP_MINOR', 'B_FLAT_MAJOR', 'B_FLAT_MINOR', 'B_MAJOR', 'B_MINOR', 'C_FLAT_MAJOR', 'C_FLAT_MINOR', 'C_MAJOR', 'C_MINOR', 'C_SHARP_MAJOR', 'C_SHARP_MINOR', 'D_FLAT_MAJOR', 'D_FLAT_MINOR', 'D_MAJOR', 'D_MINOR', 'D_SHARP_MAJOR', 'D_SHARP_MINOR', 'E_FLAT_MAJOR', 'E_FLAT_MINOR', 'E_MAJOR', 'E_MINOR', 'F_FLAT_MAJOR', 'F_FLAT_MINOR', 'F_MAJOR', 'F_MINOR', 'F_SHARP_MAJOR', 'F_SHARP_MINOR', 'G_FLAT_MAJOR', 'G_FLAT_MINOR', 'G_MAJOR', 'G_MINOR', 'G_SHARP_MAJOR', 'G_SHARP_MINOR');
ALTER TABLE "Movement" ALTER COLUMN "key" TYPE "KEY_new" USING ("key"::text::"KEY_new");
ALTER TYPE "KEY" RENAME TO "KEY_old";
ALTER TYPE "KEY_new" RENAME TO "KEY";
DROP TYPE "KEY_old";
COMMIT;
