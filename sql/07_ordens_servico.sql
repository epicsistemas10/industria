-- Tabela de Ordens de Serviço
CREATE TABLE IF NOT EXISTS ordens_servico (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  numero_os VARCHAR(20) UNIQUE NOT NULL,
  equipamento_id UUID REFERENCES equipamentos(id),
  titulo VARCHAR(200) NOT NULL,
  descricao TEXT,
  tipo VARCHAR(50) CHECK (tipo IN ('Preventiva', 'Corretiva', 'Preditiva', 'Melhoria')),
  prioridade VARCHAR(20) CHECK (prioridade IN ('Baixa', 'Média', 'Alta', 'Urgente')),
  status VARCHAR(20) CHECK (status IN ('Aberta', 'Em Andamento', 'Pausada', 'Concluída', 'Cancelada')),
  data_abertura TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  data_inicio TIMESTAMP WITH TIME ZONE,
  data_conclusao TIMESTAMP WITH TIME ZONE,
  responsavel VARCHAR(100),
  equipe_id UUID REFERENCES equipes(id),
  custo_pecas DECIMAL(10,2) DEFAULT 0,
  custo_mao_obra DECIMAL(10,2) DEFAULT 0,
  tempo_estimado INTEGER,
  tempo_real INTEGER,
  observacoes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_os_equipamento ON ordens_servico(equipamento_id);
CREATE INDEX idx_os_status ON ordens_servico(status);
CREATE INDEX idx_os_numero ON ordens_servico(numero_os);
CREATE INDEX idx_os_data_abertura ON ordens_servico(data_abertura);
