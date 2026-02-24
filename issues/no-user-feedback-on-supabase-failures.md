# No User-Facing Feedback When Supabase Mutations Fail

**Type:** Bug
**Priority:** Critical
**Effort:** Medium

## TL;DR

All Supabase insert/update/delete operations in `AppContext.tsx` use optimistic updates. When the DB operation fails, the optimistic state is reverted silently — the user sees their action "undone" with no explanation.

## Current Behavior

In `AppContext.tsx` lines 289–317 (and similar patterns throughout), failures are handled like:

```ts
if (error) {
  setGroceries(prev => /* revert */);
  // no alert, no toast, no user notification
}
```

## Expected Behavior

When a mutation fails, the app should:
1. Revert the optimistic update (already done)
2. Show a user-facing error message (toast or alert) explaining what failed

## Relevant Files

- `client/context/AppContext.tsx` — all mutation functions (`addGroceries`, `updateGrocery`, `deleteGrocery`, `addPantryItem`, etc.)

## Risk / Notes

- Users may retry the same action repeatedly, unaware it's failing
- Consider a centralized error notification utility so each mutation doesn't need its own alert logic
