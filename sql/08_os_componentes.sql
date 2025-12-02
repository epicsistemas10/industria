-- Tabela de Componentes Usados nas OS
CREATE TABLE IF NOT EXISTS os_componentes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  os_id UUID REFERENCES ordens_servico(id) ON DELETE CASCADE,
  componente_id UUID REFERENCES componentes(id),
  quantidade INTEGER DEFAULT 1,
  custo_unitario DECIMAL(10,2),
  custo_total DECIMAL(10,2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_os_comp_os ON os_componentes(os_id);
CREATE INDEX idx_os_comp_componente ON os_componentes(componente_id);
