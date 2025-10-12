import "dotenv/config";
import type { PrismaConfig } from "prisma";

export default {
  migrations: {
    seed: "ts-node -P tsconfig-seed.json -r tsconfig-paths/register --transpileOnly prisma/seedFromXlsx.ts",
  },
} satisfies PrismaConfig;
