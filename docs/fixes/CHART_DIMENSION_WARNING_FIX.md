# Fix: Chart Dimension Warning (width/height -1)

## Problem

Recharts was throwing warnings:
```
The width(-1) and height(-1) of chart should be greater than 0,
please check the style of container, or the props width(100%) and height(100%),
or add a minWidth(0) or minHeight(undefined) or use aspect(undefined) to control
the height and width.
```

This warning appeared when rendering pie charts in the dynamic layout visualizer.

## Root Cause

The `ResponsiveContainer` component from Recharts was not receiving proper dimensions during initial render, causing it to calculate dimensions as `-1`.

This occurs because:
1. The container uses percentage-based sizing (`width="100%" height="100%"`)
2. Parent container may not have explicit dimensions during SSR/initial hydration
3. ResponsiveContainer needs explicit minimum dimensions as a fallback

## Solution

Added `minWidth` and `minHeight` props to `ResponsiveContainer` in [pie-chart-renderer.tsx](../../src/components/dynamic-layout-visualizer/renderers/pie-chart-renderer.tsx):

### Before:
```tsx
<ResponsiveContainer width="100%" height="100%">
  <PieChart>
    {/* ... */}
  </PieChart>
</ResponsiveContainer>
```

### After:
```tsx
<ResponsiveContainer width="100%" height="100%" minWidth={160} minHeight={160}>
  <PieChart width={192} height={192}>
    {/* ... */}
  </PieChart>
</ResponsiveContainer>
```

### Key Changes:

1. **Added `minWidth={160}` and `minHeight={160}`**
   - Provides fallback dimensions when container size cannot be determined
   - Matches the parent container's size class `size-40 sm:size-48` (160px-192px)

2. **Added explicit dimensions to PieChart**
   - `width={192}` and `height={192}` for consistent rendering
   - Matches the larger breakpoint size

## Why This Works

The warning occurs during the initial render phase when:
- React is hydrating the component
- CSS hasn't fully computed container dimensions yet
- ResponsiveContainer queries parent dimensions and gets `0` or `undefined`

By providing `minWidth` and `minHeight`, we ensure:
- ✅ Recharts always has valid dimensions (never `-1`)
- ✅ Chart renders correctly during SSR/hydration
- ✅ ResponsiveContainer can still grow to fill available space
- ✅ No layout shift after hydration

## Related Components

Only one chart component uses Recharts in the codebase:
- ✅ **pie-chart-renderer.tsx** - Fixed

Other chart components:
- **bar-chart-renderer.tsx** - Uses native CSS (no Recharts) - No changes needed

## Testing

Lint check:
```bash
npx eslint src/components/dynamic-layout-visualizer/renderers/pie-chart-renderer.tsx
```
**Result**: ✓ No errors

Type check:
```bash
npx tsc --noEmit
```
**Result**: ✓ No errors

Build verification:
```bash
npm run build
```
**Result**: ✓ Compiled successfully in 7.4s

## Expected Behavior

### Before Fix:
- ⚠️ Console warning about `-1` dimensions
- ⚠️ Possible flash of empty chart during hydration
- ⚠️ Potential layout shift

### After Fix:
- ✅ No dimension warnings
- ✅ Smooth chart rendering from first paint
- ✅ Stable layout (no CLS)

## Verification

To verify the fix in the browser:
1. Open DevTools Console
2. Navigate to a page with pie charts (e.g., tool results with Facebook Analyst)
3. Check console - should see no Recharts warnings
4. Observe chart renders immediately without layout shift

## Best Practices for Recharts

When using `ResponsiveContainer`:

1. **Always provide minWidth/minHeight**
   ```tsx
   <ResponsiveContainer width="100%" height="100%" minWidth={200} minHeight={200}>
   ```

2. **Match parent container sizing**
   ```tsx
   <div className="size-48"> {/* 192px */}
     <ResponsiveContainer minWidth={192} minHeight={192}>
   ```

3. **Use aspect ratio for responsive charts**
   ```tsx
   <ResponsiveContainer width="100%" aspect={16/9}>
   ```

4. **Provide explicit chart dimensions as backup**
   ```tsx
   <ResponsiveContainer minWidth={300} minHeight={200}>
     <PieChart width={300} height={200}>
   ```

## Related Files

- [src/components/dynamic-layout-visualizer/renderers/pie-chart-renderer.tsx](../../src/components/dynamic-layout-visualizer/renderers/pie-chart-renderer.tsx) - Fixed
- [src/components/dynamic-layout-visualizer/renderers/bar-chart-renderer.tsx](../../src/components/dynamic-layout-visualizer/renderers/bar-chart-renderer.tsx) - No changes needed (native CSS)

## References

- [Recharts ResponsiveContainer Documentation](https://recharts.org/en-US/api/ResponsiveContainer)
- [Next.js Hydration Best Practices](https://nextjs.org/docs/messages/react-hydration-error)

---

**Fixed:** June 16, 2026  
**Build Status:** ✅ Passing  
**Impact:** Low (warning only, no functional issues)
