-- Tabela de Equipamentos
CREATE TABLE IF NOT EXISTS equipamentos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome VARCHAR(200) NOT NULL,
  setor_id UUID REFERENCES setores(id),
  descricao TEXT,
  fabricante VARCHAR(100),
  modelo VARCHAR(100),
  ano_fabricacao INTEGER,
  criticidade VARCHAR(20) CHECK (criticidade IN ('Baixa', 'Média', 'Alta', 'Crítica')),
  status_revisao INTEGER DEFAULT 0 CHECK (status_revisao >= 0 AND status_revisao <= 100),
  foto_url TEXT,
  mtbf INTEGER,
  data_inicio_revisao DATE,
  data_prevista_fim DATE,
  posicao_x FLOAT,
  posicao_y FLOAT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_equipamentos_setor ON equipamentos(setor_id);
CREATE INDEX idx_equipamentos_criticidade ON equipamentos(criticidade);
CREATE INDEX idx_equipamentos_status ON equipamentos(status_revisao);
CREATE INDEX idx_equipamentos_nome ON equipamentos(nome);
