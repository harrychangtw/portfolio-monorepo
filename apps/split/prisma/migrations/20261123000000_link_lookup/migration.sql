-- A ledger opens from /<token>, where the token is its slug, contributor key
-- or admin key; index the keys so that lookup stays one indexed query.
CREATE UNIQUE INDEX "Ledger_contributorKey_key" ON "Ledger"("contributorKey");
CREATE UNIQUE INDEX "Ledger_adminKeyHash_key" ON "Ledger"("adminKeyHash");
