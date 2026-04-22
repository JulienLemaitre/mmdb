import { PrismaClient } from "@/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
});

const prismaOptions = {
  adapter,
  transactionOptions: {
    maxWait: 5000, // default: 2000
    timeout: 10000, // default: 5000
  },
};

declare global {
  // eslint-disable-next-line no-var
  var cachedPrisma: PrismaClient | undefined;
}

const prisma =
  process.env.NODE_ENV === "production"
    ? new PrismaClient(prismaOptions)
    : (globalThis.cachedPrisma ??
      (globalThis.cachedPrisma = new PrismaClient(prismaOptions)));

export const db = prisma;
