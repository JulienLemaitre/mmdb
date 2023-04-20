/*
  Warnings:

  - A unique constraint covering the columns `[personId,role]` on the table `Contribution` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[organizationId,role]` on the table `Contribution` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Contribution_personId_role_key" ON "Contribution"("personId", "role");

-- CreateIndex
CREATE UNIQUE INDEX "Contribution_organizationId_role_key" ON "Contribution"("organizationId", "role");
