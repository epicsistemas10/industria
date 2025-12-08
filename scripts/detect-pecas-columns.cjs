#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('ERRO: defina SUPABASE_URL e SUPABASE_KEY como variáveis de ambiente.');
  process.exit(1);
}

const inputPath = process.argv[2] || path.join(process.cwd(), 'out_pecas.json');
if (!fs.existsSync(inputPath)) {
  console.error('ERRO: arquivo de entrada não encontrado:', inputPath);
  process.exit(1);
}

const raw = fs.readFileSync(inputPath, 'utf8');
let items;
try {
  let s = raw.replace(/:\s*NaN(\s*[,}\]])/g, ': null$1').replace(/:NaN(\s*[,}\]])/g, ': null$1');
  items = JSON.parse(s);
} catch (err) {
  console.error('Erro ao parsear JSON de exemplo:', err.message || err);
  process.exit(1);
}

const keys = Array.isArray(items) && items.length>0 ? Object.keys(items[0]) : [];
if (keys.length === 0) {
  console.error('Nenhuma chave encontrada no JSON de entrada.');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, { auth: { persistSession: false } });

(async () => {
  console.log('Testando quais chaves do JSON existem como colunas em `pecas`...');
  const found = [];
  const missing = [];
  for (const k of keys) {
    try {
      const { data, error, status } = await supabase.from('pecas').select(k).limit(1);
      if (error) {
        missing.push(k);
      } else {
        found.push(k);
      }
    } catch (err) {
      missing.push(k);
    }
  }

  console.log('Colunas detectadas:', found.join(', ') || '(nenhuma)');
  console.log('Chaves do JSON que não são colunas:', missing.join(', ') || '(nenhuma)');
})();
