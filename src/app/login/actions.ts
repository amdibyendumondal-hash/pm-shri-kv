'use server'

import { cookies } from 'next/headers'
import { db } from '@/lib/db'
import { comparePassword, signJWT } from '@/lib/auth'

export async function login(prevState: any, formData: FormData) {
  const username = formData.get('username') as string
  const password = formData.get('password') as string

  if (!username || !password) {
    return { error: 'Please enter both username and password.' }
  }

  try {
    const user = await db.user.findUnique({
      where: { username },
    })

    if (!user) {
      return { error: 'Invalid username or password.' }
    }

    const isValid = await comparePassword(password, user.passwordHash)
    if (!isValid) {
      return { error: 'Invalid username or password.' }
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
    await db.auditLog.create({
      data: {
        userId: user.id,
        username: user.username,
        action: 'LOGIN',
        details: `${user.name} logged in successfully.`,
      }
    })

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

export async function loginWithFirebaseEmail(email: string) {
  if (!email) {
    return { error: 'Missing email address.' }
  }

  try {
    const user = await db.user.findFirst({
      where: {
        OR: [
          { email: email.trim() },
          { username: email.trim() }
        ]
      }
    })

    if (!user) {
      return { error: 'Your email/username is not registered in this system. Please contact the administrator.' }
    }

    // Sign local JWT
    const token = await signJWT({
      id: user.id,
      username: user.username,
      name: user.name,
      role: user.role,
      email: user.email,
    })

    // Set session cookie
    const cookieStore = await cookies()
    cookieStore.set('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 60 * 60 * 24, // 24 hours
      path: '/',
    })

    // Create Audit Log
    await db.auditLog.create({
      data: {
        userId: user.id,
        username: user.username,
        action: 'LOGIN',
        details: `${user.name} logged in successfully via Firebase.`,
      }
    })

    return { success: true, role: user.role }
  } catch (error: any) {
    return { error: error.message || 'An error occurred during server-side verification.' }
  }
}

export async function verifyLocalCredentials(email: string, password: string) {
  if (!email || !password) {
    return { error: 'Missing email or password.' }
  }

  try {
    const user = await db.user.findFirst({
      where: {
        OR: [
          { email: email.trim() },
          { username: email.trim() }
        ]
      }
    })

    if (!user) {
      return { success: false, error: 'User not registered locally.' }
    }

    const isValid = await comparePassword(password, user.passwordHash)
    if (!isValid) {
      return { success: false, error: 'Incorrect local credentials.' }
    }

    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message || 'Verification failed.' }
  }
}

export async function loginWithLocalCredentials(email: string, password: string) {
  if (!email || !password) {
    return { error: 'Please enter both email/username and password.' }
  }

  try {
    const user = await db.user.findFirst({
      where: {
        OR: [
          { email: email.trim() },
          { username: email.trim() }
        ]
      }
    })

    if (!user) {
      return { error: 'Invalid email/username or password.' }
    }

    const isValid = await comparePassword(password, user.passwordHash)
    if (!isValid) {
      return { error: 'Invalid email/username or password.' }
    }

    // Sign local JWT
    const token = await signJWT({
      id: user.id,
      username: user.username,
      name: user.name,
      role: user.role,
      email: user.email,
    })

    // Set session cookie
    const cookieStore = await cookies()
    cookieStore.set('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 60 * 60 * 24, // 24 hours
      path: '/',
    })

    // Create Audit Log
    await db.auditLog.create({
      data: {
        userId: user.id,
        username: user.username,
        action: 'LOGIN',
        details: `${user.name} logged in successfully via Local Database Fallback.`,
      }
    })

    return { success: true, role: user.role }
  } catch (error: any) {
    return { error: error.message || 'An error occurred during local fallback authentication.' }
  }
}
