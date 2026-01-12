# Agent Prompt: React Performance Changes + PocketBase E2E (chrome-devtools-mcp)

You are working in the `networth` repo (Vite + React + TypeScript + Zustand + TanStack React Query + Recharts). Implement **all React-side items under Epic E** in `planning/FEATURE_BACKLOG.md` (“React Rendering and State Performance”), and add **end-to-end browser tests** that run against a real PocketBase instance by driving Chrome using `chrome-devtools-mcp`. No mock mode.

## Hard requirements

- Only browser E2E tests (no unit/integration).
- Tests must run against **PocketBase only** (no `VITE_USE_MOCK`).
- Use the **existing PocketBase test user** (do not create users in tests).
- No network mocking/stubbing in E2E; use real API calls.
- Tests must be deterministic: create their own app data (accounts/values), and clean up after themselves.
- Fail tests on browser console errors (capture console output).
- Follow TDD at the E2E level: write failing E2E → run → minimal code → rerun → refactor.

## Setup expectations (confirm and document)

1. How PocketBase is started locally (prefer `docker compose` if present).
2. How the app is pointed at PocketBase:
   - `VITE_POCKETBASE_URL` must target the running PB instance.
3. How to authenticate the existing test user:
   - Search for existing env vars / docs in repo for something like:
     - `VITE_POCKETBASE_TEST_USER_EMAIL`
     - `VITE_POCKETBASE_TEST_USER_PASSWORD`
   - If credentials aren’t discoverable in repo, STOP and ask Samrat where they should come from (env vars, local secret file excluded from git, etc.). Do not hardcode credentials.

## What to implement (Epic E)

### E1 (P0): Remove unnecessary Effects and derived state

- Remove `useEffect` used only to compute derived state from props/state.
- Replace with computed values in render or `useMemo` if expensive.
- For “reset state when prop changes”, use `key` prop patterns where appropriate instead of effect-driven resets.

### E2 (P0): Reduce re-renders from Zustand/global stores

- Ensure components use selector subscriptions (`useStore((s) => s.x)`), not whole-store reads.
- Ensure functions/handlers passed to children are stable (`useCallback`) and props are not recreated inline unnecessarily.
- Ensure chart does not rerender due to unrelated store changes.

### E3 (P1): React Query query-key hygiene + cache tuning

- Query keys must be stable and specific; avoid unstable object literals unless serialized.
- Tune `staleTime`/`gcTime` to prevent time-range switching from thrashing PocketBase.
- Mutations invalidate only the minimal set of keys needed.

### E4 (P1): Memoize heavy boundaries (charts)

- Ensure chart receives stable props (memoized series arrays, formatters, handlers).
- Memoize derived series computations with correct dependency lists.
- Split components only if necessary to isolate rerenders.

## E2E runner requirements (chrome-devtools-mcp)

- Start PocketBase (real instance) first (if not already running).
- Start Vite dev server (`npm run dev`) and capture URL/port.
- Use `chrome-devtools-mcp` to:
  - launch Chrome
  - navigate to app URL
  - sign in via UI using the existing PB test user credentials
  - click/type/select/submit
  - assert on DOM state
  - collect console logs (fail on `error`)
  - optionally take screenshots on failure
- Shut down dev server (and PocketBase if you started it).

## Required E2E test flows (minimum)

### 1) Login + dashboard load

- Navigate to app
- Complete login via UI (existing PB test user)
- Assert dashboard renders (chart visible + summary visible)
- Assert no console errors

### 2) Time range switching hits PocketBase without thrash

- Switch time range: e.g. 7D → 30D → 1Y → All time (whatever UI supports)
- For each switch:
  - assert loading indicator appears then disappears (or stable “data loaded” condition)
  - assert chart updates (axis/labels/series changes)
  - assert no console errors
- Add a stability guard: fail if UI never reaches idle within timeout.

### 3) Data mutation round-trip (PocketBase write) + cleanup

- Create an account via UI with a unique name (include timestamp/random suffix).
- If UI supports setting a value, set it.
- Assert net worth/summary changes accordingly.
- Delete the created account at end of test.
- Verify it’s gone and no console errors.

### 4) “No infinite rerender” regression guard

- During interactions (time range switch, chart hover), ensure UI becomes idle and doesn’t loop:
  - define “idle” as “no loading spinner + stable chart container for N ms”
  - fail if repeated loading state never settles

## Implementation order (must follow)

1. Inventory Epic E issues (file paths, symptoms).
2. Add E2E test 1 (login + dashboard) and run.
3. Implement minimal E1/E2 to pass.
4. Add E2E test 2 (time range switching) and run.
5. Implement minimal E3/E4 to pass.
6. Add E2E test 3 (mutation + cleanup) and run.
7. Add E2E test 4 (stability guard) and run.
8. Run full E2E suite multiple times to reduce flakes.

## Stop conditions

- If you need to change PocketBase schema, add server hooks, or adjust backend behavior: STOP and ask Samrat first.
- If you need to introduce a new E2E framework dependency: STOP and ask Samrat first. Prefer using `chrome-devtools-mcp` directly.

## Deliverables

- Code changes implementing Epic E React optimizations.
- E2E tests runnable via a single command (document it briefly).
- Summary: files changed, what React perf improvements were made, and how E2E uses PocketBase.
