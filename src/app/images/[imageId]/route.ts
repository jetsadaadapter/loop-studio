import { type NextRequest, NextResponse } from "next/server";

function buildProxyTargetUrl(request: NextRequest, imageId: string): URL {
    const target = new URL(`/api/library/images/${encodeURIComponent(imageId)}`, request.url);
    target.search = request.nextUrl.search;
    return target;
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
    const target = buildProxyTargetUrl(request, imageId);

    const upstream = await fetch(target, {
        method: request.method,
        headers: {
            accept: request.headers.get("accept") ?? "*/*",
            cookie: request.headers.get("cookie") ?? "",
        },
        cache: "no-store",
        redirect: "follow",
    });

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
