import { withAuth } from 'next-auth/middleware'
import { NextResponse } from 'next/server'

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token
    const path = req.nextUrl.pathname

    // Public routes
    if (path === '/auth/signin' || path === '/auth/signup') {
      return NextResponse.next()
    }

    // Check if user is authenticated
    if (!token) {
      return NextResponse.redirect(new URL('/auth/signin', req.url))
    }

    // Role-based route protection
    const role = token.role

    // Student routes
    if (path.startsWith('/student') && role !== 'STUDENT') {
      return NextResponse.redirect(new URL('/unauthorized', req.url))
    }

    // Faculty routes
    if (path.startsWith('/faculty') && role !== 'FACULTY') {
      return NextResponse.redirect(new URL('/unauthorized', req.url))
    }

    // Parent routes
    if (path.startsWith('/parent') && role !== 'PARENT') {
      return NextResponse.redirect(new URL('/unauthorized', req.url))
    }

    // Admin routes
    if (path.startsWith('/admin') && role !== 'ADMIN') {
      return NextResponse.redirect(new URL('/unauthorized', req.url))
    }

    return NextResponse.next()
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token
    }
  }
)

export const config = {
  matcher: [
    '/student/:path*',
    '/faculty/:path*',
    '/parent/:path*',
    '/admin/:path*',
    '/dashboard/:path*',
    '/api/leave/:path*',
    '/api/notifications/:path*'
  ]
}
