# AsyncStorage Calls Without Try-Catch

**Type:** Bug
**Priority:** Medium
**Effort:** Small

## TL;DR

`AsyncStorage` read/write calls in `AppContext.tsx` have no error handling. On devices where storage is restricted or full, these fail silently, breaking onboarding state and user preferences.

## Current Behavior

In `client/context/AppContext.tsx` lines 257–259:

```ts
await AsyncStorage.setItem("hasSeenOnboarding", "true");
// no try-catch
```

Same pattern applies to `getItem` calls for preferences.

## Expected Behavior

All `AsyncStorage` calls should be wrapped in try-catch with graceful fallback behavior:

```ts
try {
  await AsyncStorage.setItem("hasSeenOnboarding", "true");
} catch (e) {
  console.warn("Failed to persist onboarding state", e);
}
```

## Relevant Files

- `client/context/AppContext.tsx` — lines 257–259 and nearby AsyncStorage usages
- `client/screens/ProfileScreen.tsx` — if AsyncStorage is used there too

## Risk / Notes

- On some Android devices, storage can be restricted by OS-level policies
- A crash here prevents users from ever completing onboarding
