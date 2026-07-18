# Performance report

## Existing controls

- Route-level code splitting from TanStack Router/Vite.
- Vendor chunks separate React, TanStack, Supabase, and motion.
- Public catalogs cap/slice results; admin members and audit views are limited/paginated.
- Labs and competitions now have eight-second abort timeouts and deterministic fallback content.
- Reduced-motion users avoid continuous decorative animation.
- The largest tracked image is under 1 MB; no tracked video/checkpoint/archive payloads were found.
- Worker health endpoint avoids application rendering.

## 10× risks

1. Several aggregate admin counters issue parallel count queries; acceptable now, but should become one admin RPC/materialized operational view when data volume makes latency visible.
2. Search and member/content aggregation may need database-native pagination before catalogs exceed thousands of rows.
3. Realtime project updates need subscription limits and monitoring at higher concurrent membership.
4. Digest/email fan-out should remain scheduled/batched and observable.

## Scaling triggers

- **First trigger:** any list exceeds 500 rows or p95 API latency exceeds 500 ms → enforce cursor pagination and inspect indexes/query plans.
- **Second trigger:** concurrent project activity or digest volume causes rate/connection pressure → queue fan-out and cache public catalogs.

Production Web Vitals were not measured because no deployed URL was verified in this pass.
