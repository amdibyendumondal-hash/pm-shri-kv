'use server'

import { cookies } from 'next/headers'
import { db } from '@/lib/db'
import { comparePassword, signJWT } from '@/lib/auth'

// Hardcoded user fallbacks to ensure 100% fail-safe logins without any database requirement
const HARDCODED_USERS = [
  {
    email: 'amdibyendumondal@gmail.com',
    username: 'amdibyendumondal@gmail.com',
    password: '123456',
    name: 'Dibyendu Mondal (PGT Math)',
    role: 'ADMIN',
    id: 'hardcoded-admin-id-12345'
  },
  {
    email: 'ranjana.teacher@gmail.com',
    username: 'teacher',
    password: 'teacher123',
    name: 'Mrs. Ranjana Sharma (PGT Computer Science)',
    role: 'TEACHER',
    id: 'hardcoded-teacher-id-12345'
  }
]

export async function login(prevState: any, formData: FormData) {
  const email = (formData.get('email') as string)?.trim()
  const password = formData.get('password') as string

  if (!email || !password) {
    return { error: 'Please enter both email and password.' }
  }

  try {
    // 1. Check against hardcoded credentials first (100% database-free & Firebase-free)
    const hardcodedUser = HARDCODED_USERS.find(
      u => u.email.toLowerCase() === email.toLowerCase() || u.username.toLowerCase() === email.toLowerCase()
    )

    if (hardcodedUser && hardcodedUser.password === password) {
      // Sign JWT
      const token = await signJWT({
        id: hardcodedUser.id,
        username: hardcodedUser.username,
        name: hardcodedUser.name,
        role: hardcodedUser.role,
        email: hardcodedUser.email,
      })

      // Set cookie
      const cookieStore = await cookies()
      cookieStore.set('token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 60 * 60 * 24, // 24 hours
        path: '/',
      })

      // Try to log this action in the database if available
      try {
        await db.auditLog.create({
          data: {
            userId: hardcodedUser.id,
            username: hardcodedUser.username,
            action: 'LOGIN',
            details: `${hardcodedUser.name} logged in via Hardcoded Credential.`,
          }
        })
      } catch (dbErr) {
        console.warn('Could not write audit log to database:', dbErr)
      }

      return { success: true, role: hardcodedUser.role }
    }

    // 2. Fall back to local database check if hardcoded credentials do not match
    let user;
    try {
      user = await db.user.findFirst({
        where: {
          OR: [
            { email: { equals: email, mode: 'insensitive' } },
            { username: { equals: email, mode: 'insensitive' } }
          ]
        }
      })
    } catch (dbErr) {
      console.error('Database connection failed during login:', dbErr)
    }

    if (!user) {
      return { error: 'Invalid email or password.' }
    }

    const isValid = await comparePassword(password, user.passwordHash)
    if (!isValid) {
      return { error: 'Invalid email or password.' }
    }

    // Sign JWT
    const token = await signJWT({
      id: user.id,
      username: user.username,
      name: user.name,
      role: user.role,
      email: user.email,
    })

    // Set cookie
    const cookieStore = await cookies()
    cookieStore.set('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 60 * 60 * 24, // 24 hours
      path: '/',
    })

    // Create Audit Log
    try {
      await db.auditLog.create({
        data: {
          userId: user.id,
          username: user.username,
          action: 'LOGIN',
          details: `${user.name} logged in successfully via Local Database.`,
        }
      })
    } catch (dbErr) {}

    return { success: true, role: user.role }
  } catch (error: any) {
    return { error: error.message || 'An error occurred during login.' }
  }
}

export async function logout() {
  const cookieStore = await cookies()
  const token = cookieStore.get('token')?.value
  
  if (token) {
    try {
      const jose = require('jose')
      const SECRET = new TextEncoder().encode(
        process.env.JWT_SECRET || 'pm-shri-kv-mahuldiha-secret-key-12345-forty-chars-long-minimum'
      )
      const { payload } = await jose.jwtVerify(token, SECRET)
      await db.auditLog.create({
        data: {
          userId: payload.id as string,
          username: payload.username as string,
          action: 'LOGOUT',
          details: `${payload.name} logged out.`,
        }
      })
    } catch (err) {}
  }

  cookieStore.delete('token')
}

