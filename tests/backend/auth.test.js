import { describe, it, expect, afterAll } from "vitest";
import { auth } from "@/lib/auth/auth";
import { prisma } from "@/lib/db/prisma";
import { getSession } from "@/lib/auth/session";

describe("Phase 5: Authentication (Better Auth & Prisma)", () => {
  const createdUserIds = [];

  afterAll(async () => {
    if (createdUserIds.length > 0) {
      await prisma.session.deleteMany({ where: { userId: { in: createdUserIds } } });
      await prisma.account.deleteMany({ where: { userId: { in: createdUserIds } } });
      await prisma.user.deleteMany({ where: { id: { in: createdUserIds } } });
    }
    await prisma.$disconnect();
  });

  it("successfully registers a user with secure password hashing in Account table", async () => {
    const email = `vitest_auth_${Date.now()}@enterprise.io`;
    const password = "ComplexPassword99!#";

    const res = await auth.api.signUpEmail({
      body: {
        name: "Vitest User",
        email,
        password,
      },
    });

    expect(res).toBeDefined();
    expect(res.user.email).toBe(email);
    expect(res.token).toBeDefined();
    createdUserIds.push(res.user.id);

    // Verify user was stored in Neon PostgreSQL
    const dbUser = await prisma.user.findUnique({
      where: { email },
      include: { accounts: true },
    });
    expect(dbUser).toBeDefined();
    expect(dbUser.email).toBe(email);

    // Verify password is NOT stored in plaintext and is hashed in accounts table
    const account = dbUser.accounts[0];
    expect(account).toBeDefined();
    expect(account.password).not.toBe(password);
    expect(account.password.length).toBeGreaterThan(20);
  });

  it("authenticates a registered user and validates session via getSession helper", async () => {
    const email = `vitest_login_${Date.now()}@enterprise.io`;
    const password = "LoginPassword456!#";

    // 1. Sign up
    const signupRes = await auth.api.signUpEmail({
      body: {
        name: "Login Tester",
        email,
        password,
      },
    });
    createdUserIds.push(signupRes.user.id);

    // 2. Sign in
    const signinRes = await auth.api.signInEmail({
      body: {
        email,
        password,
      },
    });
    expect(signinRes).toBeDefined();
    expect(signinRes.token).toBeDefined();

    // 3. Test getSession using Bearer Authorization header
    const mockRequest = new Request("http://localhost:3000/api/projects", {
      headers: {
        Authorization: `Bearer ${signinRes.token}`,
      },
    });

    const sessionData = await getSession(mockRequest);
    expect(sessionData).toBeDefined();
    expect(sessionData.user.email).toBe(email);
    expect(sessionData.session.token).toBe(signinRes.token);
  });

  it("rejects authentication for incorrect password", async () => {
    const email = `vitest_fail_${Date.now()}@enterprise.io`;
    const password = "CorrectPassword123!";

    const signupRes = await auth.api.signUpEmail({
      body: {
        name: "Fail Tester",
        email,
        password,
      },
    });
    createdUserIds.push(signupRes.user.id);

    await expect(
      auth.api.signInEmail({
        body: {
          email,
          password: "WrongPassword999!",
        },
      })
    ).rejects.toThrow();
  });
});
