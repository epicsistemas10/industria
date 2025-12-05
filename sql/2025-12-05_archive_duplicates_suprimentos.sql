-- 2025-12-05: Archive duplicate `suprimentos` rows (safe, reversible)
-- WARNING: Review results before running. This script marks duplicates as archived
-- (sets is_archived = true) instead of deleting. The UI is updated to ignore archived rows.

-- 0) Optional: run in a transaction block if your environment supports it
-- BEGIN;

-- 1) Add archive column if not present
ALTER TABLE suprimentos
  ADD COLUMN IF NOT EXISTS is_archived boolean DEFAULT false;

-- 2) Phase 1: mark duplicates where peca_id is present (keep the row with smallest id)
WITH grouped AS (
  SELECT id, peca_id,
         ROW_NUMBER() OVER (PARTITION BY peca_id ORDER BY id) AS rn
  FROM suprimentos
  WHERE peca_id IS NOT NULL
)
UPDATE suprimentos
SET is_archived = true
WHERE id IN (SELECT id FROM grouped WHERE rn > 1);

-- 3) Phase 2: mark duplicates by normalized name (non-destructive)
-- Uses a simple normalization that removes non-alphanumerics (no unaccent required)
WITH normalized AS (
  SELECT id,
         lower(regexp_replace(nome, '[^A-Za-z0-9 ]+', ' ', 'g')) AS normalized_name,
         ROW_NUMBER() OVER (PARTITION BY lower(regexp_replace(nome, '[^A-Za-z0-9 ]+', ' ', 'g')) ORDER BY id) AS rn
  FROM suprimentos
)
UPDATE suprimentos
SET is_archived = true
WHERE id IN (SELECT id FROM normalized WHERE rn > 1);

-- 4) Report: number of archived rows
SELECT count(*) AS archived_count FROM suprimentos WHERE is_archived = true;

-- 5) OPTIONAL: show a sample of archived rows (first 200)
SELECT id, peca_id, nome, codigo_produto, quantidade, estoque_minimo, created_at
FROM suprimentos
WHERE is_archived = true
ORDER BY id
LIMIT 200;

-- COMMIT; -- uncomment if you wrapped in BEGIN

-- Notes:
-- - This script marks duplicates as archived; it does not remove rows.
-- - The UI has been updated to ignore rows where is_archived = true. After running,
--   reload the app and verify duplicates are gone.
-- - If you prefer to actually DELETE duplicates after verification, run the DELETE
--   variant from the dedupe preview file (but only after you export/backup the table).

