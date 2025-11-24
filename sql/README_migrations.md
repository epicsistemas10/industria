Instruções para aplicar as migrations e policies (2025-11-24)

1) Revisar o arquivo `2025-11-24_migrations_and_rls.sql` antes de executar.

2) Como aplicar (Supabase):
   - Acesse o projeto Supabase -> SQL Editor.
   - Cole o conteúdo do arquivo ou faça upload e execute.

3) Recomendações de segurança:
   - Substitua o UID de admin (`ac1f7456-3299-403b-a2f9-31067b4e6837`) pelo seu UID real ou por uma lista de UIDs confiáveis.
   - Teste políticas em um ambiente de staging antes de aplicar em produção.

4) Como remover a policy temporária de delete (caso usada):
   - EXECUTE: `DROP POLICY IF EXISTS equipamentos_delete_admin ON public.equipamentos;`

5) Backup:
   - O arquivo inclui um bloco template (comentado) para backup + delete de um equipamento. Substitua o placeholder pelo UUID real e remova os comentários antes de executar.

6) Caso de dúvidas: me diga qual comando você quer que eu preencha com um UUID real ou se prefere que eu crie uma policy diferente (ex.: baseada em `perfil`).
