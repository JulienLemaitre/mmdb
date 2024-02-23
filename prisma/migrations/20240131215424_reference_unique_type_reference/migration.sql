/*
  Warnings:

  - A unique constraint covering the columns `[type,reference]` on the table `Reference` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "Reference_sourceId_reference_key";

-- CreateIndex
CREATE UNIQUE INDEX "Reference_type_reference_key" ON "Reference"("type", "reference");
