-- 19_add_equipamento_fields.sql
-- Adiciona colunas opcionais aos equipamentos: serie, dimensao, peso, especificacoes, linha_setor

ALTER TABLE IF EXISTS equipamentos
  ADD COLUMN IF NOT EXISTS serie text;

ALTER TABLE IF EXISTS equipamentos
  ADD COLUMN IF NOT EXISTS dimensao text;

ALTER TABLE IF EXISTS equipamentos
  ADD COLUMN IF NOT EXISTS peso text;

ALTER TABLE IF EXISTS equipamentos
  ADD COLUMN IF NOT EXISTS especificacoes text;

ALTER TABLE IF EXISTS equipamentos
  ADD COLUMN IF NOT EXISTS linha_setor text;

-- Índices opcionais (descomente se quiser melhorar buscas por linha_setor)
-- CREATE INDEX IF NOT EXISTS idx_equipamentos_linha_setor ON equipamentos(linha_setor);
