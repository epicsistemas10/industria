-- Adicionar colunas na tabela planejamento_semana
ALTER TABLE planejamento_semana ADD COLUMN IF NOT EXISTS servico_id UUID REFERENCES equipamento_servicos(id) ON DELETE CASCADE;
ALTER TABLE planejamento_semana ADD COLUMN IF NOT EXISTS equipe_id UUID REFERENCES equipes(id) ON DELETE SET NULL;
ALTER TABLE planejamento_semana ADD COLUMN IF NOT EXISTS dia_semana INTEGER;
ALTER TABLE planejamento_semana ADD COLUMN IF NOT EXISTS concluido BOOLEAN DEFAULT false;
ALTER TABLE planejamento_semana ADD COLUMN IF NOT EXISTS data_conclusao TIMESTAMP WITH TIME ZONE;
ALTER TABLE planejamento_semana ADD COLUMN IF NOT EXISTS observacoes TEXT;

-- Adicionar constraint para dia_semana
ALTER TABLE planejamento_semana DROP CONSTRAINT IF EXISTS planejamento_semana_dia_semana_check;
ALTER TABLE planejamento_semana ADD CONSTRAINT planejamento_semana_dia_semana_check CHECK (dia_semana >= 1 AND dia_semana <= 6);

-- Índices
CREATE INDEX IF NOT EXISTS idx_planejamento_semana_servico ON planejamento_semana(servico_id);
CREATE INDEX IF NOT EXISTS idx_planejamento_semana_equipe ON planejamento_semana(equipe_id);
CREATE INDEX IF NOT EXISTS idx_planejamento_semana_dia ON planejamento_semana(dia_semana);
CREATE INDEX IF NOT EXISTS idx_planejamento_semana_concluido ON planejamento_semana(concluido);
