-- 20_add_equipamentos_motores.sql
-- Adiciona coluna opcional 'motores' (jsonb) aos equipamentos para armazenar lista de motores/motorredutores

ALTER TABLE IF EXISTS equipamentos
  ADD COLUMN IF NOT EXISTS motores jsonb;

-- Inicializa com array vazio para linhas existentes (opcional)
UPDATE equipamentos SET motores = '[]'::jsonb WHERE motores IS NULL;

-- Índice GIN para consultas por conteúdo JSON (opcional)
-- CREATE INDEX IF NOT EXISTS idx_equipamentos_motores_gin ON equipamentos USING gin (motores jsonb_path_ops);
