-- prisma-migrate-disable-next-transaction
CREATE UNIQUE INDEX CONCURRENTLY review_unique_in_review_per_reviewer
    ON "Review" ("creatorId")
    WHERE state = 'IN_REVIEW';
