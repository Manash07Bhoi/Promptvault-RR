## 2024-05-18 - `checkPurchased` helper does 2 queries, capped at 50, potential bug + performance

**Learning:** The `checkPurchased` helper in `artifacts/api-server/src/routes/packs.ts` runs a query to fetch orders by user id, and a secondary query to find order items inside those orders matching a given pack ID. Not only is this two queries (a minor N+1 / 1+1 issue), but it caps the order fetch to 50, which is an actual bug for power users! It can be optimized to a single fast database lookup using an `innerJoin` between `orderItemsTable` and `ordersTable`.
**Action:** Replace the 2-step `checkPurchased` check with a single fast `INNER JOIN` query.
