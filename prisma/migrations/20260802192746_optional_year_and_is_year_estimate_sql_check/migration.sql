-- AlterTable
ALTER TABLE "MMSource" ALTER COLUMN "year" DROP NOT NULL;

ALTER TABLE "MMSource"
    ADD CONSTRAINT "MMSource_year_estimated_requires_year"
        CHECK ("year" IS NOT NULL OR "isYearEstimated" = false);