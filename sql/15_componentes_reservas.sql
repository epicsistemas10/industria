-- Tabela: component_reservas (reservas de componentes)
CREATE TABLE IF NOT EXISTS componentes_reservas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  componente_id UUID REFERENCES componentes(id) ON DELETE CASCADE,
  quantidade INTEGER DEFAULT 1,
  local VARCHAR(255),
  criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_comp_reservas_componente ON componentes_reservas(componente_id);

-- Tornar idempotente: usar IF NOT EXISTS evita erro se o índice já existir
-- Observação: em algumas versões do Postgres/Supabase `CREATE INDEX IF NOT EXISTS` é suportado.
-- Outra opção no editor SQL é rodar: `DROP INDEX IF EXISTS idx_comp_reservas_componente;` antes de criar.
