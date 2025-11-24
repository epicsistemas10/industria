-- Tabela de Setores da Indústria
CREATE TABLE IF NOT EXISTS setores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome VARCHAR(100) NOT NULL,
  descricao TEXT,
  cor VARCHAR(7),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Inserir setores padrão
INSERT INTO setores (nome, descricao, cor) VALUES
  ('Descaroçador', 'Setor de descaroçamento do algodão', '#3B82F6'),
  ('Prensa', 'Setor de prensagem', '#8B5CF6'),
  ('Pneumático', 'Sistema pneumático', '#10B981'),
  ('Misturador', 'Setor de mistura', '#F59E0B'),
  ('Classificação', 'Classificação de fibras', '#EC4899'),
  ('Sala Elétrica', 'Infraestrutura elétrica', '#EF4444'),
  ('Transporte', 'Sistemas de transporte', '#6366F1'),
  ('Limpeza', 'Sistemas de limpeza', '#14B8A6'),
  ('Secagem', 'Secadores', '#F97316'),
  ('Armazenamento', 'Silos e armazéns', '#84CC16')
ON CONFLICT DO NOTHING;

CREATE INDEX idx_setores_nome ON setores(nome);
