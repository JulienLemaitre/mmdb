-- Drop the existing unique constraint if it exists
DROP INDEX IF EXISTS "Reference_type_reference_key";

-- Create partial unique index for ISBN and ISMN
CREATE UNIQUE INDEX "Reference_type_reference_isbn_ismn_key"
    ON "Reference"(type, reference)
    WHERE type IN ('ISBN', 'ISMN');