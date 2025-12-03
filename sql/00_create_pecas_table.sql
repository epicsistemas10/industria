-- Cria a tabela `pecas` com colunas esperadas pelo import
-- Execute esse script no Painel SQL do Supabase (Dashboard) ou via psql

CREATE TABLE IF NOT EXISTS public.pecas (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  grupo_produto text,
  produto text,
  codigo_produto text,
  unidade_medida text,
  quantidade numeric,
  valor_total numeric,
  valor_unitario numeric,
  created_at timestamptz DEFAULT now()
);

-- Segurança: se a tabela já existia com esquema diferente, adicionamos as colunas ausentes.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_attribute
    WHERE attrelid = 'public.pecas'::regclass AND attname = 'grupo_produto'
  ) THEN
    ALTER TABLE public.pecas ADD COLUMN grupo_produto text;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_attribute
    WHERE attrelid = 'public.pecas'::regclass AND attname = 'produto'
  ) THEN
    ALTER TABLE public.pecas ADD COLUMN produto text;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_attribute
    WHERE attrelid = 'public.pecas'::regclass AND attname = 'codigo_produto'
  ) THEN
    ALTER TABLE public.pecas ADD COLUMN codigo_produto text;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_attribute
    WHERE attrelid = 'public.pecas'::regclass AND attname = 'unidade_medida'
  ) THEN
    ALTER TABLE public.pecas ADD COLUMN unidade_medida text;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_attribute
    WHERE attrelid = 'public.pecas'::regclass AND attname = 'quantidade'
  ) THEN
    ALTER TABLE public.pecas ADD COLUMN quantidade numeric;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_attribute
    WHERE attrelid = 'public.pecas'::regclass AND attname = 'valor_total'
  ) THEN
    ALTER TABLE public.pecas ADD COLUMN valor_total numeric;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_attribute
    WHERE attrelid = 'public.pecas'::regclass AND attname = 'valor_unitario'
  ) THEN
    ALTER TABLE public.pecas ADD COLUMN valor_unitario numeric;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_attribute
    WHERE attrelid = 'public.pecas'::regclass AND attname = 'created_at'
  ) THEN
    ALTER TABLE public.pecas ADD COLUMN created_at timestamptz DEFAULT now();
  END IF;
  -- add columns commonly used by the app if missing
  IF NOT EXISTS (
    SELECT 1 FROM pg_attribute
    WHERE attrelid = 'public.pecas'::regclass AND attname = 'estoque_minimo'
  ) THEN
    ALTER TABLE public.pecas ADD COLUMN estoque_minimo numeric;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_attribute
    WHERE attrelid = 'public.pecas'::regclass AND attname = 'saldo_estoque'
  ) THEN
    ALTER TABLE public.pecas ADD COLUMN saldo_estoque numeric;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_attribute
    WHERE attrelid = 'public.pecas'::regclass AND attname = 'foto'
  ) THEN
    ALTER TABLE public.pecas ADD COLUMN foto text;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_attribute
    WHERE attrelid = 'public.pecas'::regclass AND attname = 'foto_url'
  ) THEN
    ALTER TABLE public.pecas ADD COLUMN foto_url text;
  END IF;
END$$;

-- Só adiciona a constraint UNIQUE em codigo_produto se a coluna existir e não houver duplicatas
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_attribute
    WHERE attrelid = 'public.pecas'::regclass AND attname = 'codigo_produto'
  ) THEN
    IF NOT EXISTS (
      SELECT 1 FROM pg_constraint c
      JOIN pg_class t ON c.conrelid = t.oid
      WHERE c.contype = 'u'
        AND t.relname = 'pecas'
        AND c.conname = 'pecas_codigo_produto_key'
    ) THEN
      -- verifica duplicatas antes de aplicar a constraint
      IF EXISTS (SELECT codigo_produto FROM public.pecas GROUP BY codigo_produto HAVING COUNT(*) > 1) THEN
        RAISE NOTICE 'Não adicionada constraint UNIQUE em codigo_produto: existem valores duplicados.';
      ELSE
        ALTER TABLE public.pecas ADD CONSTRAINT pecas_codigo_produto_key UNIQUE (codigo_produto);
      END IF;
    END IF;
  END IF;
END$$;

-- Observação: verifique permissões, RLS e backups antes de inserir dados em produção.
