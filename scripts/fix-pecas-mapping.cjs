#!/usr/bin/env node
const { createClient } = require('@supabase/supabase-js');
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('ERRO: defina SUPABASE_URL e SUPABASE_KEY como variáveis de ambiente.');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, { auth: { persistSession: false } });

const BATCH = 200;

(async () => {
  console.log('Buscando ids das pecas para atualizar mapping...');
  const { data: rows, error } = await supabase.from('pecas').select('id, quantidade, codigo_produto').limit(100000);
  if (error) {
    console.error('Erro ao buscar pecas:', error);
    process.exit(1);
  }
  if (!rows || rows.length === 0) {
    console.log('Nenhuma peça encontrada. Nada a atualizar.');
    process.exit(0);
  }

  console.log(`Encontradas ${rows.length} peças. Atualizando em lotes de ${BATCH}...`);
  for (let i = 0; i < rows.length; i += BATCH) {
    const batch = rows.slice(i, i + BATCH);
    const promises = batch.map(async (r) => {
      const payload = { saldo_estoque: r.quantidade === null ? null : r.quantidade, codigo_fabricante: r.codigo_produto || null };
      const { error: upErr } = await supabase.from('pecas').update(payload).eq('id', r.id).select('id');
      return upErr ? { id: r.id, error: upErr } : { id: r.id };
    });

    const results = await Promise.all(promises);
    const failed = results.filter(x => x.error);
    if (failed.length > 0) {
      console.error('Erro ao atualizar lote', Math.floor(i / BATCH) + 1, failed[0].error || failed);
      process.exit(1);
    }
    console.log(`Lote ${Math.floor(i / BATCH) + 1} atualizado (${Math.min(i + BATCH, rows.length)}/${rows.length})`);
  }

  console.log('Atualização de mapping concluída com sucesso.');
})();
