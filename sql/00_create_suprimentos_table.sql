-- Cria a tabela `suprimentos` para armazenar itens copiados de `pecas`
-- Execute no Painel SQL do Supabase

CREATE TABLE IF NOT EXISTS public.suprimentos (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  peca_id text,
  nome text,
  codigo_produto text,
  tipo text,
  unidade_medida text,
  quantidade numeric,
  estoque_minimo numeric,
  meta jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- índice para busca por nome/codigo
CREATE INDEX IF NOT EXISTS idx_suprimentos_nome ON public.suprimentos USING btree (lower(nome));
CREATE INDEX IF NOT EXISTS idx_suprimentos_codigo ON public.suprimentos USING btree (codigo_produto);

-- garante que um mesmo peca_id seja único (se desejar, pode permitir peca_id nulo e usar codigo_produto como chave)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint c
    JOIN pg_class t ON c.conrelid = t.oid
    WHERE c.contype = 'u'
      AND t.relname = 'suprimentos'
      AND c.conname = 'suprimentos_peca_id_key'
  ) THEN
    BEGIN
      -- only add constraint if there are no duplicates
      IF EXISTS (SELECT peca_id FROM public.suprimentos WHERE peca_id IS NOT NULL GROUP BY peca_id HAVING COUNT(*) > 1) THEN
        RAISE NOTICE 'Não adicionada constraint UNIQUE em peca_id: existem valores duplicados.';
      ELSE
        ALTER TABLE public.suprimentos ADD CONSTRAINT suprimentos_peca_id_key UNIQUE (peca_id);
      END IF;
    EXCEPTION WHEN undefined_table THEN
      -- ignore
      NULL;
    END;
  END IF;
END$$;

-- Observação: revise permissões e RLS antes de aplicar em produção
