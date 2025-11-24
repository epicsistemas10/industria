-- Tabela de Melhorias Sugeridas
CREATE TABLE IF NOT EXISTS melhorias (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  titulo VARCHAR(200) NOT NULL,
  descricao TEXT,
  equipamento_id UUID REFERENCES equipamentos(id),
  setor_id UUID REFERENCES setores(id),
  tipo VARCHAR(50),
  prioridade VARCHAR(20),
  status VARCHAR(20) DEFAULT 'Pendente',
  custo_estimado DECIMAL(10,2),
  beneficio_esperado TEXT,
  sugerido_por VARCHAR(100),
  data_sugestao DATE DEFAULT CURRENT_DATE,
  data_implementacao DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_melhorias_equipamento ON melhorias(equipamento_id);
CREATE INDEX idx_melhorias_status ON melhorias(status);
CREATE INDEX idx_melhorias_setor ON melhorias(setor_id);
