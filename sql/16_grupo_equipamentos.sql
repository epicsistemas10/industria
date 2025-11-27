-- 16_grupo_equipamentos.sql
-- Tabela para agrupar equipamentos em um único hotspot no mapa

CREATE TABLE IF NOT EXISTS grupo_equipamentos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL,
  linha varchar(50) NOT NULL,
  criado_em timestamptz DEFAULT now(),
  -- posição e visual do hotspot (valores percentuais ou px conforme frontend)
  x numeric DEFAULT 10,
  y numeric DEFAULT 10,
  width numeric DEFAULT 8,
  height numeric DEFAULT 8,
  color varchar(32) DEFAULT '#10b981',
  font_size integer DEFAULT 14,
  icon varchar(64) DEFAULT 'ri-tools-fill'
);

CREATE TABLE IF NOT EXISTS grupo_equipamentos_members (
  grupo_id uuid NOT NULL REFERENCES grupo_equipamentos(id) ON DELETE CASCADE,
  equipamento_id uuid NOT NULL REFERENCES equipamentos(id) ON DELETE CASCADE,
  PRIMARY KEY (grupo_id, equipamento_id)
);

CREATE INDEX IF NOT EXISTS idx_grupo_equipamentos_linha ON grupo_equipamentos(linha);
