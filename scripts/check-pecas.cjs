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
    const { data, error, status } = await supabase.from('pecas').select('*').limit(1);
    console.log('status:', status);
    if (error) {
      console.error('erro:', error);
    } else {
      console.log('row sample:', JSON.stringify(data, null, 2));
    }
  } catch (err) {
    console.error('Erro inesperado:', err.message || err);
  }
})();
