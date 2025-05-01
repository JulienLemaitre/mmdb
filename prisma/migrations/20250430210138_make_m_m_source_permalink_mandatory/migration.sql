-- Populate MMSource.permalink
UPDATE "MMSource"
SET permalink = CASE
                    WHEN link ~ 'IMSLP(\d+)-' THEN
                        'https://imslp.org/wiki/Special:ImagefromIndex/' ||
                        substring(link FROM position('IMSLP' in link) + 5 FOR
                                  position('-' in substring(link FROM position('IMSLP' in link))) - 6) ||
                        '/sevqs'
                    ELSE link
    END;
-- AlterTable
ALTER TABLE "MMSource" ALTER COLUMN "permalink" SET NOT NULL;
