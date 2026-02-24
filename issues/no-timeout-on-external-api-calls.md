# No Timeout on External API Calls (Gemini & TheMealDB)

**Type:** Bug / Reliability
**Priority:** High
**Effort:** Small

## TL;DR

`fetch()` calls to Gemini and TheMealDB have no timeout. If either service is slow or unresponsive, the request hangs indefinitely, blocking the user and potentially exhausting server connections.

## Current Behavior

```ts
// server/routes.ts lines 251, 320, 445, 461
const response = await fetch(url); // no timeout
```

## Expected Behavior

Every external fetch should have an `AbortController` timeout (e.g., 30 seconds):

```ts
const controller = new AbortController();
const timeout = setTimeout(() => controller.abort(), 30_000);
const response = await fetch(url, { signal: controller.signal });
clearTimeout(timeout);
```

## Relevant Files

- `server/routes.ts` — lines 251 (Gemini scan), 320 (Gemini analyze), 445 (TheMealDB search), 461 (TheMealDB lookup)

## Risk / Notes

- Without timeouts, a single slow upstream call ties up a server thread
- Node's default `fetch` has no built-in timeout
