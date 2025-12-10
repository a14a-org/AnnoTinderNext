import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Get the JWT token (works in edge runtime without Prisma)
  const token = await getToken({ req, secret: process.env.AUTH_SECRET });
  const isAuthenticated = !!token;

  // Protected routes that require authentication
  const protectedPatterns = [
    /^\/form\/[^/]+\/edit/,
    /^\/form\/[^/]+\/responses/,
    /^\/form\/[^/]+\/sessions/,
  ];

  const isProtectedRoute = protectedPatterns.some((pattern) =>
    pattern.test(pathname)
  );

  // Redirect to sign-in if accessing protected route without auth
  if (isProtectedRoute && !isAuthenticated) {
    const signInUrl = new URL("/auth/signin", req.url);
    signInUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(signInUrl);
  }

  // Redirect to home if accessing auth pages while authenticated
  if (pathname.startsWith("/auth/") && isAuthenticated) {
    // Allow sign-out
    if (pathname === "/auth/signout") {
      return NextResponse.next();
    }
    return NextResponse.redirect(new URL("/", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    // Protected admin pages
    "/form/:path*/edit/:path*",
    "/form/:path*/responses/:path*",
    "/form/:path*/sessions/:path*",
    // Auth pages
    "/auth/:path*",
  ],
};
