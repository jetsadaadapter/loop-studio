import { describe, it, expect } from "vitest";

import { authOptions } from "@/lib/auth";

// Safety net for the NextAuth config (Yellow/Green tier — logic-bearing, and
// security-adjacent per LOOP-ENGINEERING.md Stage 5). The real logic lives in the
// callbacks: the signIn domain gate, the jwt role stamp, and the session role copy.

// Resolve the allowed domain exactly as auth.ts does, so the test adapts to whatever
// ALLOWED_EMAIL_DOMAIN is configured in the environment (defaults to "@company.com").
const ALLOWED_DOMAIN = process.env.ALLOWED_EMAIL_DOMAIN ?? "@company.com";

const callbacks = authOptions.callbacks!;
type SignInArg = Parameters<NonNullable<typeof callbacks.signIn>>[0];
type JwtArg = Parameters<NonNullable<typeof callbacks.jwt>>[0];
type SessionArg = Parameters<NonNullable<typeof callbacks.session>>[0];

describe("authOptions.signIn (domain gate)", () => {
  it("allows an email on the allowed domain", async () => {
    const ok = await callbacks.signIn!({
      user: { email: `alice${ALLOWED_DOMAIN}` },
    } as unknown as SignInArg);
    expect(ok).toBe(true);
  });

  it("rejects an email on a different domain", async () => {
    const ok = await callbacks.signIn!({
      user: { email: "mallory@not-the-allowed-domain.example" },
    } as unknown as SignInArg);
    expect(ok).toBe(false);
  });

  it("rejects when the email is missing", async () => {
    const ok = await callbacks.signIn!({
      user: {},
    } as unknown as SignInArg);
    expect(ok).toBe(false);
  });
});

describe("authOptions.jwt (role stamp)", () => {
  it("stamps role=user on first sign-in (user present)", async () => {
    const token = await callbacks.jwt!({
      token: {},
      user: { email: `a${ALLOWED_DOMAIN}` },
    } as unknown as JwtArg);
    expect((token as { role?: string }).role).toBe("user");
  });

  it("leaves the token unchanged on subsequent calls (no user)", async () => {
    const token = await callbacks.jwt!({
      token: { role: "user" },
    } as unknown as JwtArg);
    expect((token as { role?: string }).role).toBe("user");
  });
});

describe("authOptions.session (role copy)", () => {
  it("copies the token role onto session.user", async () => {
    const session = await callbacks.session!({
      session: { user: { email: "x" } },
      token: { role: "admin" },
    } as unknown as SessionArg);
    expect((session.user as { role?: string }).role).toBe("admin");
  });
});

describe("authOptions config", () => {
  it("uses a short-lived jwt session", () => {
    expect(authOptions.session?.strategy).toBe("jwt");
    expect(authOptions.session?.maxAge).toBe(60 * 60);
  });

  it("routes sign-in and error to /login", () => {
    expect(authOptions.pages?.signIn).toBe("/login");
    expect(authOptions.pages?.error).toBe("/login");
  });
});
