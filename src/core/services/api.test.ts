import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

import { ApiError, buildUrl, apiFetch } from "@/core/services/api";

// Safety net for the API fetch boundary (fan-out 23, Orange tier). Every UI
// service call flows through apiFetch()/buildUrl(), so a regression here has a
// wide blast radius. These lock the browser-env contract.
//
// NOTE on environment: tests run under jsdom, so `window` is defined and the
// module resolves BASE_URL to "/api/library" (the browser branch of api.ts).
// getAuthToken() therefore returns null on the browser+/api/library path, so
// apiFetch never attaches an Authorization header here — asserted accordingly.

// Minimal Response-like stub sufficient for apiFetch's usage (ok/status/json/text).
function fakeResponse(
  body: unknown,
  init: { ok?: boolean; status?: number; statusText?: string } = {},
): Response {
  const status = init.status ?? 200;
  return {
    ok: init.ok ?? (status >= 200 && status < 300),
    status,
    statusText: init.statusText ?? "OK",
    json: async () => body,
    text: async () => (typeof body === "string" ? body : JSON.stringify(body)),
  } as unknown as Response;
}

describe("buildUrl()", () => {
  it("prefixes the browser base path", () => {
    expect(buildUrl("/apps")).toBe("/api/library/apps");
  });

  it("appends query params", () => {
    expect(buildUrl("/apps", { page: 2, limit: 10 })).toBe(
      "/api/library/apps?page=2&limit=10",
    );
  });

  it("skips undefined params but keeps 0 and empty string", () => {
    expect(buildUrl("/x", { a: undefined, b: 0, c: "" })).toBe(
      "/api/library/x?b=0&c=",
    );
  });

  it("coerces numeric params to strings", () => {
    expect(buildUrl("/x", { n: 42 })).toBe("/api/library/x?n=42");
  });

  it("url-encodes param values", () => {
    expect(buildUrl("/s", { q: "a b&c" })).toBe("/api/library/s?q=a+b%26c");
  });

  it("handles an empty path", () => {
    expect(buildUrl("")).toBe("/api/library");
  });
});

describe("ApiError", () => {
  it("is an Error carrying status/url/details", () => {
    const err = new ApiError(500, "boom", "/api/library/x", { detail: 1 });
    expect(err).toBeInstanceOf(Error);
    expect(err.name).toBe("ApiError");
    expect(err.status).toBe(500);
    expect(err.message).toBe("boom");
    expect(err.url).toBe("/api/library/x");
    expect(err.details).toEqual({ detail: 1 });
  });

  it("allows details to be omitted", () => {
    const err = new ApiError(404, "nope", "/api/library/y");
    expect(err.details).toBeUndefined();
  });
});

describe("apiFetch()", () => {
  beforeEach(() => {
    // api.ts is intentionally chatty; keep test output readable.
    vi.spyOn(console, "log").mockImplementation(() => {});
    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.spyOn(console, "warn").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it("returns parsed JSON and sends JSON content-type + credentials on success", async () => {
    const fetchMock = vi.fn().mockResolvedValue(fakeResponse({ id: 1 }));
    vi.stubGlobal("fetch", fetchMock);

    const data = await apiFetch<{ id: number }>("/api/library/thing-1");

    expect(data).toEqual({ id: 1 });
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [calledUrl, init] = fetchMock.mock.calls[0];
    expect(calledUrl).toBe("/api/library/thing-1");
    expect((init.headers as Headers).get("Content-Type")).toBe(
      "application/json",
    );
    expect(init.credentials).toBe("include");
    // Browser + /api/library branch → no Authorization attached.
    expect((init.headers as Headers).has("Authorization")).toBe(false);
  });

  it("throws ApiError with status and parsed body on a non-ok response", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        fakeResponse({ error: "nope" }, { ok: false, status: 500, statusText: "Server Error" }),
      ),
    );
    await expect(apiFetch("/api/library/err-1")).rejects.toMatchObject({
      name: "ApiError",
      status: 500,
      details: { error: "nope" },
    });
  });

  it("throws ApiError(401) and redirects to logout on unauthorized", async () => {
    const originalLocation = window.location;
    Object.defineProperty(window, "location", {
      configurable: true,
      writable: true,
      value: { href: "" },
    });
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        fakeResponse({}, { ok: false, status: 401, statusText: "Unauthorized" }),
      ),
    );

    await expect(apiFetch("/api/library/unauth-1")).rejects.toMatchObject({
      name: "ApiError",
      status: 401,
    });
    expect((window.location as { href: string }).href).toBe("/api/auth/logout");

    Object.defineProperty(window, "location", {
      configurable: true,
      writable: true,
      value: originalLocation,
    });
  });

  it("throws ApiError when an ok response has invalid JSON", async () => {
    const badJson = {
      ok: true,
      status: 200,
      statusText: "OK",
      json: async () => {
        throw new Error("Unexpected token");
      },
      text: async () => "not json",
    } as unknown as Response;
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(badJson));

    await expect(apiFetch("/api/library/badjson-1")).rejects.toMatchObject({
      name: "ApiError",
      status: 200,
    });
  });

  it("de-dupes concurrent GET requests to the same url", async () => {
    const fetchMock = vi.fn().mockResolvedValue(fakeResponse({ v: 1 }));
    vi.stubGlobal("fetch", fetchMock);
    const url = "/api/library/dedup-1";

    const [a, b] = await Promise.all([apiFetch(url), apiFetch(url)]);

    expect(a).toEqual(b);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("does NOT de-dupe non-GET requests", async () => {
    const fetchMock = vi.fn().mockResolvedValue(fakeResponse({ v: 1 }));
    vi.stubGlobal("fetch", fetchMock);
    const url = "/api/library/post-1";

    await Promise.all([
      apiFetch(url, { method: "POST" }),
      apiFetch(url, { method: "POST" }),
    ]);

    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("retries a retryable network failure, then succeeds", async () => {
    const fetchMock = vi
      .fn()
      .mockRejectedValueOnce(new Error("fetch failed"))
      .mockResolvedValueOnce(fakeResponse({ recovered: true }));
    vi.stubGlobal("fetch", fetchMock);

    const data = await apiFetch<{ recovered: boolean }>(
      "/api/library/retry-1",
      { method: "POST", retryDelay: 0, maxRetries: 2 },
    );

    expect(data).toEqual({ recovered: true });
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});
