import { PrismaClient } from "@prisma/client";

declare global {
  // eslint-disable-next-line no-var
  var cachedPrisma: PrismaClient;
}

const prismaOptions = {
  transactionOptions: {
    maxWait: 5000, // default: 2000
    timeout: 10000, // default: 5000
  },
};

let prisma: PrismaClient;
if (process.env.NODE_ENV === "production") {
  prisma = new PrismaClient(prismaOptions);
} else {
  if (!global.cachedPrisma) {
    global.cachedPrisma = new PrismaClient(prismaOptions);
  }
  prisma = global.cachedPrisma;
}

export const db = prisma;
