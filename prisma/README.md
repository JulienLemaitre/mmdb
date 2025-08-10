# Metronome Mark Database - Prisma and PostgreSQL database related docs

## Building the prisma schema and seeding the database

### Extracting the data from Arjun's Excel files

In `prisma/ArjunData/20230319_MM_folders` we find the Excel Files from Arjun's Drive folder.

The file `prisma/seedFromXlsx.ts` do the following :
- it extracts the data from the Excel files and parses it as a dataSheetList array.
- it parses this dataSheetList object to a well-structured pieceList Array of piece objects containing movements, sections and metronomeMarkList. It also determines note values from the fastest note values and outputs a list of pieces with not found notes.
- The output of the precedent steps is stored in the file `prisma/output/parsedDataOutput.js`. If this file is found at the start of the `seedFromXlsx.ts` execution, the first two steps are skipped and the precedent output is used instead.
- it finally uses all this data to seed the database.

### Useful Prisma commands

#### Apply a change in the Prisma schema

When a change has been made to the Schema, the following command creates a migration file and applies it to the database.

```bash
npx prisma migrate dev
```

This also generates:
- the typed prisma client
- a dbml file in `prisma/dbml/schema.dbml` thanks to the prisma-dbml-generator package.

#### Work on a migration before its application to the database

If we want to only create the migration file without applying it to the database, use:

```bash
npx prisma migrate dev --create-only
```

We can then edit the migration file in the corresponding `prisma/migrations/[date]_[migration_name]/migration.sql` file.
Finally, to apply the migration, execute:

```bash
npx prisma migrate dev
```

#### Seed the database

The command for the seed script is in the package.json file at `prisma.seed`.
It can be launched with:

```bash
npx prisma db seed
```

#### Reset the database (delete all tables and data + seed)

This command will:
- DROP ALL data and structures from the database.
- Create the database structure by applying all the migrations from the `prisma/migrations` folder.
- run the seed script

```bash
npx prisma migrate reset
```

## Specific constraint in the database

### Reference constraint

As explained in the Reference model part of the Prisma schema, a constraint Reference_type_reference_isbn_ismn_key is created directly in DB by a migration and makes a unique index (type, reference) for type = ISBN | ISMN.
This allows having multiple occurrences of the same PLATE_NUMBER references.
_This cannot be expressed in the Prisma schema_

## Triggers for the review process - hypothesis

One hypothesis to implement the data review process is to use triggers as follows:
Triggers are set on multiple tables to ensure that, being in an active Review process, all changes made to the data of a mMSource and its parts are stored in an AuditLog table with the before and after JSON and the actor (User).
These triggers are described in the related migration.

## webstorm db extension connexion string for project's Neon databases

### production
jdbc:postgresql://ep-muddy-sunset-65307213-pooler.eu-central-1.aws.neon.tech:5432/mmdb

### staging
jdbc:postgresql://ep-wandering-mouse-79213592-pooler.eu-central-1.aws.neon.tech:5432/mmdb

### Review-process
jdbc:postgresql://ep-twilight-union-a2tu4xqs-pooler.eu-central-1.aws.neon.tech:5432/mmdb