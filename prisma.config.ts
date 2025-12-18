import "dotenv/config";
import { defineConfig, env } from "prisma/config";

export default defineConfig({
  // The path to the schema file, or path to a folder that shall be recursively searched for *.prisma files.
  schema: "./prisma/schema.prisma",

  // where migrations should be generated
  // what script to run for "prisma db seed"
  migrations: {
    path: "./prisma/migrations",
    seed: "ts-node -P tsconfig-seed.json -r tsconfig-paths/register --transpileOnly prisma/seedFromXlsx.ts",
  },

  // Configuration for the database view entities.
  // views?: {
  //   path: string;
  // };

  // Configuration for the `typedSql` preview feature.
  // typedSql?: {
  //   path: string;
  // };

  // Database connection configuration
  datasource: {
    url: env("DATABASE_URL"),
  },
});
