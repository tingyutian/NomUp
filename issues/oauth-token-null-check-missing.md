# Missing Null Check on OAuth Token Extraction

**Type:** Bug
**Priority:** Critical
**Effort:** Small

## TL;DR

During Google OAuth sign-in, `access_token` and `refresh_token` are extracted from the URL hash without null checks. If either is absent, `setSession()` is called with `undefined` values, which can crash the auth flow or leave the user in a broken state.

## Current Behavior

In `AuthContext.tsx` line 91:

```ts
const accessToken = params.get("access_token");
const refreshToken = params.get("refresh_token");
// no null check before use
await supabase.auth.setSession({ access_token: accessToken, refresh_token: refreshToken });
```

If the OAuth provider omits a token (e.g., on error), this silently passes `null` to `setSession`.

## Expected Behavior

Validate that both tokens are present before calling `setSession`. If not, throw a descriptive error so the user sees a proper failure message.

## Relevant Files

- `client/context/AuthContext.tsx` — lines 84–96 (`signInWithGoogle` function)

## Risk / Notes

- Can leave user stuck in a partially-authenticated state
- Error should be surfaced to the user via alert/toast
