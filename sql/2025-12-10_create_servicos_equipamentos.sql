-- Migration: create servicos_equipamentos table
-- Adds table to store % allocation of services per equipment

CREATE TABLE IF NOT EXISTS public.servicos_equipamentos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  equipamento_id uuid REFERENCES public.equipamentos(id) ON DELETE CASCADE,
  servico_id uuid REFERENCES public.servicos(id) ON DELETE CASCADE,
  percentual numeric NOT NULL,
  concluido boolean NOT NULL DEFAULT false,
  data_conclusao timestamp with time zone DEFAULT NULL,
  created_at timestamp with time zone DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_servicos_equipamentos_equipamento_id ON public.servicos_equipamentos(equipamento_id);
CREATE INDEX IF NOT EXISTS idx_servicos_equipamentos_servico_id ON public.servicos_equipamentos(servico_id);
