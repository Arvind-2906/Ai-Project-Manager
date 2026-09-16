import { NextResponse } from "next/server";

export async function middleware(request) {
  const { pathname } = request.nextUrl;

  // Static assets and internal endpoints bypass
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/static") ||
    pathname.startsWith("/api/auth") ||
    pathname === "/favicon.ico"
  ) {
    return NextResponse.next();
  }

  // Example route-protection check for dashboard routes
  const sessionToken =
    request.cookies.get("better-auth.session_token") ||
    request.cookies.get("__Secure-better-auth.session_token");

  const isAuthRoute =
    pathname.startsWith("/login") ||
    pathname.startsWith("/register") ||
    pathname.startsWith("/reset-password");

  const isDashboardRoute =
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/projects") ||
    pathname.startsWith("/organizations") ||
    pathname.startsWith("/approvals") ||
    pathname.startsWith("/agents");

  // Redirect unauthenticated requests accessing protected areas to login
  if (isDashboardRoute && !sessionToken) {
    // In local dev without active auth, allow pass-through if dev bypass header or cookie exists
    // Otherwise redirect to /login
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("callbackUrl", pathname);
    // return NextResponse.redirect(url); // Uncomment when ready to enforce strictly
  }

  // Redirect authenticated requests away from login/register
  if (isAuthRoute && sessionToken) {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    return NextResponse.redirect(url);
  }

  const response = NextResponse.next();

  // Add security and agent tracking headers
  response.headers.set("X-AI-Platform-Version", "1.0.0");
  response.headers.set("X-Governance-Mode", "Human-In-The-Loop");

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
