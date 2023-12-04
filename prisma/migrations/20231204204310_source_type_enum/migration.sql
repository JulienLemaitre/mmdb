/*
  Warnings:

  - The values [ORIGINAL_SCORE] on the enum `SOURCE_TYPE` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "SOURCE_TYPE_new" AS ENUM ('ARTICLE', 'BOOK', 'DIARY', 'MANUSCRIPT', 'LETTER', 'EDITION', 'OTHER');
ALTER TABLE "Source" ALTER COLUMN "type" TYPE "SOURCE_TYPE_new" USING ("type"::text::"SOURCE_TYPE_new");
ALTER TYPE "SOURCE_TYPE" RENAME TO "SOURCE_TYPE_old";
ALTER TYPE "SOURCE_TYPE_new" RENAME TO "SOURCE_TYPE";
DROP TYPE "SOURCE_TYPE_old";
COMMIT;
