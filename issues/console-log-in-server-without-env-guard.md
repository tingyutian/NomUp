# console.log Statements in Server Without NODE_ENV Guard

**Type:** Tech Debt
**Priority:** Low
**Effort:** Small

## TL;DR

The server (`server/routes.ts` and `server/index.ts`) contains numerous `console.log` statements with no environment guard. In production, these flood logs with debug-level noise, making it harder to spot real errors.

## Current Behavior

Throughout `server/routes.ts` (lines 97, 156–157, 178, 184, 219, 262, 371, 458, 603, etc.):

```ts
console.log("Received scan receipt request");
console.log("Gemini response:", response.status);
```

Always runs regardless of `NODE_ENV`.

## Expected Behavior

Either:
1. Wrap dev logs with `if (process.env.NODE_ENV !== 'production') console.log(...)`
2. Replace with a structured logger (e.g., `pino`, `winston`) that respects log levels

## Relevant Files

- `server/routes.ts` — multiple locations
- `server/index.ts` — startup logs

## Risk / Notes

- Not a functional bug, but degrades production observability
- A structured logger would also make log aggregation (e.g., Datadog, Logtail) easier
