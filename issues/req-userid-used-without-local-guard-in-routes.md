# `req.userId` Used Without Local Guard in Protected Routes

**Type:** Bug / Security
**Priority:** Medium
**Effort:** Small

## TL;DR

Protected routes in `server/routes.ts` rely on `requireAuth` middleware to set `req.userId`, but none of the route handlers verify it's present locally. If middleware is misconfigured or bypassed, routes could execute with `undefined` userId and return incorrect data.

## Current Behavior

In `server/routes.ts` line 682–689:

```ts
router.get("/saved-recipes", requireAuth, async (req, res) => {
  const recipes = await db.select()
    .from(savedRecipes)
    .where(eq(savedRecipes.userId, req.userId)); // req.userId assumed to be set
```

No guard at the route level.

## Expected Behavior

Each protected route handler should assert `req.userId` is present as a first line of defense:

```ts
if (!req.userId) return res.status(401).json({ error: "Unauthorized" });
```

## Relevant Files

- `server/routes.ts` — all routes using `requireAuth` middleware
- `server/middleware/requireAuth.ts` — the middleware itself (currently correct)

## Risk / Notes

- Defense-in-depth: the middleware is correct today, but this guards against future refactoring mistakes
