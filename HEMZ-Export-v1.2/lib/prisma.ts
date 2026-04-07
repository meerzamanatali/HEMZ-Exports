// Import from generated client location for proper type inference
import { PrismaClient } from ".prisma/client"

// Force TypeScript to recognize all Prisma models
declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined
}

export const prisma =
  globalThis.prisma ||
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["query"] : [],
  })

if (process.env.NODE_ENV !== "production") globalThis.prisma = prisma
