# Bolt Performance Journal

## ⚡ Replace N+1 prompt inserts with bulk insert

* **Date:** $(date)
* **File:** `artifacts/api-server/src/routes/admin.ts`
* **Issue:** Generating AI prompts inside `processJob` caused an N+1 query issue as each prompt was being inserted into the database iteratively in a `for` loop.
* **Solution:** Refactored the insertion loop to build an array of prompt objects and then execute a single `db.insert(promptsTable).values(dataArray)` bulk insert. A safety check (`if (dataArray.length > 0)`) was added to ensure the bulk insert only executes when there are prompts to add.
* **Impact:** Reduced N insert statements to a single database query, optimizing background job speed and database load.
## 2025-03-16 - [Optimize N+1 query in user conversations]
**Learning:** In Drizzle ORM, resolving N+1 queries when fetching the "latest" related record (like the last message for multiple conversations) can be cleanly done using `inArray` alongside `selectDistinctOn`, bypassing complex CTEs or map-reduce logic.
**Action:** Always prefer `selectDistinctOn` for "latest per group" style queries in PostgreSQL/Drizzle, combined with batched ID arrays, to cut 2N queries down to 1.
