# CookingTimer setInterval Race Condition

**Type:** Bug
**Priority:** Medium
**Effort:** Small

## TL;DR

The `CookingTimer` component's `useEffect` sets up a `setInterval` that depends on `isRunning`. If `isRunning` changes rapidly (e.g., pause/resume in quick succession), multiple intervals could be scheduled before cleanup runs, causing the timer to tick multiple times per second.

## Current Behavior

In `client/components/CookingTimer.tsx` lines 77–89:

```ts
useEffect(() => {
  if (!isRunning) return;
  const interval = setInterval(() => { ... }, 1000);
  return () => clearInterval(interval);
}, [isRunning, secondsLeft, onComplete, playAlarm]);
```

Because `secondsLeft` is in the dependency array, the effect re-runs every second, clearing and re-creating the interval on each tick.

## Expected Behavior

Use a `ref` to hold the interval ID and manage start/stop outside of the effect's dependency cycle. Only `isRunning` should trigger interval creation/destruction:

```ts
const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

useEffect(() => {
  if (isRunning) {
    intervalRef.current = setInterval(tick, 1000);
  } else {
    if (intervalRef.current) clearInterval(intervalRef.current);
  }
  return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
}, [isRunning]);
```

## Relevant Files

- `client/components/CookingTimer.tsx` — lines 77–89

## Risk / Notes

- Current behavior may cause timer drift (seconds skipped or doubled) on slower devices
