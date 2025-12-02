-- Tabela de Tipos de Componentes
CREATE TABLE IF NOT EXISTS tipos_componentes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome VARCHAR(100) NOT NULL,
  descricao TEXT,
  icone VARCHAR(50),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Inserir tipos padrão
INSERT INTO tipos_componentes (nome, descricao, icone) VALUES
  ('Rolamento', 'Rolamentos e mancais', 'ri-settings-3-line'),
  ('Correia', 'Correias e cintas', 'ri-loop-right-line'),
  ('Engrenagem', 'Engrenagens e transmissões', 'ri-settings-4-line'),
  ('Elétrica', 'Componentes elétricos', 'ri-flashlight-line'),
  ('Hidráulica', 'Componentes hidráulicos', 'ri-drop-line'),
  ('Pneumática', 'Componentes pneumáticos', 'ri-wind-line'),
  ('Estrutural', 'Componentes estruturais', 'ri-building-line'),
  ('Serra', 'Serras e lâminas', 'ri-scissors-line'),
  ('Faca', 'Facas e cortadores', 'ri-knife-line'),
  ('Polia', 'Polias e roldanas', 'ri-record-circle-line'),
  ('Eixo', 'Eixos e árvores', 'ri-git-commit-line'),
  ('Filtro', 'Filtros diversos', 'ri-filter-3-line')
ON CONFLICT DO NOTHING;

CREATE INDEX idx_tipos_componentes_nome ON tipos_componentes(nome);
