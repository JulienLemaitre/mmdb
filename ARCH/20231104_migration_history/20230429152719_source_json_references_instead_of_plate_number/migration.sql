/*
  Warnings:

  - You are about to drop the column `plate_number` on the `Source` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "Source_plate_number_key";

-- AlterTable
ALTER TABLE "Source" DROP COLUMN "plate_number",
ADD COLUMN     "references" JSONB;
