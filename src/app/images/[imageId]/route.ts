import { cookies } from "next/headers";
import { type NextRequest, NextResponse } from "next/server";

const TOKEN_COOKIE_KEY = "zt_token";

const UPSTREAM_BASE_URL =
    process.env.SERVER_API_BASE_URL || process.env.NEXT_PUBLIC_STORE_API_BASE_URL;

function getPrimaryAndFallbackUrls(imageId: string): {
    primaryUrl: string;
    fallbackUrl?: string;
} {
    if (!UPSTREAM_BASE_URL) {
        throw new Error("Missing SERVER_API_BASE_URL or NEXT_PUBLIC_STORE_API_BASE_URL");
    }

    const base = UPSTREAM_BASE_URL.endsWith("/")
        ? UPSTREAM_BASE_URL.slice(0, -1)
        : UPSTREAM_BASE_URL;

    const primaryUrl = `${base}/images/${encodeURIComponent(imageId)}`;
    const baseWithoutApi = base.replace(/\/api\/?$/i, "");

    if (baseWithoutApi !== base) {
        return {
            primaryUrl,
            fallbackUrl: `${baseWithoutApi}/images/${encodeURIComponent(imageId)}`,
        };
    }

    return { primaryUrl };
}

function copyImageHeaders(source: Headers): Headers {
    const headers = new Headers();
    const allowed = [
        "cache-control",
        "content-disposition",
        "content-length",
        "content-type",
        "etag",
        "last-modified",
        "vary",
    ];

    for (const key of allowed) {
        const value = source.get(key);
        if (value) {
            headers.set(key, value);
        }
    }

    return headers;
}

async function proxyImage(
    request: NextRequest,
    context: { params: Promise<{ imageId: string }> },
): Promise<NextResponse> {
    const { imageId } = await context.params;

    // Get the auth token from cookies
    const token = (await cookies()).get(TOKEN_COOKIE_KEY)?.value;
    if (!token) {
        return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { primaryUrl, fallbackUrl } = getPrimaryAndFallbackUrls(imageId);

    const headers = new Headers();
    headers.set("Authorization", `Bearer ${token}`);
    const accept = request.headers.get("accept");
    if (accept) {
        headers.set("accept", accept);
    }

    let upstream = await fetch(primaryUrl, {
        method: request.method,
        headers,
        cache: "no-store",
        redirect: "follow",
    });

    if (upstream.status === 404 && fallbackUrl) {
        upstream = await fetch(fallbackUrl, {
            method: request.method,
            headers,
            cache: "no-store",
            redirect: "follow",
        });
    }

    return new NextResponse(upstream.body, {
        status: upstream.status,
        headers: copyImageHeaders(upstream.headers),
    });
}

export async function GET(
    request: NextRequest,
    context: { params: Promise<{ imageId: string }> },
) {
    return proxyImage(request, context);
}

export async function HEAD(
    request: NextRequest,
    context: { params: Promise<{ imageId: string }> },
) {
    return proxyImage(request, context);
}
