-- Tabela Pivô: Equipamentos x Componentes (Relação Muitos para Muitos)
CREATE TABLE IF NOT EXISTS equipamentos_componentes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  equipamento_id UUID REFERENCES equipamentos(id) ON DELETE CASCADE,
  componente_id UUID REFERENCES componentes(id) ON DELETE CASCADE,
  quantidade_usada INTEGER DEFAULT 1,
  posicao VARCHAR(100),
  observacoes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(equipamento_id, componente_id, posicao)
);

CREATE INDEX idx_eq_comp_equipamento ON equipamentos_componentes(equipamento_id);
CREATE INDEX idx_eq_comp_componente ON equipamentos_componentes(componente_id);
