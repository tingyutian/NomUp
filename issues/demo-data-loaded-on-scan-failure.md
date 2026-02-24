# Demo Data Loaded Silently on Receipt Scan Failure

**Type:** Bug
**Priority:** Critical
**Effort:** Small

## TL;DR

When a receipt scan fails, the app silently populates the confirm-items screen with 5 hardcoded demo items instead of showing an error. Users don't know the scan failed and proceed to add fake data to their pantry.

## Current Behavior

In `ConfirmItemsScreen.tsx` lines 64–73, the error handler for `scanReceipt` catches a failure and falls back to loading demo items (`DEMO_PANTRY_ITEMS`). The user sees a populated list and has no indication anything went wrong.

## Expected Behavior

On receipt scan failure, the app should show an error alert/toast explaining what went wrong and leave the confirm-items screen empty (or navigate back).

## Relevant Files

- `client/screens/ConfirmItemsScreen.tsx` — lines 64–73 (error handler with demo fallback)
- `client/data/demoData.ts` — source of the hardcoded demo items

## Risk / Notes

- High impact: users can unknowingly submit incorrect pantry items
- Demo data includes nonsensical items that would corrupt real pantry state
