import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// List of public paths that don't require authentication
const publicPaths = [
  '/',
  '/sign-in',
  '/sign-up',
  '/status',
  '/api/public',
  '/api/auth',
  '/api/test-email',
  '/api/env-check',
  '/api/health',
  '/api/debug-subscriptions',
  '/debug',
  '/api/subscriptions',
];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Check if the path is public
  const isPublicPath = publicPaths.some(path => 
    pathname === path || pathname.startsWith(`${path}/`)
  );

  // Get auth cookie
  const isAuthenticated = request.cookies.has('__clerk_db_jwt');

  // If path is public or user is authenticated, allow access
  if (isPublicPath || isAuthenticated) {
    return NextResponse.next();
  }

  // Redirect to sign-in page if not authenticated
  // Create a new URL object for redirect
  const url = request.nextUrl.clone();
  url.pathname = '/sign-in';
  url.searchParams.set('redirect_url', request.url);
  return NextResponse.redirect(url);
}

export const config = {
  matcher: [
    // Don't match API routes that are meant to be public
    '/((?!api/public|api/auth|api/test-email|api/env-check|api/health|api/debug-subscriptions|debug|_next/static|_next/image|favicon.ico|api/subscriptions).*)',
  ],
}; 