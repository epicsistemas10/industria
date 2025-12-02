-- Migration: add estoque_minimo to pecas
-- Run this in Supabase SQL editor.

ALTER TABLE IF EXISTS pecas
  ADD COLUMN IF NOT EXISTS estoque_minimo numeric;

-- Optional index
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = current_schema() AND table_name = 'pecas' AND column_name = 'estoque_minimo'
  ) THEN
    EXECUTE 'CREATE INDEX IF NOT EXISTS idx_pecas_estoque_minimo ON pecas(estoque_minimo)';
  END IF;
END
$$;
