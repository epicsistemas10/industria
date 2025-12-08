#!/usr/bin/env node
const fs = require('fs');
const xlsx = require('xlsx');

function splitFirstDash(text) {
  if (text === null || text === undefined) return { code: '', name: '' };
  const s = String(text).trim();
  if (!s) return { code: '', name: '' };
  const idx = s.indexOf(' - ');
  if (idx !== -1) return { code: s.slice(0, idx).trim(), name: s.slice(idx + 3).trim() };
  const idx2 = s.indexOf('-');
  if (idx2 !== -1) return { code: s.slice(0, idx2).trim(), name: s.slice(idx2 + 1).trim() };
  return { code: '', name: s };
}

function asNumber(v) {
  if (v === null || v === undefined || v === '') return 0;
  if (typeof v === 'number') return v;
  const cleaned = String(v).replace(/\s+/g, '').replace(/[^0-9,.-]/g, '').replace(/,/g, '.');
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : 0;
}

function findKey(obj, candidates) {
  const keys = Object.keys(obj || {});
  const lower = keys.map(k => k.toLowerCase().trim());
  for (const c of candidates) {
    const idx = lower.indexOf(c.toLowerCase().trim());
    if (idx !== -1) return keys[idx];
  }
  return null;
}

function main() {
  const file = process.argv[2];
  if (!file) {
    console.error('Usage: node excel-to-pecas.cjs <file.xlsx>');
    process.exit(1);
  }
  if (!fs.existsSync(file)) {
    console.error('File not found:', file);
    process.exit(1);
  }

  const wb = xlsx.readFile(file, { cellDates: true });
  const sheetName = wb.SheetNames[0];
  const ws = wb.Sheets[sheetName];
  const rows = xlsx.utils.sheet_to_json(ws, { defval: '' });

  const output = rows.map(row => {
    const grupoKey = findKey(row, ['Grupo de Produto', 'grupo de produto', 'grupo_produto', 'grupo']);
    const produtoKey = findKey(row, ['Produto', 'produto', 'descricao', 'item', 'produto descricao']);
    const unidadeKey = findKey(row, ['Unidade Medida', 'unidade medida', 'unidade_medida', 'unidade']);
    const qtdeKey = findKey(row, ['Qtde Atual', 'Qtde', 'Quantidade', 'quantidade', 'qtde atual']);
    const custoAtualKey = findKey(row, ['Custo Atual', 'CustoAtual', 'valor total', 'valor_total', 'custo_atual']);
    const custoMedioKey = findKey(row, ['Custo Médio', 'Custo Medio', 'CustoMedio', 'valor unitario', 'valor_unitario', 'custo_medio']);

    const grupoRaw = grupoKey ? row[grupoKey] : '';
    const produtoRaw = produtoKey ? row[produtoKey] : '';
    const unidadeRaw = unidadeKey ? row[unidadeKey] : '';
    const qtdeRaw = qtdeKey ? row[qtdeKey] : '';
    const custoAtualRaw = custoAtualKey ? row[custoAtualKey] : '';
    const custoMedioRaw = custoMedioKey ? row[custoMedioKey] : '';

    const grupoParts = splitFirstDash(grupoRaw);
    const produtoParts = splitFirstDash(produtoRaw);

    return {
      grupo_produto: (grupoParts.name || '').trim(),
      produto: (produtoParts.name || '').trim(),
      codigo_produto: (produtoParts.code || '').trim(),
      unidade_medida: String(unidadeRaw || '').trim(),
      quantidade: asNumber(qtdeRaw),
      valor_total: asNumber(custoAtualRaw),
      valor_unitario: asNumber(custoMedioRaw)
    };
  }).filter(item => item.produto || item.codigo_produto || item.grupo_produto || item.quantidade);

  console.log(JSON.stringify(output, null, 2));
}

main();
