import { PrismaClient } from "@prisma/client"

// Single Prisma client shared by both bots (they run in one process).
export const prisma = new PrismaClient()
