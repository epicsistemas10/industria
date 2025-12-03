#!/usr/bin/env node
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('ERRO: defina SUPABASE_URL e SUPABASE_KEY como variáveis de ambiente.');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, { auth: { persistSession: false } });

(async () => {
  try {
    const { data, error } = await supabase
      .from('information_schema.columns')
      .select('column_name, data_type, ordinal_position')
      .eq('table_name', 'pecas')
      .eq('table_schema', 'public')
      .order('ordinal_position', { ascending: true });

    if (error) {
      console.error('Erro ao listar colunas:', error);
      process.exit(1);
    }

    if (!data || data.length === 0) {
      console.log('Nenhuma coluna encontrada para a tabela `pecas` no schema `public`.');
      process.exit(0);
    }

    console.log('Colunas encontradas na tabela `pecas` (schema public):');
    data.forEach((c) => console.log(`- ${c.column_name} (${c.data_type})`));
  } catch (err) {
    console.error('Erro inesperado:', err.message || err);
    process.exit(1);
  }
})();
