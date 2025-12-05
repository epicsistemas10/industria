-- 2025-12-05: Preview and optional deduplication for `suprimentos`
-- WARNING: review the SELECT results carefully before running DELETE.
-- Run these queries in Supabase SQL Editor (recommended) or psql connected to your database.

-- 1) Preview duplicates grouped by normalized name
-- This uses the `unaccent` extension if available. If your DB does not have `unaccent`, enable it or
-- use a simpler normalization (may be less accurate with accents).

-- Preview groups with more than one row (candidate duplicates)
SELECT
  normalized_name,
  array_agg(id ORDER BY id) AS ids,
  count(*) AS cnt,
  array_agg(json_build_object('id', id, 'nome', nome, 'codigo_produto', codigo_produto, 'peca_id', peca_id, 'quantidade', quantidade, 'estoque_minimo', estoque_minimo) ORDER BY id) AS rows
FROM (
  SELECT
    id,
    nome,
    codigo_produto,
    peca_id,
    quantidade,
    estoque_minimo,
    lower(regexp_replace(unaccent(nome), '\s+' , ' ', 'g')) AS normalized_name
  FROM suprimentos
) t
GROUP BY normalized_name
HAVING count(*) > 1
ORDER BY cnt DESC;

-- 2) OPTIONAL: Preview duplicates grouped by peca_id (if many suprimentos were created from the same peça)
SELECT peca_id, array_agg(id ORDER BY id) AS ids, count(*) AS cnt
FROM suprimentos
WHERE peca_id IS NOT NULL
GROUP BY peca_id
HAVING count(*) > 1
ORDER BY cnt DESC;

-- 3) SAFE DELETE (recommended workflow)
-- a) Run the previews above and confirm which groups should be deduped.
-- b) If you want to remove duplicates and keep the row with the lowest id (oldest), run the DELETE below.
--    This CTE computes a row_number partitioned by normalized_name and deletes rows with rn > 1.

-- BEGIN DELETE SECTION (UNCOMMENT TO EXECUTE)
-- WITH normalized AS (
--   SELECT id,
--          lower(regexp_replace(unaccent(nome), '\s+' , ' ', 'g')) AS normalized_name,
--          ROW_NUMBER() OVER (PARTITION BY lower(regexp_replace(unaccent(nome), '\s+' , ' ', 'g')) ORDER BY id) AS rn
--   FROM suprimentos
-- )
-- DELETE FROM suprimentos
-- WHERE id IN (SELECT id FROM normalized WHERE rn > 1);

-- 4) ALTERNATIVE: Mark duplicates as archived instead of deleting (safer)
-- Add a boolean column `is_archived` to `suprimentos` and then run:
-- ALTER TABLE suprimentos ADD COLUMN IF NOT EXISTS is_archived boolean DEFAULT false;
-- WITH normalized AS (
--   SELECT id,
--          lower(regexp_replace(unaccent(nome), '\s+' , ' ', 'g')) AS normalized_name,
--          ROW_NUMBER() OVER (PARTITION BY lower(regexp_replace(unaccent(nome), '\s+' , ' ', 'g')) ORDER BY id) AS rn
--   FROM suprimentos
-- )
-- UPDATE suprimentos
-- SET is_archived = true
-- WHERE id IN (SELECT id FROM normalized WHERE rn > 1);

-- Notes:
-- - If your Postgres instance does not allow `unaccent`, run: CREATE EXTENSION IF NOT EXISTS unaccent; (requires sufficient privileges).
-- - Always export/backup `suprimentos` before running destructive actions.
-- - If you prefer a custom dedupe key (e.g., use peca_id where present, else normalized name), we can provide a variant SQL.

-- End of script
