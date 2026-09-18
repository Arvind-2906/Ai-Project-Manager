import { NextResponse } from "next/server";

export async function middleware(request) {
  const { pathname } = request.nextUrl;

  // 1. Static assets and internal Next.js paths bypass
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/static") ||
    pathname === "/favicon.ico" ||
    pathname.match(/\.(?:svg|png|jpg|jpeg|gif|webp|ico)$/)
  ) {
    return NextResponse.next();
  }

  // 2. Public auth endpoints bypass
  if (pathname.startsWith("/api/auth")) {
    return NextResponse.next();
  }

  // 3. Internal AI Microservice bypass using secure shared secret
  const internalSecret = process.env.AI_INTERNAL_SECRET_KEY;
  const requestSecret = request.headers.get("x-internal-secret");
  const isInternalAuthorized = Boolean(
    internalSecret && requestSecret && requestSecret === internalSecret
  );

  // 4. Session Token Resolution from Cookies or Authorization Header
  const sessionToken =
    request.cookies.get("better-auth.session_token")?.value ||
    request.cookies.get("__Secure-better-auth.session_token")?.value ||
    (request.headers.get("authorization")?.startsWith("Bearer ")
      ? request.headers.get("authorization").slice(7).trim()
      : null);

  const isAuthenticated = Boolean(sessionToken) || isInternalAuthorized;

  // 5. API Route Protection (return structured JSON error if unauthenticated)
  if (pathname.startsWith("/api")) {
    if (!isAuthenticated) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "UNAUTHENTICATED",
            message: "Authentication required. Please provide a valid session token.",
          },
        },
        { status: 401 }
      );
    }
  }

  // 6. Security & Governance Audit Headers
  const response = NextResponse.next();
  response.headers.set("X-AI-Platform-Version", "1.0.0");
  response.headers.set("X-Governance-Mode", "Human-In-The-Loop");
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("X-Frame-Options", "DENY");

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
