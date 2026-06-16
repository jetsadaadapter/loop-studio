import { cookies } from "next/headers";
import { type NextRequest, NextResponse } from "next/server";

const TOKEN_COOKIE_KEY = "zt_token";

const ALLOWED_HOSTS = [
  /(^|\.)fbcdn\.net$/,
  /(^|\.)facebook\.com$/,
  /(^|\.)akamaihd\.net$/,
];

function isAllowedUrl(urlStr: string): boolean {
  try {
    const url = new URL(urlStr);
    if (url.protocol !== "http:" && url.protocol !== "https:") {
      return false;
    }
    const hostname = url.hostname.toLowerCase();
    return ALLOWED_HOSTS.some((pattern) => pattern.test(hostname));
  } catch {
    return false;
  }
}

export async function GET(request: NextRequest) {
  // 1. Authenticate using zt_token cookie
  const token = (await cookies()).get(TOKEN_COOKIE_KEY)?.value;
  if (!token) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  // 2. Extract and validate target URL
  const { searchParams } = new URL(request.url);
  const targetUrl = searchParams.get("url");

  if (!targetUrl) {
    return NextResponse.json({ message: "Missing url parameter" }, { status: 400 });
  }

  if (!isAllowedUrl(targetUrl)) {
    return NextResponse.json({ message: "Forbidden target URL" }, { status: 403 });
  }

  try {
    const headers = new Headers();
    headers.set(
      "User-Agent",
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    );
    headers.set("Accept", "image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8");
    headers.set("Referer", "https://www.facebook.com/");

    const response = await fetch(targetUrl, {
      method: "GET",
      headers,
      cache: "no-store",
    });

    if (!response.ok) {
      return NextResponse.json(
        { message: `Failed to fetch image: ${response.statusText}` },
        { status: response.status }
      );
    }

    const contentType = response.headers.get("content-type") || "image/jpeg";
    const cacheControl = response.headers.get("cache-control") || "public, max-age=86400";

    const imageHeaders = new Headers();
    imageHeaders.set("Content-Type", contentType);
    imageHeaders.set("Cache-Control", cacheControl);

    return new NextResponse(response.body, {
      status: response.status,
      headers: imageHeaders,
    });
  } catch (error) {
    console.error("Image proxy error:", error);
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}
