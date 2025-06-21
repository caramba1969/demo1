import { withAuth } from "next-auth/middleware"

export default withAuth(
  // `withAuth` augments your `Request` with the user's token.
  function middleware(req) {
    // Add any additional middleware logic here
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {        // Define routes that require authentication
        const protectedApiRoutes = [
          '/api/factories',
          '/api/production-lines',
          '/api/admin',
        ];

        const { pathname } = req.nextUrl;
        
        // Check if it's a protected API route
        const isProtectedApiRoute = protectedApiRoutes.some(route => 
          pathname.startsWith(route)
        );

        // Allow access to protected API routes only if user is authenticated
        if (isProtectedApiRoute) {
          return !!token;
        }

        // Allow access to all other routes
        return true;
      },
    },
  }
)

export const config = {
  matcher: [
    '/api/factories/:path*',
    '/api/production-lines/:path*',
    '/api/admin/:path*',
  ]
}
