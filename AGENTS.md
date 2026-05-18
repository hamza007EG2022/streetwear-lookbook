<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## Vercel Blob CDN Consistency (CRITICAL)

`@vercel/blob` `put()` + `head()` + CDN `fetch()` has an **eventual consistency** problem. The CDN edge may serve **stale content** for up to ~5 seconds after a successful `put()`. This causes MULTIPLE bugs:

1. **Login wipes all data** — login route sees empty `adminPassword` (CDN stale), treats as first-time setup, calls `saveData()` → overwrites entire blob with defaults. This deletes messages, products, lookbook, everything.
2. **Password resets** — password hash saved but CDN returns old hash on next login.
3. **Messages vanish** — lost during any of the above overwrites.
4. **Brand/hero/logo changes lost** — overwritten by a stale read + save from another operation.

**Fixes applied:**
- `login/route.ts`: Before first-time setup, calls `blobExists()` from store.ts. If blob exists but `adminPassword` is empty, returns **503** (retry) instead of overwriting.
- `data/route.ts` (PUT): After password change, calls `verifyPasswordWrite()` which retries CDN reads up to 5×1s until the new hash is verified. Only returns success after propagation.
- `store.ts`: Added `_updatedAt` timestamp to all data writes for staleness detection.
- `store.ts`: `readFromBlob()` retries up to 3×1s on cold start when `cachedData` is null.
- `store.ts`: `writeToBlob()` immediately sets `cachedData` so same-instance reads are never stale.

**Key rules:**
- Do NOT use `list()` — it's eventually consistent.
- `head()` IS strongly consistent — use it for blob existence checks.
- `?t=${Date.now()}` does NOT bypass Vercel CDN edge cache — only helps browser cache.
- Module-level `cachedData` is the ONLY reliable way to get fresh data.
- For critical writes (password), always verify by re-reading with retry.

## Admin ColorsSection Performance

Avoid saving individual color fields — Vercel Blob `put()` is slow (~300-500ms per call). Batch all 8 color changes into a single `saveAll()` call with 500ms debounce.

## Messages Polling

Keep interval at 8s (not 3s) to avoid excessive blob reads.
