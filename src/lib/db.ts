import { PrismaClient } from '@prisma/client'

const supabaseUrl = "postgresql://postgres:Dibyendu@1996@db.jiauaaubibvuuouqxxmn.supabase.co:5432/postgres"

if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL = supabaseUrl
}

const globalForPrisma = global as unknown as { prisma: PrismaClient }

export const db = globalForPrisma.prisma || new PrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db
