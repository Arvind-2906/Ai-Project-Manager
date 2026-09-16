import { betterAuth } from "better-auth";
import { prisma } from "@/lib/db/prisma";

export const auth = betterAuth({
  database: {
    provider: "postgresql",
    url: process.env.DATABASE_URL,
  },
  secret: process.env.BETTER_AUTH_SECRET || "default-secret-key-change-in-production-min32",
  baseURL: process.env.BETTER_AUTH_URL || "http://localhost:3000",
  emailAndPassword: {
    enabled: true,
    autoSignIn: true,
  },
});
