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
  
  try {
    // In demo mode, any token is accepted
    if (process.env.DEMO_MODE === 'true') {
      console.log('Demo mode is active in isDemoUser check');
      return true;
    }
    
    // Simple check - if token exists and we're in demo mode
    return token.length > 0;
  } catch (error) {
    console.error('Error checking demo user:', error);
    return false;
  }
};

// Use Edge runtime for better performance
export const runtime = 'experimental-edge';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // For Vercel, use demo mode as a fallback if real auth fails
  // But don't force it to always be in demo mode
  const useDemoFallback = true; 
  const isDemoModeActive = process.env.DEMO_MODE === 'true';
  
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
  const isAuthenticated = !!authCookie?.value;

  // If authenticated with a real token, allow access
  if (isAuthenticated) {
    return NextResponse.next();
  }

  // If demo mode is active as fallback, allow access as a last resort
  if (isDemoModeActive && useDemoFallback) {
    console.log('Demo mode is active as fallback, bypassing authentication');
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