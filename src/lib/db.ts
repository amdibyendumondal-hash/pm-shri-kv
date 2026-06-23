import { PrismaClient } from '@prisma/client'

const globalForPrisma = global as unknown as { prisma: PrismaClient }

const supabaseUrl = "postgresql://postgres:Dibyendu@1996@db.jiauaaubibvuuouqxxmn.supabase.co:5432/postgres"

export const db = globalForPrisma.prisma || new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL || supabaseUrl
    }
  }
})

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db
