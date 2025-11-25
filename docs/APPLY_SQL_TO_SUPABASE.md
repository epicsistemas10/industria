# Aplicar schema SQL no Supabase

Este repositório contém um arquivo SQL com o schema sugerido para equipamentos, componentes, peças, hotspots e panoramas:

- `sql/2025-11-25_schema_equip_comp_pecas.sql`

Para aplicar o script na sua instância Supabase (recomendado antes de usar a funcionalidade de hotspots/panoramas):

1. Abra o seu projeto Supabase em https://app.supabase.com e entre no seu projeto.
2. Vá em `SQL` → `New query` e cole o conteúdo do arquivo SQL.
3. Execute a query. Revise erros de dependência (por exemplo, extensões ou roles) e corrija conforme necessário.

Alternativa via CLI:

1. Instale `supabase` CLI (se ainda não tiver):

```powershell
pnpm add -g supabase
# ou use npm: npm install -g supabase
```

2. Faça login e selecione o projeto, depois rode o script:

```powershell
supabase login
supabase projects list
# use 'supabase db remote set' ou configure sua connection string
psql < sql/2025-11-25_schema_equip_comp_pecas.sql
```

Observações:
- O arquivo SQL pode criar tabelas chamadas `mapa_hotspots` ou `equipamento_mapa` conforme as versões. O front-end atual trabalha com a tabela `equipamento_mapa` — se você optar por `mapa_hotspots`, ajuste ou crie uma view/alias para compatibilidade.
- Se usar Row Level Security (RLS), verifique as policies para permitir que o usuário conectado (via anon/public key ou service role) consiga ler/escrever nas tabelas necessárias.

Se quiser, eu posso gerar um comando psql completo para aplicar esse arquivo se você fornecer a connection string do banco (recomendo usar uma connection string temporária ou executar manualmente por segurança).
