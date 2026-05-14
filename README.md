# The Metronome Mark Database

The Metronome Mark Database is the project of constituting a database of metronome marks and time signatures for classical music compositions. It aims at being a useful tool for musical research.

The data for a piece are the following :
- **Piece** : basic information about the piece (composer, title, date of composition, etc.)
- **Piece versions** : the different versions of a piece, which may differ in terms of instrumentation or time signature. A Piece Version is described with its movements and sections if any.
- **Metronome mark Source** : describe the source of metronome mark (manuscript, first edition, etc.). Related to this source are the following data :
  - the **Piece Versions** that appears in this source
  - the **Contributors** to this source (editor, publisher, etc.)
  - the **Metronome Marks** that appears in this source
  - the **Fastest notes** for each section of the related piece versions, expressed in terms of _Number of notes per bar_ for :
    - the fastest _structural_ notes
    - the fastest _staccato_ notes
    - the fastest _repeated_ notes
    - the fastest _ornamental_ notes

## Getting Started

Rn the development server:

```bash
npm run dev
```

## How can I make a dump of the production database and download it

You can create a backup of your Neon database using the `pg_dump` utility.[(1)](https://neon.com/docs/manage/backup-pg-dump)

First, install `pg_dump` if you don't have it. You can verify by running `pg_dump -V`.[(1)](https://neon.com/docs/manage/backup-pg-dump) It's recommended to use the latest versions and ensure the client version matches your Neon project's Postgres version.[(1)](https://neon.com/docs/manage/backup-pg-dump)

Next, get your connection string from your Neon Project Dashboard by clicking the **Connect** button.[(1)](https://neon.com/docs/manage/backup-pg-dump) Make sure to deselect the **Connection pooling** option - you need a direct connection string, not a pooled one.[(1)](https://neon.com/docs/manage/backup-pg-dump)

Your connection string should look like this:[(1)](https://neon.com/docs/manage/backup-pg-dump)

```
postgresql://alex:AbC123dEf@ep-cool-darkness-123456.us-east-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require
```
[(1)](https://neon.com/docs/manage/backup-pg-dump)

Then run this command to create your backup:[(1)](https://neon.com/docs/manage/backup-pg-dump)

```
pg_dump -Fc -v -d "<neon_database_connection_string>" -f <dump_file_name>
```
[(1)](https://neon.com/docs/manage/backup-pg-dump)

The flags mean:[(2)](https://neon.com/postgresql/postgresql-administration/postgresql-backup-database#introduction-to-postgresql-backup)

- `-Fc`: Creates a custom format archive suitable for input into pg_restore
- `-v`: Runs in verbose mode
- `-d`: Specifies the database connection string
- `-f`: Specifies the output file name

This will create a backup file locally where you're running the command.[(1)](https://neon.com/docs/manage/backup-pg-dump)