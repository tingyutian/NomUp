# Missing Token Guard and 401 Retry Logic in Query Client

**Type:** Bug
**Priority:** High
**Effort:** Medium

## TL;DR

`getAccessToken()` in the query client can return `undefined`, but it's used directly in the `Authorization` header without a null check. There's also no automatic token refresh on 401 responses, so expired tokens silently break all API calls.

## Current Behavior

In `client/lib/query-client.ts` line 84:

```ts
headers: { Authorization: `Bearer ${getAccessToken()}` }
// getAccessToken() may return undefined
```

No 401 handling in the default `queryFn`.

## Expected Behavior

1. Guard against undefined token before setting the header
2. On 401 response, attempt a Supabase token refresh and retry the request once
3. If refresh fails, redirect to login

## Relevant Files

- `client/lib/query-client.ts` — line 84 (default queryFn)
- `client/context/AuthContext.tsx` — token management

## Risk / Notes

- Currently, expired sessions cause silent API failures with no redirect to login
- React Query's `retry` config can be used alongside a refresh attempt
