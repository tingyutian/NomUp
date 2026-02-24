# Inconsistent Error Response Format Across API Endpoints

**Type:** Tech Debt
**Priority:** Medium
**Effort:** Small

## TL;DR

Server error responses mix `{ error: "..." }` and `{ message: "..." }` formats. This makes client-side error handling fragile — code that checks `data.error` will miss errors returned as `data.message`.

## Current Behavior

Some endpoints return:
```json
{ "error": "Recipe not found" }
```

Others return:
```json
{ "message": "Internal server error" }
```

No consistent standard across `server/routes.ts`.

## Expected Behavior

All error responses should use a single format: `{ "error": "..." }`. Success responses can optionally include a `message` field, but errors should always use `error`.

## Relevant Files

- `server/routes.ts` — all error `res.json()` calls

## Risk / Notes

- Low effort: a find-and-replace pass through `routes.ts`
- Client SDK callers should also be audited to ensure they check the right key
