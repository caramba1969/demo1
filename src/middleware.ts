import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const { pathname } = req.nextUrl;
    const token = req.nextauth.token;

    // Only API admin routes are enforced here.
    // The /admin UI route is protected by src/app/admin/layout.tsx (server-side guard).
    if (pathname.startsWith('/api/admin') && token?.role !== 'admin') {
      return NextResponse.json(
        { error: 'Forbidden: admin access required' },
        { status: 403 }
      );
    }

    // Changelog is admin-only
    if (pathname.startsWith('/changelog') && token?.role !== 'admin') {
      return NextResponse.redirect(new URL('/', req.url));
    }
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const { pathname } = req.nextUrl;

        // Protected API routes — must be authenticated
        const protectedApiRoutes = [
          '/api/factories',
          '/api/production-lines',
          '/api/admin',
          '/api/locations',
        ];

        // Protected UI routes — redirect unauthenticated users to sign-in
        const protectedUiRoutes = [
          '/locations',
          '/graph',
          '/flow',
          '/recipes',
          '/admin',
          '/migrate',
          '/changelog',
        ];

        const isProtectedApi = protectedApiRoutes.some(r => pathname.startsWith(r));
        const isProtectedUi = protectedUiRoutes.some(r => pathname.startsWith(r));

        if (isProtectedApi || isProtectedUi) {
          return !!token;
        }

        return true;
      },
    },
    pages: {
      signIn: '/auth/signin',
    },
  }
);

export const config = {
  matcher: [
    '/api/factories/:path*',
    '/api/production-lines/:path*',
    '/api/admin/:path*',
    '/api/locations/:path*',
    '/locations/:path*',
    '/locations',
    '/graph/:path*',
    '/graph',
    '/flow/:path*',
    '/flow',
    '/recipes/:path*',
    '/recipes',
    '/admin/:path*',
    '/admin',
    '/migrate/:path*',
    '/migrate',
    '/changelog/:path*',
    '/changelog',
  ],
};
