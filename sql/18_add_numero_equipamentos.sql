-- 18_add_numero_equipamentos.sql
-- Adiciona coluna opcional 'numero' aos equipamentos para diferenciar unidades na mesma linha

ALTER TABLE IF EXISTS equipamentos
  ADD COLUMN IF NOT EXISTS numero integer;

CREATE INDEX IF NOT EXISTS idx_equipamentos_numero ON equipamentos(numero);
