-- Tabela de Histórico de Revisões
CREATE TABLE IF NOT EXISTS historico_revisoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  equipamento_id UUID REFERENCES equipamentos(id) ON DELETE CASCADE,
  data_revisao DATE NOT NULL,
  tipo_revisao VARCHAR(50),
  descricao TEXT,
  responsavel VARCHAR(100),
  custo_total DECIMAL(10,2),
  tempo_parada INTEGER,
  observacoes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_historico_equipamento ON historico_revisoes(equipamento_id);
CREATE INDEX idx_historico_data ON historico_revisoes(data_revisao);
