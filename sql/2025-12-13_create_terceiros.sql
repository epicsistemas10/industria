-- Migration: create terceiros table
-- Simple table to store third-party repair shops (terceiros)

CREATE TABLE IF NOT EXISTS public.terceiros (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome varchar(255) NOT NULL,
  contato json DEFAULT NULL,
  endereco text DEFAULT NULL,
  created_at timestamp with time zone DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_terceiros_nome ON public.terceiros(nome);
