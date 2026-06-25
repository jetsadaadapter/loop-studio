import { cookies } from "next/headers";
import { type NextRequest, NextResponse } from "next/server";

const TOKEN_COOKIE_KEY = "zt_token";

const UPSTREAM_BASE_URL =
    process.env.SERVER_API_BASE_URL || process.env.NEXT_PUBLIC_STORE_API_BASE_URL;

function buildUpstreamUrl(baseUrl: string, path: string[], search: string): string {
    const base = baseUrl.endsWith("/")
        ? baseUrl.slice(0, -1)
        : baseUrl;
    const pathname = path.join("/");

    return `${base}/${pathname}${search}`;
}

function removeApiSuffix(baseUrl: string): string {
    return baseUrl.replace(/\/api\/?$/i, "");
}

function getPrimaryAndFallbackUrls(path: string[], search: string): {
    primaryUrl: string;
    fallbackUrl?: string;
} {
    if (!UPSTREAM_BASE_URL) {
        throw new Error("Missing SERVER_API_BASE_URL or NEXT_PUBLIC_STORE_API_BASE_URL");
    }

    const primaryUrl = buildUpstreamUrl(UPSTREAM_BASE_URL, path, search);
    const baseWithoutApi = removeApiSuffix(UPSTREAM_BASE_URL);

    if (baseWithoutApi !== UPSTREAM_BASE_URL) {
        return {
            primaryUrl,
            fallbackUrl: buildUpstreamUrl(baseWithoutApi, path, search),
        };
    }

    return { primaryUrl };
}

function copyResponseHeaders(source: Headers): Headers {
    const headers = new Headers();

    source.forEach((value, key) => {
        if (key.toLowerCase() === "content-encoding") return;
        headers.set(key, value);
    });

    return headers;
}

async function proxyToLibraryApi(
    req: NextRequest,
    context: { params: Promise<{ path: string[] }> },
): Promise<NextResponse> {
    const token = (await cookies()).get(TOKEN_COOKIE_KEY)?.value;

    if (!token) {
        return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { path } = await context.params;
    const pathStr = path.join("/");

    if (pathStr === "access/menus") {
        return NextResponse.json({
            success: true,
            message: "Menus fetched successfully",
            data: [
                {
                    name: "Dashboard",
                    path: "/",
                    icon: "LayoutDashboard",
                    type: "main"
                },
                {
                    name: "Projects",
                    path: "/projects",
                    icon: "Layers",
                    type: "main"
                },
                {
                    name: "API Keys",
                    path: "/keys",
                    icon: "KeySquare",
                    type: "developer"
                },
                {
                    name: "API Reference",
                    path: "/docs",
                    icon: "BookOpen",
                    type: "developer"
                },
                {
                    name: "Models",
                    path: "/manage/models",
                    icon: "Bot",
                    type: "manage"
                },
                {
                    name: "Prompts",
                    path: "/manage/prompts",
                    icon: "SquareTerminal",
                    type: "manage"
                },
                {
                    name: "Apps",
                    path: "/manage/apps",
                    icon: "LayoutGrid",
                    type: "manage"
                },
                {
                    name: "Banners",
                    path: "/manage/banners",
                    icon: "LayoutList",
                    type: "manage"
                },
                {
                    name: "Categories",
                    path: "/manage/categories",
                    icon: "FolderClosed",
                    type: "manage"
                },
                {
                    name: "Tags",
                    path: "/manage/tags",
                    icon: "Tag",
                    type: "manage"
                },
                {
                    name: "Tools",
                    path: "/manage/tools",
                    icon: "ToolCase",
                    type: "manage"
                },
                {
                    name: "Users",
                    path: "/manage/users",
                    icon: "Users",
                    type: "manage"
                }
            ]
        });
    }

    const { primaryUrl, fallbackUrl } = getPrimaryAndFallbackUrls(path, req.nextUrl.search);

    const headers = new Headers();
    const passthroughHeaders = [
        "accept",
        "content-type",
        "user-agent",
    ] as const;

    for (const key of passthroughHeaders) {
        const value = req.headers.get(key);
        if (value) {
            headers.set(key, value);
        }
    }

    headers.set("Authorization", `Bearer ${token}`);

    const hasBody = req.method !== "GET" && req.method !== "HEAD";
    const body = hasBody ? await req.arrayBuffer() : undefined;

    let upstreamResponse = await fetch(primaryUrl, {
        method: req.method,
        headers,
        body,
        cache: "no-store",
    });

    // Some environments expose endpoints without the /api prefix.
    if (upstreamResponse.status === 404 && fallbackUrl) {
        upstreamResponse = await fetch(fallbackUrl, {
            method: req.method,
            headers,
            body,
            cache: "no-store",
        });
    }

    const isKeysEndpoint = pathStr === "keys" || pathStr.startsWith("keys/");

    if (upstreamResponse.status === 404 && isKeysEndpoint) {
        return NextResponse.json({
            success: false,
            fallback: true,
            message: "Keys endpoint not found on upstream, proxy falling back",
        }, { status: 200 });
    }

    return new NextResponse(upstreamResponse.body, {
        status: upstreamResponse.status,
        headers: copyResponseHeaders(upstreamResponse.headers),
    });
}

export async function GET(
    req: NextRequest,
    context: { params: Promise<{ path: string[] }> },
) {
    return proxyToLibraryApi(req, context);
}

export async function POST(
    req: NextRequest,
    context: { params: Promise<{ path: string[] }> },
) {
    return proxyToLibraryApi(req, context);
}

export async function PATCH(
    req: NextRequest,
    context: { params: Promise<{ path: string[] }> },
) {
    return proxyToLibraryApi(req, context);
}

export async function PUT(
    req: NextRequest,
    context: { params: Promise<{ path: string[] }> },
) {
    return proxyToLibraryApi(req, context);
}

export async function DELETE(
    req: NextRequest,
    context: { params: Promise<{ path: string[] }> },
) {
    return proxyToLibraryApi(req, context);
}
