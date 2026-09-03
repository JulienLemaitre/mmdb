-- prisma-migrate-disable-next-transaction
CREATE UNIQUE INDEX CONCURRENTLY review_unique_in_review_per_source
    ON "Review" ("mMSourceId")
    WHERE state = 'IN_REVIEW';