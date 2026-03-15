# Bolt Performance Journal

## ⚡ Replace N+1 prompt inserts with bulk insert

* **Date:** $(date)
* **File:** `artifacts/api-server/src/routes/admin.ts`
* **Issue:** Generating AI prompts inside `processJob` caused an N+1 query issue as each prompt was being inserted into the database iteratively in a `for` loop.
* **Solution:** Refactored the insertion loop to build an array of prompt objects and then execute a single `db.insert(promptsTable).values(dataArray)` bulk insert. A safety check (`if (dataArray.length > 0)`) was added to ensure the bulk insert only executes when there are prompts to add.
* **Impact:** Reduced N insert statements to a single database query, optimizing background job speed and database load.