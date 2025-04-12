import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyToken } from '@/lib/auth';

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

// Demo user tokens - these will be accepted even without database verification
const isDemoUser = (token: string | undefined): boolean => {
  if (!token) return false;
  
  try {
    const payload = verifyToken(token);
    // Check if the user ID starts with 'demo-'
    return payload?.userId?.startsWith('demo-') || false;
  } catch (error) {
    return false;
  }
};

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

  // Allow demo users through
  const isDemoAuthenticated = isDemoUser(authCookie?.value);

  // Log authentication status for debugging (only in development)
  if (process.env.NODE_ENV === 'development') {
    console.log(`[Middleware] Path: ${pathname}`);
    console.log(`[Middleware] Is public path: ${isPublicPath}`);
    console.log(`[Middleware] Auth cookie present: ${!!authCookie}`);
    console.log(`[Middleware] Is authenticated: ${isAuthenticated}`);
    console.log(`[Middleware] Is demo user: ${isDemoAuthenticated}`);
  }

  // If path is public or user is authenticated, allow access
  if (isPublicPath || isAuthenticated || isDemoAuthenticated) {
    return NextResponse.next();
  }

  // Check if DEMO_MODE is enabled in production
  if (process.env.DEMO_MODE === 'true') {
    if (process.env.NODE_ENV === 'development') {
      console.log('[Middleware] Demo mode enabled, allowing access');
    }
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