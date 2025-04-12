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

// Simple check for demo user - we just need to know if the token exists
// This avoids using crypto which isn't available in Edge Runtime
const isDemoUser = (token: string | undefined): boolean => {
  if (!token) return false;
  
  // Simple check - if token exists, assume it's valid for demo purposes
  return true;
};

// Specify runtime as 'nodejs' (not edge)
export const runtime = 'nodejs';

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

  // Check for authentication cookie
  const authCookie = request.cookies.get('__clerk_db_jwt');
  const isAuthenticated = !!authCookie?.value;

  // For demo mode, just check if the cookie exists at all
  const isDemoAuthenticated = isAuthenticated && isDemoUser(authCookie?.value);

  // If path is public or user is authenticated, allow access
  if (isPublicPath || isAuthenticated || isDemoAuthenticated) {
    return NextResponse.next();
  }

  // DEMO_MODE overrides authentication for testing
  if (process.env.DEMO_MODE === 'true') {
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