# Review process — Phase 1 migration steps

This migration adds:
- New enums: REVIEW_STATE, REVIEWED_ENTITY_TYPE, AUDIT_ENTITY_TYPE, OPERATION
- New models: Review, ReviewedEntity, AuditLog
- New column: MMSource.reviewState with default PENDING
- Relations: MMSource.reviews, User.reviews

Most of this is handled by `prisma migrate`. One constraint must be added manually: a partial unique index to guarantee at most one IN_REVIEW row per MM Source.

## 1) Apply schema changes

Run:
- npx prisma generate
- npx prisma migrate dev --name review_process_phase1

This creates the tables, enums, relations, and the `MMSource.reviewState` column.

## 2) Enforce “one active review per source” (partial unique index)

Prisma does not currently support partial indexes in the schema.
Prisma migrations cannot include `CREATE INDEX CONCURRENTLY` because it cannot run inside a transaction. Create the index manually after the migration:

SQL to run:

```sql
CREATE UNIQUE INDEX CONCURRENTLY review_unique_in_review_per_source 
ON "Review" ("mMSourceId") 
WHERE state = 'IN_REVIEW';
```

This partial unique index ensures that only one Review can have state = 'IN_REVIEW' for any given mMSourceId at any time. This prevents multiple reviewers from starting concurrent reviews on the same MM Source.

## 3) Verify the migration

Check that:
- All new tables exist with correct columns and types
- The partial unique index was created successfully
- MMSource.reviewState defaults to PENDING for existing records
- Foreign key constraints are properly established

You can verify the partial index with:
``` sql
\d+ "Review"
```

Or query the system catalog:
``` sql
SELECT indexname, indexdef 
FROM pg_indexes 
WHERE tablename = 'Review' 
AND indexname = 'review_unique_in_review_per_source';
```

The SQL command creates a partial unique index that only applies to rows where `state = 'IN_REVIEW'`. This allows multiple PENDING, APPROVED, or ABORTED reviews for the same MM Source, but ensures only one review can be IN_REVIEW at any given time.

The `CONCURRENTLY` keyword is used to create the index without blocking concurrent operations on the table, which is a best practice for production databases.
