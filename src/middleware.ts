import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtDecode } from 'jwt-decode';

// Routes that don't require authentication
const publicRoutes = [
    '/',
    '/login',
    '/register',
    '/forgot-password',
    '/reset-password',
    '/verify-email',
    '/confirm-email',
    '/auth/verify-email',
    '/auth/confirm-email',
    '/auth/reset-password',
    '/auth/forgot-password',
    '/about',
    '/contact',
    '/privacy',
    '/terms',
    '/emergency',
    '/access',
    '/unauthorized',
    '/google/callback',
    '/auth/google/callback',
    '/policies',
];

export function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // Fix legacy /auth/ links (remove the prefix)
    if (pathname.startsWith('/auth/')) {
        const newPathname = pathname.replace('/auth/', '/');
        const url = request.nextUrl.clone();
        url.pathname = newPathname;
        console.info(`[Middleware Diagnostic] Redirecting legacy /auth/ prefix: ${pathname} -> ${newPathname}`);
        return NextResponse.redirect(url);
    }

    // 1. Skip static assets and public files
    if (
        pathname.startsWith('/_next') ||
        pathname.startsWith('/api') ||
        pathname.startsWith('/static') ||
        pathname.includes('.')
    ) {
        return NextResponse.next();
    }

    // 2. Check if it's a public route
    const isPublicRoute = publicRoutes.some(route =>
        pathname === route || pathname.startsWith(`${route}/`)
    );

    // 3. Get Auth Token
    const token = request.cookies.get('auth_token')?.value;

    // 4. Handle Redirection Logic
    if (!token) {
        // If not authenticated and trying to access protected route
        if (!isPublicRoute) {
            console.warn(`[Middleware Auth] BLOCKED: No auth_token cookie for protected route "${pathname}". Client must have valid session cookie.`);
            const redirectUrl = new URL('/login', request.url);
            redirectUrl.searchParams.set('returnUrl', pathname);
            return NextResponse.redirect(redirectUrl);
        }
        return NextResponse.next();
    }

    // 5. If Authenticated
    try {
        const decoded: any = jwtDecode(token);
        const userRole = decoded['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'] || decoded['role'];
        const isExp = decoded.exp * 1000 < Date.now();

        console.info(`[Middleware Diagnostic] Auth detected. Role: "${userRole}" | Expired: ${isExp}`);

        if (isExp) {
            console.info(`[Middleware Diagnostic] Session expired for "${pathname}". Clearing cookie and redirecting to /login.`);
            const response = NextResponse.redirect(new URL('/login', request.url));
            response.cookies.delete('auth_token');
            return response;
        }

        // Prevent authenticated users from visiting login/register
        if (pathname === '/login' || pathname === '/login/doctor' || pathname === '/login/admin' || pathname === '/register') {
            let redirectDashboard = '/dashboard';
            if (userRole === 'Admin') redirectDashboard = '/admin/dashboard';
            if (userRole === 'Doctor') redirectDashboard = '/doctor/dashboard';

            console.info(`[Middleware Diagnostic] Authenticated user on auth page. Redirecting to "${redirectDashboard}".`);
            return NextResponse.redirect(new URL(redirectDashboard, request.url));
        }

        // Role-based Access Control
        if (pathname.startsWith('/admin') && userRole !== 'Admin') {
            console.warn(`[Middleware Diagnostic] Role mismatch: User "${userRole}" tried to access Admin route "${pathname}". Redirecting to /unauthorized.`);
            return NextResponse.redirect(new URL('/unauthorized', request.url));
        }

        if (pathname.startsWith('/doctor') && userRole !== 'Doctor') {
            console.warn(`[Middleware Diagnostic] Role mismatch: User "${userRole}" tried to access Doctor route "${pathname}". Redirecting to /unauthorized.`);
            return NextResponse.redirect(new URL('/unauthorized', request.url));
        }

        // Patient routes are default (no prefix)
        // Check if a Doctor/Admin is accessing patient routes like /appointments/new
        // If the ProtectedRoute in the page also checks, it might cause double redirects,
        // but here we ensure they have access or redirect them.

        if (pathname === '/profile' && userRole === 'Doctor') {
            return NextResponse.redirect(new URL('/doctor/profile', request.url));
        }

        console.info(`[Middleware Diagnostic] Access granted to "${pathname}" for role "${userRole}".`);
        return NextResponse.next();
    } catch (error) {
        // Invalid token
        console.error(`[Middleware Diagnostic] Token decoding failed. Potential tampering or malformed token. Redirecting to /login.`);
        const response = NextResponse.redirect(new URL('/login', request.url));
        response.cookies.delete('auth_token');
        return response;
    }
}

export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - api (API routes)
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         */
        '/((?!api|_next/static|_next/image|favicon.ico).*)',
    ],
};
