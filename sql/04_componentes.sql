-- Tabela de Componentes (Peças)
CREATE TABLE IF NOT EXISTS componentes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome VARCHAR(200) NOT NULL,
  codigo_interno VARCHAR(50),
  codigo_fabricante VARCHAR(50),
  marca VARCHAR(100),
  tipo_id UUID REFERENCES tipos_componentes(id),
  medidas VARCHAR(100),
  estoque_minimo INTEGER DEFAULT 0,
  descricao TEXT,
  foto_url TEXT,
  preco_unitario DECIMAL(10,2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_componentes_tipo ON componentes(tipo_id);
CREATE INDEX idx_componentes_codigo ON componentes(codigo_interno);
CREATE INDEX idx_componentes_nome ON componentes(nome);
