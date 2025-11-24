-- Tabela de serviços dos equipamentos
CREATE TABLE IF NOT EXISTS equipamento_servicos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  equipamento_id UUID REFERENCES equipamentos(id) ON DELETE CASCADE,
  nome VARCHAR(255) NOT NULL,
  descricao TEXT,
  percentual_revisao DECIMAL(5,2) DEFAULT 0,
  ordem INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Habilitar RLS
ALTER TABLE equipamento_servicos ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
CREATE POLICY "Permitir leitura de equipamento_servicos para usuários autenticados"
ON equipamento_servicos FOR SELECT TO authenticated USING (true);

CREATE POLICY "Permitir inserção de equipamento_servicos para usuários autenticados"
ON equipamento_servicos FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Permitir atualização de equipamento_servicos para usuários autenticados"
ON equipamento_servicos FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Permitir exclusão de equipamento_servicos para usuários autenticados"
ON equipamento_servicos FOR DELETE TO authenticated USING (true);

-- Índices
CREATE INDEX idx_equipamento_servicos_equipamento ON equipamento_servicos(equipamento_id);
CREATE INDEX idx_equipamento_servicos_ordem ON equipamento_servicos(ordem);
