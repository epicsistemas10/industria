#!/usr/bin/env node
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY;
const CODE = process.argv[2] || process.env.CODE;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('ERRO: defina SUPABASE_URL e SUPABASE_KEY como variáveis de ambiente.');
  process.exit(1);
}
if (!CODE) {
  console.error('ERRO: informe o código como argumento: node query-peca.cjs 095407');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, { auth: { persistSession: false } });

(async () => {
  try {
    // select a conservative set of columns (some deployments may use different column names)
    const { data, error, status } = await supabase
      .from('pecas')
      .select('id,nome,codigo_produto,codigo_fabricante,saldo_estoque,unidade_medida')
      .eq('codigo_produto', CODE);
    console.log('status:', status);
    if (error) {
      console.error('erro:', error);
      process.exit(1);
    } else {
      console.log('rows:', JSON.stringify(data, null, 2));
    }
  } catch (err) {
    console.error('Erro inesperado:', err.message || err);
    process.exit(1);
  }
})();
