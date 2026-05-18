<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## Vercel Blob CDN Consistency (CRITICAL)

`@vercel/blob` `put()` + `head()` + CDN `fetch()` has an **eventual consistency** problem. The CDN edge may serve **stale content** for up to ~5 seconds after a successful `put()`. This caused data to appear "reset to defaults" on page refresh.

**Solution in `src/lib/store.ts`:**
- Module-level `cachedData: SiteData | null` — immediately updated on every write
- `readFromBlob()` returns `cachedData` if non-null (hits CDN only on cold start)
- `writeToBlob()` sets `cachedData = data` immediately after `put()` completes
- `getData()` checks `head()` before writing defaults — avoids overwriting user data on transient CDN read failure

**Do NOT use `list()`** for reading — it's eventually consistent too.
**`head()` is strongly consistent** — use it for blob existence checks.
**`?t=${Date.now()}` cache-buster does NOT bypass Vercel CDN edge** — only helps browser cache.

## Auth Token CDN Issue

First-time login needed multiple retries because blob-written tokens weren't visible to `readFromBlob()` immediately. Fixed with in-memory `tokenCache` Map in `src/lib/auth.ts`.

## Admin ColorsSection Performance

Avoid saving individual color fields — Vercel Blob `put()` is slow (~300-500ms per call). Batch all 8 color changes into a single `saveAll()` call with 500ms debounce.

## Messages Polling

Keep interval at 8s (not 3s) to avoid excessive blob reads.
