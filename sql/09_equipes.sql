-- Tabela de Equipes de Manutenção
CREATE TABLE IF NOT EXISTS equipes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome VARCHAR(100) NOT NULL,
  tipo VARCHAR(50),
  turno VARCHAR(20),
  status VARCHAR(20) DEFAULT 'Disponível',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de Membros das Equipes
CREATE TABLE IF NOT EXISTS membros_equipe (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  equipe_id UUID REFERENCES equipes(id) ON DELETE CASCADE,
  nome VARCHAR(100) NOT NULL,
  funcao VARCHAR(50),
  telefone VARCHAR(20),
  email VARCHAR(100),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_membros_equipe ON membros_equipe(equipe_id);
