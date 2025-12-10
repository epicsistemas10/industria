-- Adiciona a coluna page_permissions à tabela usuarios para armazenar permissões por página (JSONB)
-- Execute este arquivo no seu banco Supabase (SQL editor ou psql).

ALTER TABLE IF EXISTS usuarios
  ADD COLUMN IF NOT EXISTS page_permissions jsonb DEFAULT '{}'::jsonb;

-- Garante que colunas antigas com nomes diferentes não conflitam (opcional)
-- ALTER TABLE IF EXISTS usuarios
--   RENAME COLUMN IF EXISTS pagePermissions TO page_permissions;

-- Exemplo de atualização de um usuário (para testar):
-- UPDATE usuarios SET page_permissions = '{"pecas": {"view": true, "edit": true, "delete": false}}'::jsonb WHERE email = 'seu@email.com';
