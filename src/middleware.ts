import { NextResponse } from "next/server";
import NextAuth from "next-auth";
import { authConfig } from "@/auth.config";

const { auth } = NextAuth(authConfig);

export default auth(async function middleware(req) {
  const { pathname } = req.nextUrl;
  const isAuthenticated = !!req.auth;

  // Protected routes that require authentication
  const protectedPatterns = [
    /^\/$/,  // Root route (homepage with user's forms)
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
});

export const config = {
  matcher: [
    // Root route (protected - shows user's forms)
    "/",
    // Protected admin pages
    "/form/:path*/edit/:path*",
    "/form/:path*/responses/:path*",
    "/form/:path*/sessions/:path*",
    // Auth pages
    "/auth/:path*",
  ],
};
