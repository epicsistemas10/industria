-- Schema for Equipamentos, Componentes, Pecas, Hotspots, Panoramas, Manutencoes
-- Run these statements in Supabase SQL editor. Review before executing.

-- Equipamentos
create table if not exists equipamentos (
  id uuid default gen_random_uuid() primary key,
  nome text not null,
  codigo_interno text unique,
  setor text,
  descricao text,
  foto text,
  data_instalacao date,
  status text default 'ativo', -- ativo / inoperante / manutencao
  created_at timestamptz default now()
);

-- Componentes
create table if not exists componentes (
  id uuid default gen_random_uuid() primary key,
  equipamento_id uuid references equipamentos(id) on delete cascade,
  nome text not null,
  descricao text,
  foto text,
  posicao text,
  created_at timestamptz default now()
);

-- Pecas
create table if not exists pecas (
  id uuid default gen_random_uuid() primary key,
  componente_id uuid references componentes(id) on delete cascade,
  nome text not null,
  codigo_fabricante text,
  vida_util_hours integer,
  custo_medio numeric(12,2),
  foto text,
  observacoes text,
  created_at timestamptz default now()
);

-- Hotspots (mapa)
-- Panoramas / imagens de planta
create table if not exists panoramas (
  id uuid default gen_random_uuid() primary key,
  titulo text,
  url text,
  largura integer,
  altura integer,
  criado_em timestamptz default now()
);

-- Hotspots (mapa)
create table if not exists mapa_hotspots (
  id uuid default gen_random_uuid() primary key,
  equipamento_id uuid references equipamentos(id) on delete set null,
  imagem_id uuid references panoramas(id) on delete cascade,
  x numeric not null,
  y numeric not null,
  titulo text,
  descricao text,
  created_at timestamptz default now()
);
-- Ordens de manutencao
create table if not exists manutencoes (
  id uuid default gen_random_uuid() primary key,
  data timestamptz default now(),
  horimetro numeric,
  tecnico text,
  equipamento_id uuid references equipamentos(id) on delete set null,
  componente_id uuid references componentes(id) on delete set null,
  peca_id uuid references pecas(id) on delete set null,
  observacoes text,
  created_at timestamptz default now()
);

-- Indexes
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = current_schema()
      AND table_name = 'equipamentos'
      AND column_name = 'setor'
  ) THEN
    EXECUTE 'CREATE INDEX IF NOT EXISTS idx_equipamentos_setor ON equipamentos(setor)';
  END IF;
END
$$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = current_schema()
      AND table_name = 'componentes'
      AND column_name = 'equipamento_id'
  ) THEN
    EXECUTE 'CREATE INDEX IF NOT EXISTS idx_componentes_equipamento ON componentes(equipamento_id)';
  END IF;
END
$$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = current_schema()
      AND table_name = 'pecas'
      AND column_name = 'componente_id'
  ) THEN
    EXECUTE 'CREATE INDEX IF NOT EXISTS idx_pecas_componente ON pecas(componente_id)';
  END IF;
END
$$;

-- NOTE: Add RLS policies according to your auth model. This file intentionally
-- does not enable RLS or roles; review and adapt policies before enabling.
