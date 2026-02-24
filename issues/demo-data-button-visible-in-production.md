# "Load Demo Data" Button Visible in Production

**Type:** Bug / Production Readiness
**Priority:** Medium
**Effort:** Small

## TL;DR

The "Load Demo Data" button in the Pantry screen is rendered in all environments, including production. Real users can accidentally fill their pantry with demo items.

## Current Behavior

In `client/screens/PantryScreen.tsx` lines 176–201, the `loadDemoData` function and its trigger button are unconditionally rendered.

## Expected Behavior

The button should only be visible in development or staging environments:

```tsx
{__DEV__ && (
  <Button onPress={loadDemoData} title="Load Demo Data" />
)}
```

## Relevant Files

- `client/screens/PantryScreen.tsx` — lines 176–201

## Risk / Notes

- `__DEV__` is `true` in Expo development builds and `false` in production builds — no extra env config needed
