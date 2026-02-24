# `any` Types in Supabase Row Map Functions

**Type:** Bug / Tech Debt
**Priority:** Critical
**Effort:** Medium

## TL;DR

Five mapper functions (`mapGroceryFromDB`, `mapPantryFromDB`, etc.) in `AppContext.tsx` accept `any` as their parameter type. Schema changes in Supabase will break silently at runtime instead of being caught at compile time.

## Current Behavior

```ts
function mapGroceryFromDB(row: any) { ... }
```

Located at lines 104, 145, 178, 558, 637 of `AppContext.tsx`. TypeScript provides no safety net for these DB-to-model conversions.

## Expected Behavior

Each mapper should accept a typed parameter matching the Supabase table schema (either from `@supabase/supabase-js` generated types or a manually defined interface). TypeScript should catch mismatches at compile time.

## Relevant Files

- `client/context/AppContext.tsx` — lines 104, 145, 178, 558, 637
- `shared/schema.ts` — Drizzle schema (can be used as source of truth for types)

## Risk / Notes

- Without types, a column rename or type change in Supabase silently produces `undefined` values in the UI
- Consider using `supabase gen types` to auto-generate types from the database schema
