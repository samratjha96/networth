# Feature Backlog: Decades-Scale Performance

## Goal

Make Argos responsive and cost-effective for net worth tracking across decades, with many users, by controlling time-series point count end-to-end (storage → queries → client transforms → chart rendering).

## Non-Goals (for this backlog)

- Replacing PocketBase.
- Redesigning the UI/visual style.
- Building a full analytics/BI pipeline.

## Prioritization Guide

- **P0**: Required to support decades without timeouts/UI lag.
- **P1**: Strong ROI; improves robustness/operability.
- **P2**: Nice-to-have; polish or deeper tooling.

---

## Epic A (P0): Multi-Resolution Time-Series Storage

### A1 (P0): Add rollup collections for net worth

**Problem**: Hourly history for decades is too large to query and render directly.

**Acceptance Criteria**:

- [ ] PocketBase schema includes net worth rollups at multiple resolutions (e.g., daily + monthly).
- [ ] A single time range request returns data at an appropriate resolution based on span.
- [ ] Net worth chart maintains a consistent max point budget (defined by policy).
- [ ] Data remains correct within defined rollup tolerances (documented).

### A2 (P0): Add rollup collections for account values

**Acceptance Criteria**:

- [ ] PocketBase schema includes account value rollups (e.g., daily; monthly optional).
- [ ] Account history queries do not pull hourly data for long ranges.
- [ ] Account performance calculations can use rollups for long spans.

### A3 (P1): Rollup generation strategy

**Acceptance Criteria**:

- [ ] Rollups are generated deterministically (one of: on write hook, scheduled job, or batch backfill script).
- [ ] Backfill path exists to generate rollups for existing users.
- [ ] Rollup jobs are idempotent (safe to re-run).

---

## Epic B (P0): Query Shapes That Scale

### B1 (P0): Make “All time” actually all time

**Acceptance Criteria**:

- [ ] “All time” uses the earliest available record date (not a fixed 10-year window).
- [ ] “All time” does not cause unbounded fetch sizes; it still respects point budgets via rollups.

### B2 (P0): Eliminate per-account query fan-out in performance calculations

**Problem**: `getAccountPerformance` scales as O(numAccounts) queries.

**Acceptance Criteria**:

- [ ] Account performance for a time range is computed with a bounded number of queries (target: 1–3 total).
- [ ] Performance results match existing behavior for the same range (within rounding tolerances).
- [ ] No UI regressions in performance cards/widgets.

### B3 (P1): Make net worth history writes bounded and deterministic

**Problem**: `updateNetWorthHistory` existence checks can become expensive as history grows.

**Acceptance Criteria**:

- [ ] Net worth “one value per bucket” is enforced (e.g., uniqueness on `(user_id, bucket_start)`).
- [ ] Update path does not require scanning long histories.
- [ ] Duplicate net worth points for the same bucket cannot be created accidentally.

### B4 (P1): Query guardrails

**Acceptance Criteria**:

- [ ] Add a lightweight guard (script or lint rule) that flags dangerous PocketBase query shapes (e.g., accidental full-history pulls).
- [ ] Guardrails include the known anti-pattern: `getFullList({ perPage: 1 })`.

---

## Epic C (P0): Client Data Processing That Scales

### C1 (P0): Make interpolation linear-time

**Problem**: `fillMissingDataPoints()` is currently O(N\*M) and will blow up for large ranges.

**Acceptance Criteria**:

- [ ] Interpolation runs in O(N+M) time for a pre-sorted series.
- [ ] Interpolation has a clear, explicit max output point budget per range.
- [ ] No behavioral regressions in chart shape for existing ranges.

### C2 (P0): Downsample before rendering

**Acceptance Criteria**:

- [ ] Each rendered chart series has a configurable max number of points (e.g., 300–1200).
- [ ] Downsampling strategy is defined per chart (e.g., “last per bucket”, or min/max/last for volatility).
- [ ] Tooltip/hover remains correct for the plotted points.

---

## Epic D (P0): Chart Rendering Performance

### D1 (P0): Disable expensive per-point rendering at high point counts

**Acceptance Criteria**:

- [ ] Dots/labels/custom renderers are disabled or simplified when point count exceeds a threshold.
- [ ] Chart interactions remain responsive at the max point budget.

### D2 (P1): Improve chart memoization boundaries

**Acceptance Criteria**:

- [ ] Chart components do not re-render due to unrelated state changes.
- [ ] Expensive derived series computations are memoized and keyed by stable inputs.

---

## Epic E (P0): React Rendering and State Performance

### E1 (P0): Remove unnecessary Effects and derived state

**Problem**: Effects used for derived values or state synchronization create extra renders and hard-to-reason update cascades.

**Acceptance Criteria**:

- [ ] No `useEffect` exists solely to derive state from props/state.
- [ ] Derived values are computed during render or with `useMemo` if expensive.
- [ ] Components that need resetting on prop change use a `key` prop pattern instead of effect-driven resets.

### E2 (P0): Reduce re-renders from global stores

**Acceptance Criteria**:

- [ ] Zustand selectors are used so components subscribe only to the state they need.
- [ ] Store actions referenced in components are stable (no inline object creation that breaks memoization).
- [ ] The dashboard does not re-render the chart due to unrelated store updates.

### E3 (P1): React Query caching and query-key hygiene

**Acceptance Criteria**:

- [ ] Query keys are stable and specific (avoid object literals that change identity unless serialized).
- [ ] `staleTime`/`gcTime` are tuned so time-range switching doesn’t thrash the network.
- [ ] Mutations invalidate only the necessary query keys (avoid broad invalidation).

### E4 (P1): Split heavy components and memoize boundaries

**Acceptance Criteria**:

- [ ] The chart component receives stable props (memoized series + handlers).
- [ ] Expensive computed series are memoized with correct dependency lists.
- [ ] React DevTools profiler shows no repeated long renders when hovering/dragging over the chart.

---

## Epic F (P1): Storage Hygiene, Retention, and Indexing

### F1 (P1): Add/verify indexes for the common filter+sort patterns

**Acceptance Criteria**:

- [ ] Common queries are index-backed (user_id + date/hour_start, and account_id where relevant).
- [ ] Explain/verification approach is documented (PocketBase/SQLite-level).

### F2 (P1): Retention policy for high-resolution data

**Acceptance Criteria**:

- [ ] A policy exists for how long hourly points are retained (e.g., 90–180 days).
- [ ] Older ranges are served from rollups only.
- [ ] Retention does not break “all time” charts.

---

## Epic G (P1): Observability and Performance Budgets

### G1 (P1): Add query + payload instrumentation

**Acceptance Criteria**:

- [ ] Client logs or metrics capture: query duration, record count, and approximate payload size.
- [ ] A simple “performance debug mode” can be enabled without changing code.

### G2 (P2): Add performance regression checks

**Acceptance Criteria**:

- [ ] Documented procedure to compare perf across versions (dev + production).
- [ ] Optional script-based smoke benchmark for key queries.

---

## Epic H (P2): Load/Scale Validation

### H1 (P2): Create a synthetic dataset generator

**Acceptance Criteria**:

- [ ] Tooling exists to generate a dataset representative of “decades + many accounts”.
- [ ] Can backfill rollups for the synthetic dataset.

### H2 (P2): End-to-end scale sanity pass

**Acceptance Criteria**:

- [ ] “All time” view remains responsive under the synthetic dataset.
- [ ] No single user action triggers a full-history fetch at hourly resolution.

---

## Suggested Implementation Order (first pass)

1. **A1 + B1 + C2 + D1** (point budgets + rollups + render caps)
2. **C1** (interpolation algorithm)
3. **B2** (remove per-account fan-out)
4. **B3 + F1** (bounded writes + indexes)
5. **E1 + E2** (React effects + store renders)
6. **G1** (instrumentation)
