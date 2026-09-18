import { auth } from "./auth";
import { prisma } from "@/lib/db/prisma";

/**
 * Extracts and validates the active session from an incoming HTTP request.
 * Supports Better Auth session cookies, Bearer Authorization headers,
 * and internal service authentication.
 *
 * @param {Request} request Incoming Next.js API Request
 * @returns {Promise<{ user: Object, session: Object } | null>}
 */
export async function getSession(request) {
  if (!request) return null;

  // 1. Attempt session resolution via Better Auth API
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });
    if (session?.user) {
      return session;
    }
  } catch (err) {
    // Continue to database fallback
  }

  // 2. Fallback: Parse Bearer token or cookie from request headers
  let token = null;
  const authHeader = request.headers.get("authorization");
  if (authHeader && authHeader.startsWith("Bearer ")) {
    token = authHeader.slice(7).trim();
  }

  if (!token) {
    const cookieHeader = request.headers.get("cookie");
    if (cookieHeader) {
      const cookies = Object.fromEntries(
        cookieHeader.split(";").map((c) => {
          const [k, ...v] = c.trim().split("=");
          return [k, v.join("=")];
        })
      );
      token = cookies["better-auth.session_token"] || cookies["__Secure-better-auth.session_token"];
    }
  }

  if (!token) {
    return null;
  }

  // 3. Direct Prisma session validation
  const dbSession = await prisma.session.findUnique({
    where: { token },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          emailVerified: true,
          image: true,
          createdAt: true,
          updatedAt: true,
        },
      },
    },
  });

  if (!dbSession || new Date(dbSession.expiresAt) <= new Date()) {
    return null;
  }

  return {
    session: {
      id: dbSession.id,
      userId: dbSession.userId,
      token: dbSession.token,
      expiresAt: dbSession.expiresAt,
    },
    user: dbSession.user,
  };
}

/**
 * Checks if the request comes from the internal Python AI microservice
 * using the configured internal secret key.
 */
export function isInternalServiceRequest(request) {
  const internalSecret = process.env.AI_INTERNAL_SECRET_KEY;
  if (!internalSecret) return false;

  const headerSecret = request.headers.get("x-internal-secret");
  return Boolean(headerSecret && headerSecret === internalSecret);
}
