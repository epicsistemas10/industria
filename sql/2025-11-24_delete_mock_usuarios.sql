-- Lista e apaga usuários mock (2025-11-24)
-- ATENÇÃO: revise antes de executar. Este script faz BACKUP e depois DELETA os usuários que parecem ser mock.
-- Critérios usados: emails contendo '@empresa.com', nomes contendo 'test'/'mock' ou 'Sem nome'.

-- 1) Cria tabela de backup (se não existir)
CREATE TABLE IF NOT EXISTS public.backup_usuarios AS TABLE public.usuarios WITH NO DATA;

-- 2) Visualizar candidatos a remoção (REVISAR antes de apagar)
SELECT id, nome, email, created_at
FROM public.usuarios
WHERE (
  email ILIKE '%@empresa.com' OR
  nome ILIKE '%test%' OR
  nome ILIKE '%mock%' OR
  nome ILIKE 'sem nome' OR
  email ILIKE '%example.com%'
)
ORDER BY created_at DESC;

-- 3) Fazer backup dos candidatos (substitua a condição acima se quiser filtrar diferente)
INSERT INTO public.backup_usuarios
SELECT * FROM public.usuarios
WHERE (
  email ILIKE '%@empresa.com' OR
  nome ILIKE '%test%' OR
  nome ILIKE '%mock%' OR
  nome ILIKE 'sem nome' OR
  email ILIKE '%example.com%'
);

-- 4) Deletar os mesmos registros
DELETE FROM public.usuarios
WHERE (
  email ILIKE '%@empresa.com' OR
  nome ILIKE '%test%' OR
  nome ILIKE '%mock%' OR
  nome ILIKE 'sem nome' OR
  email ILIKE '%example.com%'
);

-- Observações:
-- - Revise o SELECT (passo 2) e verifique se os registros listados são realmente mock antes de rodar os passos 3 e 4.
-- - Se quiser deletar apenas um subconjunto, altere a condição para usar ids específicos (ex: WHERE id IN ('uuid1','uuid2')).
-- - Depois de rodar, os dados removidos ficam em `public.backup_usuarios`.
