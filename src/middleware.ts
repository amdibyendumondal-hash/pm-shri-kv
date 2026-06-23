import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { jwtVerify } from 'jose'

const SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'pm-shri-kv-mahuldiha-secret-key-12345-forty-chars-long-minimum'
)

export async function middleware(request: NextRequest) {
  const token = request.cookies.get('token')?.value
  const path = request.nextUrl.pathname

  // Public paths: root landing page or login page
  if (path === '/' || path === '/login') {
    if (token) {
      try {
        const { payload } = await jwtVerify(token, SECRET)
        const role = payload.role as string
        if (role === 'ADMIN') {
          return NextResponse.redirect(new URL('/admin/dashboard', request.url))
        } else if (role === 'TEACHER') {
          return NextResponse.redirect(new URL('/teacher/dashboard', request.url))
        }
      } catch (err) {
        // If JWT token is corrupted or expired, clear it and proceed
        const response = NextResponse.next()
        response.cookies.delete('token')
        return response
      }
    }
    return NextResponse.next()
  }

  // Protected paths
  if (path.startsWith('/admin') || path.startsWith('/teacher')) {
    if (!token) {
      return NextResponse.redirect(new URL('/login', request.url))
    }

    try {
      const { payload } = await jwtVerify(token, SECRET)
      const role = payload.role as string

      if (path.startsWith('/admin') && role !== 'ADMIN') {
        // Teachers attempting to access Admin panel are redirected back to Teacher dashboard
        return NextResponse.redirect(new URL('/teacher/dashboard', request.url))
      }

      if (path.startsWith('/teacher') && role !== 'TEACHER' && role !== 'ADMIN') {
        // Non-teachers/non-admins are redirected back
        return NextResponse.redirect(new URL('/admin/dashboard', request.url))
      }
    } catch (err) {
      // Token verification failed (tampered or expired)
      const response = NextResponse.redirect(new URL('/login', request.url))
      response.cookies.delete('token')
      return response
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/', '/login', '/admin/:path*', '/teacher/:path*'],
}
