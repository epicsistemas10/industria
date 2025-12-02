-- Migração: mover registros específicos de `pecas` para `servicos` e removê-los de `pecas`.
-- Ajuste: pega `codigo_fabricante` -> `servicos.codigo`, `nome` -> `servicos.nome`,
-- observa `observacoes` JSON -> `servicos.descricao` e `servicos.tipo` (categoria).
-- Execute no editor SQL do Supabase.

BEGIN;

-- Insere na tabela `servicos` os registros existentes em `pecas` correspondentes aos códigos listados
INSERT INTO servicos (codigo, nome, descricao, tipo)
SELECT
  codigo_fabricante as codigo,
  nome,
  (CASE
    WHEN jsonb_typeof(observacoes) = 'object' THEN (observacoes->>'descricao')
    WHEN jsonb_typeof(to_jsonb(observacoes)) = 'string' THEN (observacoes::jsonb->>'descricao')
    ELSE NULL
  END) as descricao,
  (CASE
    WHEN jsonb_typeof(observacoes) = 'object' THEN (observacoes->>'categoria')
    WHEN jsonb_typeof(to_jsonb(observacoes)) = 'string' THEN (observacoes::jsonb->>'categoria')
    ELSE NULL
  END) as tipo
FROM pecas
WHERE codigo_fabricante IN (
  'SER001','SER002','SER003','SER004','SER005','SER006','SER007','SER008','SER009',
  'SER030','SER031','SER032','SER050','SER051','SER052','SER080','SER081',
  'SER100','SER101','SER120','SER121','SER140','SER141','SER180','SER181','SER200','SER202','SER209'
);

-- Após inserir em `servicos`, remover das `pecas` os mesmos registros
DELETE FROM pecas WHERE codigo_fabricante IN (
  'SER001','SER002','SER003','SER004','SER005','SER006','SER007','SER008','SER009',
  'SER030','SER031','SER032','SER050','SER051','SER052','SER080','SER081',
  'SER100','SER101','SER120','SER121','SER140','SER141','SER180','SER181','SER200','SER202','SER209'
);

COMMIT;

-- Observações:
-- - Verifique permissões e RLS no Supabase antes de executar (usuário deverá ter permissões de INSERT/DELETE).
-- - Se a tabela `servicos` tiver colunas obrigatórias adicionais, ajuste o INSERT para fornecer valores padrão.
-- - Recomendo executar em transação (como acima) em ambiente de testes primeiro.
