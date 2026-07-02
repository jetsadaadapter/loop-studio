import { NextRequest, NextResponse } from "next/server";
import { ApiError } from "@/core/services/api";
import { getUserProfile } from "@/core/services/users.service";

const TOKEN_COOKIE = "zt_token";

export async function POST(request: NextRequest) {
  const existingToken = request.cookies.get(TOKEN_COOKIE)?.value;

  if (!existingToken) {
    return NextResponse.json({ success: false, error: "Not authenticated" }, { status: 401 });
  }

  // zt_token is an opaque token issued by the Zero Trust provider — this app has no
  // local key to verify it, so "refresh" means confirming it still works against the
  // real backend (getAuthToken() picks it up from this request's cookies) before
  // extending the cookie's lifetime. Never mint a new token value locally.
  try {
    await getUserProfile();
  } catch (error) {
    if (error instanceof ApiError && (error.status === 401 || error.status === 403)) {
      return NextResponse.json({ success: false, error: "Session expired" }, { status: 401 });
    }
    throw error;
  }

  const response = NextResponse.json({ success: true });
  response.cookies.set(TOKEN_COOKIE, existingToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60, // 1 hour
    path: "/",
  });

  return response;
}