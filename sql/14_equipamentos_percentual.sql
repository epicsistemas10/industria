-- Adicionar coluna de percentual de manutenção nos equipamentos
ALTER TABLE equipamentos ADD COLUMN IF NOT EXISTS percentual_manutencao DECIMAL(5,2) DEFAULT 0;

-- Índice
CREATE INDEX IF NOT EXISTS idx_equipamentos_percentual ON equipamentos(percentual_manutencao);

-- Função para calcular percentual de manutenção
CREATE OR REPLACE FUNCTION calcular_percentual_manutencao(equipamento_uuid UUID)
RETURNS DECIMAL AS $$
DECLARE
  total_servicos INTEGER;
  servicos_concluidos INTEGER;
  percentual DECIMAL;
BEGIN
  -- Contar total de serviços do equipamento
  SELECT COUNT(*) INTO total_servicos
  FROM equipamento_servicos
  WHERE equipamento_id = equipamento_uuid;
  
  -- Se não tem serviços, retorna 0
  IF total_servicos = 0 THEN
    RETURN 0;
  END IF;
  
  -- Contar serviços concluídos na semana atual
  SELECT COUNT(DISTINCT ps.servico_id) INTO servicos_concluidos
  FROM planejamento_semana ps
  WHERE ps.equipamento_id = equipamento_uuid
    AND ps.concluido = true
    AND ps.semana = EXTRACT(WEEK FROM CURRENT_DATE)::INTEGER;
  
  -- Calcular percentual
  percentual := (servicos_concluidos::DECIMAL / total_servicos::DECIMAL) * 100;
  
  RETURN ROUND(percentual, 2);
END;
$$ LANGUAGE plpgsql;

-- Trigger para atualizar percentual automaticamente
CREATE OR REPLACE FUNCTION atualizar_percentual_manutencao()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE equipamentos
  SET percentual_manutencao = calcular_percentual_manutencao(NEW.equipamento_id)
  WHERE id = NEW.equipamento_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_atualizar_percentual ON planejamento_semana;
CREATE TRIGGER trigger_atualizar_percentual
AFTER INSERT OR UPDATE ON planejamento_semana
FOR EACH ROW
EXECUTE FUNCTION atualizar_percentual_manutencao();
