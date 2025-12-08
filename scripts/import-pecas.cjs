#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('ERRO: defina SUPABASE_URL e SUPABASE_KEY como variáveis de ambiente (service role recomendado).');
  process.exit(1);
}

const inputPath = process.argv[2] || path.join(process.cwd(), 'out_pecas.json');
if (!fs.existsSync(inputPath)) {
  console.error('ERRO: arquivo de entrada não encontrado:', inputPath);
  process.exit(1);
}

let items;
try {
  let raw = fs.readFileSync(inputPath, 'utf8');
  // Sanitizações simples para arquivos que contenham valores não-JSON como NaN/Infinity
  // Substitui ocorrências de : NaN  por : null e : Infinity por null
  raw = raw.replace(/:\s*NaN(\s*[,}\]])/g, ': null$1');
  raw = raw.replace(/:\s*Infinity(\s*[,}\]])/g, ': null$1');
  raw = raw.replace(/:\s*-Infinity(\s*[,}\]])/g, ': null$1');
  // Também cobre números NaN sem espaços (e.g. "key":NaN,)
  raw = raw.replace(/:NaN(\s*[,}\]])/g, ': null$1');

  items = JSON.parse(raw);
} catch (err) {
  console.error('ERRO lendo/parsing JSON (após tentativa de sanitização):', err.message || err);
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, { auth: { persistSession: false } });

const normalize = (it) => {
  const q = (v) => (v === null || v === undefined || v === '') ? null : (typeof v === 'string' ? v.trim() : v);
  return {
    grupo_produto: q(it.grupo_produto) || null,
    produto: q(it.produto) || null,
    nome: q(it.produto) || q(it.codigo_produto) || '',
    codigo_produto: q(it.codigo_produto) || null,
    unidade_medida: q(it.unidade_medida) || null,
    quantidade: (it.quantidade === '' || it.quantidade === null || it.quantidade === undefined) ? null : Number(it.quantidade),
    valor_total: (it.valor_total === '' || it.valor_total === null || it.valor_total === undefined) ? null : Number(it.valor_total),
    valor_unitario: (it.valor_unitario === '' || it.valor_unitario === null || it.valor_unitario === undefined) ? null : Number(it.valor_unitario),
  };
};

const data = Array.isArray(items) ? items.map(normalize).filter(i => i.codigo_produto) : [];
if (data.length === 0) {
  console.error('ERRO: nenhum registro válido encontrado para importar. Verifique o arquivo e os campos `codigo_produto`.');
  process.exit(1);
}

const BATCH = 500;
(async () => {
  console.log(`Preparando para importar ${data.length} registros (lotes de ${BATCH}).`);
  let processed = 0;
  for (let i = 0; i < data.length; i += BATCH) {
    const batch = data.slice(i, i + BATCH);
    // Tenta upsert por `codigo_produto` primeiro
    let res = await supabase.from('pecas').upsert(batch, { onConflict: 'codigo_produto', returning: 'minimal' });
    if (res.error) {
      // Se o erro indicar que a coluna `codigo_produto` não existe, refaz como insert
      const isMissingColumn = res.error && (res.error.code === 'PGRST204' || (res.error.message && /Could not find the .*codigo_produto/.test(res.error.message)));
      if (isMissingColumn) {
        console.warn('Coluna `codigo_produto` não encontrada na tabela `pecas`. Tentando inserir os registros sem upsert (podem ocorrer duplicatas).');
        res = await supabase.from('pecas').insert(batch, { returning: 'minimal' });
      }
    }

    if (res.error) {
      console.error('Erro no lote', Math.floor(i / BATCH) + 1, res.error);
      process.exit(1);
    }

    processed += batch.length;
    console.log(`Lote ${Math.floor(i / BATCH) + 1} importado (${processed}/${data.length}).`);
  }
  console.log('Importação finalizada com sucesso.');
})().catch((err) => {
  console.error('Erro durante importação:', err.message || err);
  process.exit(1);
});
