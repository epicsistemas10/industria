-- Idempotent migration to ensure `pecas` table has expected columns for Importação de Estoque
-- Adds columns if missing, without changing existing primary key or types.

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_class WHERE relname = 'pecas') THEN
    CREATE TABLE public.pecas (
      id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
      nome text,
      codigo_produto text,
      unidade_medida text,
      quantidade_estoque numeric,
      estoque_minimo numeric,
      valor_unitario numeric,
      valor_total numeric,
      saldo_estoque numeric,
      created_at timestamptz DEFAULT now(),
      updated_at timestamptz DEFAULT now()
    );
  ELSE
    -- add columns if missing
    IF NOT EXISTS (SELECT 1 FROM pg_attribute WHERE attrelid = 'public.pecas'::regclass AND attname = 'nome') THEN
      ALTER TABLE public.pecas ADD COLUMN nome text;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_attribute WHERE attrelid = 'public.pecas'::regclass AND attname = 'codigo_produto') THEN
      ALTER TABLE public.pecas ADD COLUMN codigo_produto text;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_attribute WHERE attrelid = 'public.pecas'::regclass AND attname = 'unidade_medida') THEN
      ALTER TABLE public.pecas ADD COLUMN unidade_medida text;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_attribute WHERE attrelid = 'public.pecas'::regclass AND attname = 'quantidade_estoque') THEN
      ALTER TABLE public.pecas ADD COLUMN quantidade_estoque numeric;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_attribute WHERE attrelid = 'public.pecas'::regclass AND attname = 'estoque_minimo') THEN
      ALTER TABLE public.pecas ADD COLUMN estoque_minimo numeric;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_attribute WHERE attrelid = 'public.pecas'::regclass AND attname = 'valor_unitario') THEN
      ALTER TABLE public.pecas ADD COLUMN valor_unitario numeric;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_attribute WHERE attrelid = 'public.pecas'::regclass AND attname = 'valor_total') THEN
      ALTER TABLE public.pecas ADD COLUMN valor_total numeric;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_attribute WHERE attrelid = 'public.pecas'::regclass AND attname = 'saldo_estoque') THEN
      ALTER TABLE public.pecas ADD COLUMN saldo_estoque numeric;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_attribute WHERE attrelid = 'public.pecas'::regclass AND attname = 'updated_at') THEN
      ALTER TABLE public.pecas ADD COLUMN updated_at timestamptz DEFAULT now();
    END IF;
  END IF;
END$$;

-- safe: do not attempt to convert or drop existing id column types. This migration only ensures presence of columns.
