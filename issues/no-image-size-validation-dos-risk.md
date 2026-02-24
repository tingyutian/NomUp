# No Image Size Validation on API Endpoints (DoS Risk)

**Type:** Bug / Security
**Priority:** Critical
**Effort:** Small

## TL;DR

The `scan-receipt` and `analyze-food` endpoints accept a raw `imageBase64` string from the client with no size or format validation. A malicious client could send a multi-gigabyte payload, exhausting server memory and causing a denial of service.

## Current Behavior

In `server/routes.ts` lines 225–229 and 303–306:

```ts
const { imageBase64 } = req.body;
// immediately forwarded to Gemini API with no validation
```

No size check, no MIME type check, no content validation.

## Expected Behavior

Reject payloads exceeding a reasonable size limit (e.g., 5 MB for a Base64-encoded image) before processing:

```ts
if (!imageBase64 || imageBase64.length > 5_000_000) {
  return res.status(413).json({ error: "Image too large or missing" });
}
```

## Relevant Files

- `server/routes.ts` — lines 225–229 (`/scan-receipt`), lines 303–306 (`/analyze-food`)

## Risk / Notes

- CRITICAL security/availability risk in production
- Also consider adding `express-rate-limit` to these endpoints to limit per-user abuse
