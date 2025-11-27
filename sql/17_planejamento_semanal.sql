-- 17_planejamento_semanal.sql
-- Tabelas para planejar serviços semanalmente e acompanhar execução por item

CREATE TABLE IF NOT EXISTS planejamento_semanal (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  equipe_id uuid,
  lider_id uuid,
  semana_inicio date NOT NULL,
  criado_em timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS planejamento_itens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  planejamento_id uuid NOT NULL REFERENCES planejamento_semanal(id) ON DELETE CASCADE,
  equipamento_id uuid NOT NULL REFERENCES equipamentos(id) ON DELETE CASCADE,
  servico_id uuid NOT NULL,
  quantidade integer DEFAULT 1,
  status varchar(32) DEFAULT 'planejado', -- planejado | iniciado | concluido
  criado_em timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS planejamento_execucoes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id uuid NOT NULL REFERENCES planejamento_itens(id) ON DELETE CASCADE,
  responsavel_id uuid,
  iniciado_em timestamptz,
  finalizado_em timestamptz,
  observacao text,
  criado_em timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_planejamento_semana_inicio ON planejamento_semanal(semana_inicio);
CREATE INDEX IF NOT EXISTS idx_planejamento_itens_equipamento ON planejamento_itens(equipamento_id);
