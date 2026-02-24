# AI JSON Response Not Validated Before Mapping

**Type:** Bug
**Priority:** High
**Effort:** Small

## TL;DR

After parsing the JSON response from Gemini, the code immediately maps over the result without validating its structure. If Gemini returns an unexpected shape (e.g., `{"items": [...]}` instead of `[...]`), the mapping fails silently or crashes.

## Current Behavior

In `server/routes.ts` lines 273–287:

```ts
const parsed = JSON.parse(jsonMatch[0]);
items = parsed.map((item: any) => ({
  name: item.name || "Unknown Item",
  ...
}));
```

No schema check before calling `.map()`. If `parsed` is an object instead of an array, this throws at runtime.

## Expected Behavior

Validate the parsed structure before mapping. Options:
- Use Zod to define the expected schema and `safeParse` it
- At minimum, check `Array.isArray(parsed)` before calling `.map()`

## Relevant Files

- `server/routes.ts` — lines 273–287 (scan-receipt), lines 350–380 (analyze-food), lines 195–210 (generateRecipesWithGemini)

## Risk / Notes

- AI model outputs are non-deterministic; defensive parsing is essential
- Zod would also eliminate the `any` types in the map callbacks
