import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// List of public paths that don't require authentication
const publicPaths = [
  '/',
  '/sign-in',
  '/sign-up',
  '/forgot-password',
  '/reset-password',
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

// Check for authentication token
const isAuthenticated = (token: string | undefined): boolean => {
  if (!token) return false;
  return token.length > 0;
};

// Use Edge runtime for better performance
export const runtime = 'experimental-edge';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Additional path checks for static assets and API routes
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/static') ||
    pathname.includes('.') || // This catches files like favicon.ico
    pathname.startsWith('/api/public')
  ) {
    return NextResponse.next();
  }
  
  // Check if the path is public
  const isPublicPath = publicPaths.some(path => 
    pathname === path || pathname.startsWith(`${path}/`)
  );

  // If path is public, allow access unconditionally
  if (isPublicPath) {
    return NextResponse.next();
  }

  // Check for authentication cookie
  const authCookie = request.cookies.get('__clerk_db_jwt');
  
  // If authenticated with a real token, allow access
  if (isAuthenticated(authCookie?.value)) {
    return NextResponse.next();
  }

  // Redirect to sign-in page if not authenticated
  // Create a new URL object for redirect
  const url = request.nextUrl.clone();
  url.pathname = '/sign-in';
  url.searchParams.set('redirect_url', request.nextUrl.pathname);
  return NextResponse.redirect(url);
}

export const config = {
  matcher: [
    // Match all paths except static files, API routes, etc.
    '/((?!api/public|api/auth|api/test-email|api/env-check|api/health|api/debug-subscriptions|_next/static|_next/image|favicon.ico|api/subscriptions).*)',
  ],
}; 