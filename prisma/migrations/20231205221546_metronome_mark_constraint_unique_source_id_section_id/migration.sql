/*
  Warnings:

  - A unique constraint covering the columns `[sourceId,sectionId]` on the table `MetronomeMark` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "MetronomeMark_sourceId_sectionId_key" ON "MetronomeMark"("sourceId", "sectionId");
