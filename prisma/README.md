# Metronome Mark Database Development

## Building the prisma schema and seeding the database

### Extracting the data from Arjun's Excel files

In `prisma/ArjunData/20230319_MM_folders` we find the Excel Files from Arjun's Drive folder.

The file `prisma/seedFromXlsx.ts` do several things :
- it extracts the data from the Excel files and parses it as a dataSheetList array.
- it parses this dataSheetList object to a well-structured pieceList Array of piece objects containing movements, sections and metronomeMarkList. It also determines note values from the fastest note values, and output a list of pieces with not found notes.
- it finally uses all this data to seed the database.

## Useful commands

### Generate the prisma client

```bash
npx prisma migrate dev 
npx prisma migrate dev --create-only 
```

### Seed the database

```bash
npx prisma db seed
```

### Reset the database (delete all tables and data + seed)

```bash
npx prisma migrate reset
```

