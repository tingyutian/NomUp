# Hardcoded Recipe Limit (No Pagination)

**Type:** Improvement
**Priority:** Low
**Effort:** Medium

## TL;DR

Recipe search results are hardcoded to 5 via `slice(0, 5)`. Users searching for common ingredients (e.g., "chicken") get only 5 of potentially 100+ matches with no way to see more.

## Current Behavior

In `server/routes.ts` line 488:

```ts
const recipes = allRecipes.slice(0, 5);
```

Hardcoded. No pagination, no way to request more.

## Expected Behavior

Support pagination via query params, or at minimum increase the limit and document it:

```ts
const limit = Math.min(parseInt(req.query.limit as string) || 10, 50);
const page = parseInt(req.query.page as string) || 0;
const recipes = allRecipes.slice(page * limit, (page + 1) * limit);
```

Return total count in the response so the client can show "load more".

## Relevant Files

- `server/routes.ts` — line 488 (recipe search handler)
- `client/screens/RecipeFeedScreen.tsx` — consumer of the endpoint

## Risk / Notes

- TheMealDB doesn't support server-side pagination, so all results are fetched then sliced client-side — this is fine
- Consider caching TheMealDB results if the same ingredient is searched repeatedly
