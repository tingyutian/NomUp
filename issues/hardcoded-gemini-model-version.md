# Hardcoded Gemini Model Version Will Break on Deprecation

**Type:** Bug / Reliability
**Priority:** High
**Effort:** Small

## TL;DR

The Gemini model is hardcoded as `"gemini-3-flash-preview"` in the server. When Google deprecates preview models (which happens frequently), the entire AI feature will break in production with no fallback.

## Current Behavior

```ts
// server/routes.ts line 17
const GEMINI_MODEL = "gemini-3-flash-preview";
```

No environment override, no fallback, no graceful degradation.

## Expected Behavior

The model should be configurable via environment variable with a sensible default:

```ts
const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-2.0-flash";
```

## Relevant Files

- `server/routes.ts` — line 17

## Risk / Notes

- Preview models are often deprecated with short notice
- Changing to a GA model as the default also improves stability
