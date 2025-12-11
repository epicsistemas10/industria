-- Migration: create componente_terceirizado table
-- Tracks components sent to third-party maintenance

CREATE TABLE IF NOT EXISTS public.componente_terceirizado (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  equipamento_id uuid REFERENCES public.equipamentos(id) ON DELETE CASCADE,
  os_id uuid REFERENCES public.ordens_servico(id) ON DELETE SET NULL,
  componente_id uuid REFERENCES public.componentes(id) ON DELETE SET NULL,
  motivo text,
  data_envio timestamp with time zone DEFAULT now(),
  data_retorno timestamp with time zone DEFAULT NULL,
  status text,
  custo numeric DEFAULT NULL,
  fotos_envio json DEFAULT NULL,
  fotos_retorno json DEFAULT NULL,
  terceiro_id uuid REFERENCES public.terceiros(id) ON DELETE SET NULL,
  created_at timestamp with time zone DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_componente_terceirizado_equipamento_id ON public.componente_terceirizado(equipamento_id);
CREATE INDEX IF NOT EXISTS idx_componente_terceirizado_os_id ON public.componente_terceirizado(os_id);
CREATE INDEX IF NOT EXISTS idx_componente_terceirizado_componente_id ON public.componente_terceirizado(componente_id);
CREATE INDEX IF NOT EXISTS idx_componente_terceirizado_terceiro_id ON public.componente_terceirizado(terceiro_id);
