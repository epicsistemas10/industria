-- Migration: add columns for import convenience
-- Adds: saldo_estoque, valor_unitario, grupo, codigo_peca to table `pecas`
-- Run this in Supabase SQL editor.

ALTER TABLE IF EXISTS pecas
  ADD COLUMN IF NOT EXISTS saldo_estoque numeric,
  ADD COLUMN IF NOT EXISTS valor_unitario numeric(12,2),
  ADD COLUMN IF NOT EXISTS grupo text,
  ADD COLUMN IF NOT EXISTS codigo_peca text;

-- Optional: create indexes to speed up queries (guarded by column existence)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = current_schema() AND table_name = 'pecas' AND column_name = 'codigo_peca'
  ) THEN
    EXECUTE 'CREATE INDEX IF NOT EXISTS idx_pecas_codigo_peca ON pecas(codigo_peca)';
  END IF;
END
$$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = current_schema() AND table_name = 'pecas' AND column_name = 'grupo'
  ) THEN
    EXECUTE 'CREATE INDEX IF NOT EXISTS idx_pecas_grupo ON pecas(grupo)';
  END IF;
END
$$;
