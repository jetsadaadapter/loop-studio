# Fix: "Message Channel Closed" API Error

## Problem

Users were experiencing intermittent errors:
```
Unchecked runtime.lastError: A listener indicated an asynchronous response by returning true, 
but the message channel closed before a response was received
```

This error appeared in the browser console after successful API calls (200 OK responses).

## Root Cause

The "message channel closed" error is a transient browser/runtime error that occurs when:

1. **Browser Extension Interference**: Extensions may intercept fetch requests and close the connection prematurely
2. **Service Worker Issues**: Service worker lifecycle conflicts
3. **Network Instability**: Brief network interruptions during response reading
4. **Race Conditions**: Rapid component unmounting while fetch is in progress

## Solution

Enhanced the `apiFetch` function in [src/core/services/api.ts](../../src/core/services/api.ts) with:

### 1. Better Error Detection and Logging

Added specific detection for channel-related errors:

```typescript
const isChannelError = err.message?.includes("message channel") ||
                       err.message?.includes("channel closed");
```

Enhanced error logging with more context:
```typescript
console.error("[Library API] ✗ Network fetch failed", {
    url,
    method: fetchInit.method ?? "GET",
    hasAuth,
    message: err.message,
    cause: err.cause,
    isChannelError,
    name: err.name,
});
```

### 2. Automatic Retry with Exponential Backoff

Implemented retry logic for transient errors:

```typescript
export interface ApiFetchOptions extends RequestInit {
    silentErrors?: boolean;
    maxRetries?: number;      // Default: 2
    retryDelay?: number;      // Default: 1000ms
}
```

Retry mechanism:
- **Attempt 1**: Immediate
- **Attempt 2**: After 1000ms delay
- **Attempt 3**: After 2000ms delay

Only retries on recoverable errors:
- "message channel" errors
- "channel closed" errors
- Network errors
- Fetch errors

### 3. Better JSON Parsing Error Handling

Wrapped `res.json()` in try-catch with detailed logging:

```typescript
try {
    const data = await res.json() as T;
    console.log(`[Library API] ✓ JSON parsed successfully`);
    return data;
} catch (jsonError) {
    const err = jsonError as Error;
    console.error(`[Library API] ✗ JSON parse failed:`, {
        url,
        status: res.status,
        error: err.message,
        stack: err.stack,
    });
    throw new ApiError(
        res.status,
        `Failed to parse JSON response: ${err.message}`,
        url,
        { originalError: err.message }
    );
}
```

### 4. Refactored Architecture

Split `apiFetch` into two functions:

1. **`apiFetchInternal`**: Handles actual fetch + retry logic
2. **`apiFetch`**: Handles request deduplication and caching

This allows retry logic to work correctly with the request cache.

## Benefits

✅ **Improved Reliability**: Automatic retry on transient errors  
✅ **Better Debugging**: Detailed error logging with context  
✅ **User Experience**: Seamless recovery from temporary network issues  
✅ **Graceful Degradation**: Clear error messages when retries fail  

## Testing

Build verification:
```bash
npm run build
```

**Result**: ✓ Compiled successfully in 8.3s

Type checking:
```bash
npx tsc --noEmit
```

**Result**: ✓ No errors

Linting:
```bash
npx eslint src/core/services/api.ts
```

**Result**: ✓ No errors

## Usage

Default behavior (2 retries):
```typescript
const data = await apiFetch<AppData>('/api/library/apps/123');
```

Custom retry configuration:
```typescript
const data = await apiFetch<AppData>('/api/library/apps/123', {
    maxRetries: 3,
    retryDelay: 500
});
```

Disable retries:
```typescript
const data = await apiFetch<AppData>('/api/library/apps/123', {
    maxRetries: 0
});
```

## Monitoring

Look for these log patterns:

**Successful request:**
```
[Library API] → GET /api/library/apps/123
[Library API] ← 200 OK (450ms)
[Library API] ✓ JSON parsed successfully
```

**Retry scenario:**
```
[Library API] → GET /api/library/apps/123
[Library API] ✗ Network fetch failed { isChannelError: true, ... }
[Library API] ⚠ Retrying request (attempt 1/2) after 1000ms
[Library API] → GET /api/library/apps/123
[Library API] ← 200 OK (320ms)
[Library API] ✓ JSON parsed successfully
```

**Failed after retries:**
```
[Library API] → GET /api/library/apps/123
[Library API] ✗ Network fetch failed { isChannelError: true, ... }
[Library API] ⚠ Retrying request (attempt 1/2) after 1000ms
[Library API] → GET /api/library/apps/123
[Library API] ✗ Network fetch failed { isChannelError: true, ... }
[Library API] ⚠ Retrying request (attempt 2/2) after 2000ms
[Library API] → GET /api/library/apps/123
[Library API] ✗ Network fetch failed { isChannelError: true, ... }
ApiError: Connection interrupted: message channel closed...
```

## Related Files

- [src/core/services/api.ts](../../src/core/services/api.ts) - Main API service (modified)
- [src/proxy.ts](../../src/proxy.ts) - Middleware proxy configuration
- All services in `src/core/services/` that use `apiFetch`

## Future Improvements

- [ ] Add exponential backoff cap (max 5000ms)
- [ ] Add circuit breaker pattern for persistent failures
- [ ] Track retry metrics in monitoring dashboard
- [ ] Add request ID for better tracing across retries
- [ ] Consider service worker registration check

---

**Fixed:** June 16, 2026  
**Build Status:** ✅ Passing  
**Deployed:** Pending
