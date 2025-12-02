-- Migrations and example RLS policies (2025-11-24)
-- IMPORTANT: revise antes de executar no Supabase SQL Editor
-- Substitua 'ac1f7456-3299-403b-a2f9-31067b4e6837' pelo UID do admin se necessário

-- 1) Adicionar colunas que o frontend espera
ALTER TABLE public.usuarios
  ADD COLUMN IF NOT EXISTS ativo boolean DEFAULT true;

ALTER TABLE public.usuarios
  ADD COLUMN IF NOT EXISTS atualizado_em timestamptz;

-- Opcional: coluna para associar registro de usuário ao auth.uid()
ALTER TABLE public.usuarios
  ADD COLUMN IF NOT EXISTS auth_uid uuid;

-- 2) Adicionar coluna 'tipo' em servicos
ALTER TABLE public.servicos
  ADD COLUMN IF NOT EXISTS tipo text;

-- (Opcional) Criar enum para tipos com valores fixos
-- CREATE TYPE public.servico_tipo AS ENUM ('Preventiva','Preditiva','Corretiva','Melhoria');
-- ALTER TABLE public.servicos ALTER COLUMN tipo TYPE public.servico_tipo USING tipo::public.servico_tipo;

-- 3) Ativar RLS e criar policies de exemplo
-- USAGE: ajuste as policies ao seu modelo de permissões antes de executar.

-- Usuarios table RLS
ALTER TABLE public.usuarios ENABLE ROW LEVEL SECURITY;

-- Leitura: todos autenticados podem selecionar (ajuste se quiser restringir)
CREATE POLICY usuarios_select_authenticated
  ON public.usuarios
  FOR SELECT
  TO authenticated
  USING ( true );

-- Insert: authenticated pode inserir (pode ser restrito por role se preferir)
CREATE POLICY usuarios_insert_authenticated
  ON public.usuarios
  FOR INSERT
  TO authenticated
  WITH CHECK ( true );

-- Update: o próprio usuário (por auth_uid) ou admin UID pode atualizar
CREATE POLICY usuarios_update_own_or_admin
  ON public.usuarios
  FOR UPDATE
  TO authenticated
  USING ( auth.uid() = auth_uid OR auth.uid() = 'ac1f7456-3299-403b-a2f9-31067b4e6837' )
  WITH CHECK ( auth.uid() = auth_uid OR auth.uid() = 'ac1f7456-3299-403b-a2f9-31067b4e6837' );

-- Delete: somente admin UID (substitua se quiser um role diferente)
CREATE POLICY usuarios_delete_admin
  ON public.usuarios
  FOR DELETE
  TO authenticated
  USING ( auth.uid() = 'ac1f7456-3299-403b-a2f9-31067b4e6837' );

-- Equipamentos table RLS (exemplos)
ALTER TABLE public.equipamentos ENABLE ROW LEVEL SECURITY;

-- Opcional: coluna para associar equipamento ao auth.uid(), usada nas policies abaixo
ALTER TABLE public.equipamentos
  ADD COLUMN IF NOT EXISTS auth_uid uuid;

CREATE POLICY equipamentos_select_authenticated
  ON public.equipamentos
  FOR SELECT
  TO authenticated
  USING ( true );

-- Update: owner (auth_uid) or admin can update
CREATE POLICY equipamentos_update_owner_or_admin
  ON public.equipamentos
  FOR UPDATE
  TO authenticated
  USING ( auth.uid() = auth_uid OR auth.uid() = 'ac1f7456-3299-403b-a2f9-31067b4e6837' )
  WITH CHECK ( auth.uid() = auth_uid OR auth.uid() = 'ac1f7456-3299-403b-a2f9-31067b4e6837' );

-- Delete: only admin UID
CREATE POLICY equipamentos_delete_admin
  ON public.equipamentos
  FOR DELETE
  TO authenticated
  USING ( auth.uid() = 'ac1f7456-3299-403b-a2f9-31067b4e6837' );

-- 4) Template seguro para backup + delete de um equipamento (substitua <EQUIPAMENTO_UUID> com o UUID real)
-- Atenção: troque <EQUIPAMENTO_UUID> por um UUID válido entre aspas simples, por exemplo '3f8b1a2c-1234-4bcd-9e0f-111111111111'

-- BEGIN;
--
-- -- Backup das tabelas filhas (cria tabela de backup se não existir e insere as linhas relacionadas)
-- CREATE TABLE IF NOT EXISTS public.backup_ordens_servico AS TABLE public.ordens_servico WITH NO DATA;
-- INSERT INTO public.backup_ordens_servico SELECT * FROM public.ordens_servico WHERE equipamento_id = '<EQUIPAMENTO_UUID>';
--
-- CREATE TABLE IF NOT EXISTS public.backup_equipamentos AS TABLE public.equipamentos WITH NO DATA;
-- INSERT INTO public.backup_equipamentos SELECT * FROM public.equipamentos WHERE id = '<EQUIPAMENTO_UUID>';
--
-- -- Deleta linhas filhas primeiro (adicione outras tabelas filhas se houver)
-- DELETE FROM public.ordens_servico WHERE equipamento_id = '<EQUIPAMENTO_UUID>';
-- DELETE FROM public.equipamentos_componentes WHERE equipamento_id = '<EQUIPAMENTO_UUID>';
-- DELETE FROM public.equipamento_servicos WHERE equipamento_id = '<EQUIPAMENTO_UUID>';
--
-- -- Por fim deleta o equipamento
-- DELETE FROM public.equipamentos WHERE id = '<EQUIPAMENTO_UUID>';
--
-- COMMIT;

-- 5) Observações finais:
-- - Revise cada policy antes de aplicar: especialmente as que usam auth_uid/ou admin UID.
-- - Se você usa associação de usuário por 'email' em vez de 'auth_uid', adapte as policies para comparar o email (ex: USING ( email = current_setting('jwt.claims.email', true) ) ) — isso é menos direto e menos seguro.
-- - Depois de aplicar, teste operações no app com um usuário admin e um usuário comum para validar comportamentos.

-- End of migration file
