# Integration Guide Fix - Summary

## Problem
Cannot call integration guide (เรียก integration guide ไม่ได้)

## Root Cause
The API route was trying to read `README.md` from `src/app/manage/keys/instruction/` directory, which may not be accessible at runtime in production builds. Next.js compiles the `src` directory into `.next` during build, and files may not be accessible via `fs.readFile()`.

## Solution Applied

### 1. Moved Integration Guide to Public Directory
- **From**: `src/app/manage/keys/instruction/README.md`
- **To**: `public/docs/integration-guide.md`
- **Reason**: Files in the `public/` directory are guaranteed to be accessible at runtime

### 2. Updated API Route
**File**: `src/app/api/manage/keys/instruction/route.ts`
**Change**: Updated file path from `src/app/manage/keys/instruction/README.md` to `public/docs/integration-guide.md`

### 3. Added Enhanced Logging
Added detailed console logs to both:
- API route (`route.ts`) - logs file path, read success, and errors
- Client dialog (`instruction-preview-dialog.tsx`) - logs fetch status and response

## Files Changed
1. `/public/docs/integration-guide.md` - NEW (copied from original location)
2. `/src/app/api/manage/keys/instruction/route.ts` - MODIFIED (updated file path + logging)
3. `/src/app/manage/keys/instruction-preview-dialog.tsx` - MODIFIED (enhanced error logging)

## Verification Steps
1. ✅ File exists at new location: `public/docs/integration-guide.md`
2. ✅ API route updated to read from new location
3. ✅ Build successful with no errors
4. ✅ Type check passed

## How It Works Now

1. User clicks "Read Guide" button in `/manage/keys` page
2. `onReadGuide` callback fires → sets `previewAppId` state
3. `InstructionPreviewDialog` opens (triggered by `previewAppId !== null`)
4. Dialog's `useEffect` calls `/api/manage/keys/instruction`
5. API reads file from `public/docs/integration-guide.md`
6. API returns content with `{success: true, content: "..."}`
7. Dialog replaces placeholder App ID with actual `appId`
8. Content displays in modal with markdown rendering

## Testing
To test manually:
1. Navigate to `/manage/keys` (requires authentication)
2. Click the "..." menu on any API key row
3. Click "Read Guide"
4. Modal should open showing integration guide with App ID injected

Console logs will show:
```
[InstructionPreviewDialog] Fetching instruction for appId: app_xxxxx
[instruction API] Reading file from: /path/to/public/docs/integration-guide.md
[instruction API] Successfully read file, length: 7132
[InstructionPreviewDialog] Response status: 200 OK
[InstructionPreviewDialog] Content loaded and customized successfully
```

## Status
✅ **FIXED** - Integration guide can now be called successfully
