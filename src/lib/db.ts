import { PrismaClient } from '@prisma/client'
import fs from 'fs'
import path from 'path'

const globalForPrisma = global as unknown as { prisma: PrismaClient }

let dbUrl: string | undefined = undefined

// In serverless environments (like Netlify/Vercel), copy the SQLite database to /tmp to make it writeable
if (process.env.NETLIFY || process.env.VERCEL || process.env.NODE_ENV === 'production') {
  const tmpDbPath = '/tmp/dev.db'
  
  // Try to find the bundled dev.db file in various possible build/runtime paths
  const possiblePaths = [
    path.join(process.cwd(), 'prisma', 'dev.db'),
    path.join(process.cwd(), 'dev.db'),
    path.join(__dirname, 'dev.db'),
    path.join(__dirname, '..', 'dev.db'),
    path.join(__dirname, '..', '..', 'dev.db'),
    path.join(__dirname, '..', '..', '..', 'dev.db'),
    path.join('/var', 'task', 'prisma', 'dev.db'),
    path.join('/var', 'task', 'dev.db'),
  ]
  
  let sourceDbPath = ''
  for (const p of possiblePaths) {
    if (fs.existsSync(p)) {
      sourceDbPath = p
      break
    }
  }

  if (sourceDbPath) {
    try {
      const stats = fs.statSync(sourceDbPath)
      if (stats.size > 0) {
        // Copy the database file to /tmp if it doesn't exist
        // Serverless containers are reused, so we check existence to avoid copying on every request
        if (!fs.existsSync(tmpDbPath)) {
          fs.copyFileSync(sourceDbPath, tmpDbPath)
          // Set permissions to ensure read/write access
          fs.chmodSync(tmpDbPath, 0o666)
          console.log(`Successfully initialized SQLite database in writeable scratch directory: ${tmpDbPath}`)
        }
        dbUrl = `file:${tmpDbPath}`
      }
    } catch (err) {
      console.error('Failed to copy SQLite database to /tmp:', err)
    }
  } else {
    console.error('Could not locate bundled dev.db file in search paths:', possiblePaths)
  }
}

export const db = globalForPrisma.prisma || new PrismaClient(
  dbUrl ? { datasources: { db: { url: dbUrl } } } : undefined
)

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db
