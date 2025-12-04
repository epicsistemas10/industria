import React, { useState } from 'react';
import * as XLSX from 'xlsx';
import { supabase } from '../lib/supabase';
import { useToast } from '../hooks/useToast';

type ParsedRow = {
  codigo: string;
  descricao: string;
  unidade: string | null;
  saldo: number | null;
  valor_total: number | null;
  _raw?: Record<string, any>;
};

interface ImportarEstoqueProps {
  onClose?: () => void;
  onImported?: () => void;
}

function normalizeHeader(h: string) {
  return (h || '').toString().trim().toLowerCase().replace(/\s+/g, ' ');
}

function parseNumber(v: any): number | null {
  if (v === null || v === undefined || v === '') return null;
  let s = String(v).trim();
  s = s.replace(/\s/g, '');
  if (s.indexOf(',') > -1 && s.indexOf('.') > -1) {
    s = s.replace(/\./g, '').replace(/,/g, '.');
  } else {
    s = s.replace(/,/g, '.');
  }
  s = s.replace(/[^0-9.-]/g, '');
  const n = parseFloat(s);
  return Number.isFinite(n) ? n : null;
}

export default function ImportarEstoque({ onClose, onImported }: ImportarEstoqueProps) {
  const [fileName, setFileName] = useState<string | null>(null);
  const [parsed, setParsed] = useState<ParsedRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [pendentes, setPendentes] = useState<ParsedRow[]>([]);
  const [processing, setProcessing] = useState(false);
  const { success, error } = useToast();

  const handleFile = async (file: File | null) => {
    setParsed([]);
    setPendentes([]);
    setFileName(file ? file.name : null);
    if (!file) return;
    setLoading(true);
    try {
      const name = (file.name || '').toLowerCase();
      let rawJson: any[] = [];

      if (/\.csv$/i.test(name)) {
        const text = await file.text();
        const ws = XLSX.utils.csv_to_sheet(text);
        rawJson = XLSX.utils.sheet_to_json(ws, { defval: null });
      } else {
        const ab = await file.arrayBuffer();
        const wb = XLSX.read(ab, { type: 'array' });
        const first = wb.SheetNames[0];
        const ws = wb.Sheets[first];
        rawJson = XLSX.utils.sheet_to_json(ws, { defval: null });
      }

      const mapped: ParsedRow[] = [];

      for (let i = 0; i < rawJson.length; i++) {
        const raw = rawJson[i];
        const normalized: Record<string, any> = {};
        Object.keys(raw).forEach(k => normalized[normalizeHeader(k)] = raw[k]);

        // recognize columns requested in spec
        const codigo = normalized['codigo'] ?? normalized['cod. produto'] ?? normalized['cod produto'] ?? normalized['codigo produto'] ?? normalized['codigo_produto'] ?? normalized['codigo'] ?? normalized['cod'] ?? '';
        const descricao = normalized['descricao'] ?? normalized['descrição'] ?? normalized['descricao'] ?? normalized['nome'] ?? '';
        const unidade = normalized['u.m.'] ?? normalized['u.m'] ?? normalized['um'] ?? normalized['unidade medida'] ?? normalized['unidade'] ?? null;
        const saldo = normalized['saldo em estoque'] ?? normalized['saldo'] ?? normalized['saldo_estoque'] ?? normalized['quantidade'] ?? null;
        const valorTotal = normalized['valor em estoque'] ?? normalized['valor total'] ?? normalized['valor_total'] ?? normalized['valor'] ?? null;

        // skip completely empty rows
        if (!codigo && !descricao && (saldo === null || saldo === undefined) && (valorTotal === null || valorTotal === undefined)) continue;

        mapped.push({
          codigo: codigo ? String(codigo).trim() : '',
          descricao: (descricao ? String(descricao).trim() : ''),
          unidade: unidade ? String(unidade).trim() : null,
          saldo: parseNumber(saldo),
          valor_total: parseNumber(valorTotal),
          _raw: raw
        });
      }

      setParsed(mapped);
    } catch (err: any) {
      console.error('Erro ao ler arquivo', err);
      error('Erro ao ler arquivo. Veja console para detalhes.');
    } finally {
      setLoading(false);
    }
  };

  const processarDadosPlanilha = async () => {
    if (!parsed || parsed.length === 0) return;
    setProcessing(true);
    try {
      // build lookup: prefer codigo, fallback to descricao
      const codigos = parsed.map(p => p.codigo).filter(Boolean);
      const nomes = parsed.map(p => p.descricao).filter(Boolean);

      // query db for matches by codigo_produto or nome
      const filters: string[] = [];
      if (codigos.length) filters.push(`codigo_produto=in.(${codigos.map(c => `'${c.replace(/'/g, "''")}')`).join(',')}`);
      if (nomes.length) filters.push(`nome=in.(${nomes.map(n => `'${n.replace(/'/g, "''")}')`).join(',')})`);

      // Fallback to batch select: we'll fetch by code OR name using PostgREST via supabase-js
      const { data: existing = [], error: fetchErr } = await supabase.from('pecas').select('*').or(
        codigos.length && nomes.length ? `codigo_produto.in.(${codigos.map(c => encodeURIComponent(c)).join(',')}) , nome.in.(${nomes.map(n => encodeURIComponent(n)).join(',')})` : ''
      );

      // simpler approach: fetch all pecas that match any codigo or nome by doing two queries if necessary
      let existentes: any[] = [];
      if (codigos.length) {
        const { data: byCode } = await supabase.from('pecas').select('*').in('codigo_produto', codigos);
        existentes = existentes.concat(byCode || []);
      }
      if (nomes.length) {
        const { data: byName } = await supabase.from('pecas').select('*').in('nome', nomes);
        existentes = existentes.concat(byName || []);
      }

      // dedupe existentes by id
      const mapExist: Record<string, any> = {};
      (existentes || []).forEach(e => { if (e && e.id) mapExist[e.id] = e; });

      // build maps by codigo and nome for quick lookup
      const byCodigo: Record<string, any> = {};
      const byNome: Record<string, any> = {};
      (existentes || []).forEach(e => { if (e.codigo_produto) byCodigo[String(e.codigo_produto).trim()] = e; if (e.nome) byNome[String(e.nome).trim()] = e; });

      const toUpdate: { id: any; payload: any }[] = [];
      const newItems: ParsedRow[] = [];

      for (const row of parsed) {
        const code = row.codigo?.trim();
        const name = row.descricao?.trim();
        let found = null;
        if (code && byCodigo[code]) found = byCodigo[code];
        else if (name && byNome[name]) found = byNome[name];

        if (found) {
          // update only estoque/valor_total (and saldo_estoque when column present)
          const payload: any = {};
          if (typeof row.saldo === 'number') payload.saldo_estoque = row.saldo;
          if (typeof row.saldo === 'number') payload.quantidade_estoque = row.saldo;
          if (typeof row.valor_total === 'number') payload.valor_total = row.valor_total;
          if (Object.keys(payload).length > 0) toUpdate.push({ id: found.id, payload });
        } else {
          newItems.push(row);
        }
      }

      setPendentes(newItems);

      // perform updates in batches
      if (toUpdate.length > 0) {
        // chunked updates
        const chunk = 100;
        for (let i = 0; i < toUpdate.length; i += chunk) {
          const batch = toUpdate.slice(i, i + chunk);
          // perform updates sequentially to keep logic simple and avoid huge payloads
          for (const u of batch) {
            // attempt update with robust retry for missing columns
            let attempts = 0;
            const maxAttempts = 4;
            let payload = { ...u.payload };
            while (attempts < maxAttempts) {
              attempts++;
              const { error: upErr } = await supabase.from('pecas').update(payload).eq('id', u.id);
              if (!upErr) break;
              const msg = String(upErr.message || upErr);
              const m = msg.match(/Could not find the '([^']+)' column/i);
              if (m && m[1] && m[1] in payload) {
                delete payload[m[1]];
                continue;
              }
              console.warn('Erro ao atualizar peça', upErr);
              break;
            }
          }
        }
      }

      // finished processing updates; leave pendentes for user confirmation
      success(`Processamento concluído. ${toUpdate.length} atualizações prontas. ${newItems.length} novos encontrados.`);
      if (onImported) await onImported();
    } catch (err: any) {
      console.error('Erro ao processar planilha', err);
      error('Erro ao processar planilha. Veja console para detalhes.');
    } finally {
      setProcessing(false);
    }
  };

  const cadastrarNovosProdutos = async (lista: ParsedRow[]) => {
    if (!lista || lista.length === 0) return;
    // Validate required fields are present in each item
    for (const it of lista) {
      if (!it.descricao || !it.codigo || !it.unidade) {
        error('Preencha nome, código e unidade para todos os itens pendentes antes de salvar.');
        return;
      }
    }

    try {
      const payload = lista.map(it => ({
        nome: it.descricao,
        codigo_produto: it.codigo,
        unidade_medida: it.unidade,
        quantidade_estoque: typeof it.saldo === 'number' ? it.saldo : 0,
        saldo_estoque: typeof it.saldo === 'number' ? it.saldo : 0,
        valor_total: typeof it.valor_total === 'number' ? it.valor_total : null,
        valor_unitario: it.valor_total && it.saldo ? (it.valor_total / (it.saldo || 1)) : null
      }));

      // Try insert with retry removing unknown columns if necessary
      let attemptPayload = payload.map(p => ({ ...p }));
      let finalError: any = null;
      for (let attempt = 0; attempt < 6; attempt++) {
        const { data, error: insertErr } = await supabase.from('pecas').insert(attemptPayload);
        if (!insertErr) {
          success(`Inseridos ${Array.isArray(data) ? data.length : 0} novos produtos`);
          setPendentes([]);
          setParsed([]);
          if (onImported) await onImported();
          return;
        }
        finalError = insertErr;
        const msg = String(insertErr.message || insertErr);
        const m = msg.match(/Could not find the '([^']+)' column/i);
        if (m && m[1]) {
          const col = m[1];
          attemptPayload = attemptPayload.map(obj => { const copy: any = { ...obj }; delete copy[col]; return copy; });
          continue;
        }
        break;
      }
      console.error('Erro ao inserir novos produtos', finalError);
      error('Erro ao inserir novos produtos. Veja console para detalhes.');
    } catch (err: any) {
      console.error(err);
      error('Erro ao inserir novos produtos. Veja console para detalhes.');
    }
  };

  // helpers to update pendente fields in UI
  const updatePendenteField = (idx: number, key: keyof ParsedRow, value: any) => {
    setPendentes(prev => prev.map((p, i) => i === idx ? ({ ...p, [key]: value }) : p));
  };

  const allPendentesValid = pendentes.length > 0 && pendentes.every(p => p.descricao && p.codigo && p.unidade && (p.valor_total !== null));

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white dark:bg-slate-800 rounded-lg p-6 shadow">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold dark:text-white">Importar Estoque Diário</h2>
          <div className="flex items-center gap-2">
            <button onClick={() => { setParsed([]); setPendentes([]); setFileName(null); if (onClose) onClose(); }} className="px-3 py-1 rounded bg-gray-200 dark:bg-slate-700">Fechar</button>
          </div>
        </div>

        <label className="block mb-4">
          <input type="file" accept=".xlsx,.xls,.csv" onChange={(e) => handleFile(e.target.files && e.target.files[0] ? e.target.files[0] : null)} className="hidden" />
          <div className="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer hover:border-blue-400">
            <div className="text-sm text-gray-500 dark:text-gray-300">Arraste e solte ou clique para selecionar um arquivo (.xlsx/.csv)</div>
            {fileName && <div className="text-xs mt-2 text-gray-400">Arquivo: {fileName}</div>}
          </div>
        </label>

        <div className="mb-4">
          <button onClick={processarDadosPlanilha} disabled={parsed.length === 0 || processing} className={`px-4 py-2 rounded text-white ${parsed.length === 0 || processing ? 'bg-gray-400' : 'bg-emerald-600 hover:bg-emerald-700'}`}>{processing ? 'Processando...' : 'Processar Planilha'}</button>
        </div>

        {parsed.length > 0 && (
          <div className="mb-6">
            <div className="text-sm text-gray-600 dark:text-gray-300 mb-2">Linhas detectadas ({parsed.length}) — clique em Processar para aplicar atualizações e identificar novos produtos</div>
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr>
                    <th className="px-2 py-1">Código</th>
                    <th className="px-2 py-1">Descrição</th>
                    <th className="px-2 py-1">Unidade</th>
                    <th className="px-2 py-1">Saldo</th>
                    <th className="px-2 py-1">Valor Total</th>
                  </tr>
                </thead>
                <tbody>
                  {parsed.map((r, idx) => (
                    <tr key={idx} className={`${idx % 2 === 0 ? '' : 'bg-gray-50 dark:bg-slate-700'}`}>
                      <td className="px-2 py-1">{r.codigo}</td>
                      <td className="px-2 py-1">{r.descricao}</td>
                      <td className="px-2 py-1">{r.unidade}</td>
                      <td className="px-2 py-1">{r.saldo ?? '-'}</td>
                      <td className="px-2 py-1">{r.valor_total ?? '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {pendentes.length > 0 && (
          <div className="mb-6">
            <h3 className="font-semibold mb-2 dark:text-white">Produtos novos encontrados ({pendentes.length})</h3>
            <div className="overflow-x-auto mb-3">
              <table className="min-w-full text-sm">
                <thead>
                  <tr>
                    <th className="px-2 py-1">#</th>
                    <th className="px-2 py-1">Código</th>
                    <th className="px-2 py-1">Nome</th>
                    <th className="px-2 py-1">Unidade medida</th>
                    <th className="px-2 py-1">Quantidade</th>
                    <th className="px-2 py-1">Valor Total</th>
                    <th className="px-2 py-1">Valor Unit.</th>
                  </tr>
                </thead>
                <tbody>
                  {pendentes.map((p, idx) => (
                    <tr key={idx} className={`${idx % 2 === 0 ? '' : 'bg-gray-50 dark:bg-slate-700'}`}>
                      <td className="px-2 py-1">{idx + 1}</td>
                      <td className="px-2 py-1"><input className="w-36 px-2 py-1 rounded bg-white/5" value={p.codigo} onChange={(e) => updatePendenteField(idx, 'codigo', e.target.value)} /></td>
                      <td className="px-2 py-1"><input className="w-64 px-2 py-1 rounded bg-white/5" value={p.descricao} onChange={(e) => updatePendenteField(idx, 'descricao', e.target.value)} /></td>
                      <td className="px-2 py-1"><input className="w-28 px-2 py-1 rounded bg-white/5" value={p.unidade ?? ''} onChange={(e) => updatePendenteField(idx, 'unidade', e.target.value)} /></td>
                      <td className="px-2 py-1"><input className="w-24 px-2 py-1 rounded bg-white/5 text-right" value={p.saldo ?? ''} onChange={(e) => updatePendenteField(idx, 'saldo', parseNumber(e.target.value))} /></td>
                      <td className="px-2 py-1"><input className="w-32 px-2 py-1 rounded bg-white/5 text-right" value={p.valor_total ?? ''} onChange={(e) => updatePendenteField(idx, 'valor_total', parseNumber(e.target.value))} /></td>
                      <td className="px-2 py-1">{(p.valor_total != null && p.saldo != null && p.saldo !== 0) ? `R$ ${(p.valor_total / (p.saldo || 1)).toFixed(2)}` : '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex items-center gap-3">
              <button disabled={!allPendentesValid} onClick={() => cadastrarNovosProdutos(pendentes)} className={`px-4 py-2 rounded text-white ${!allPendentesValid ? 'bg-gray-400' : 'bg-blue-600 hover:bg-blue-700'}`}>Salvar no sistema</button>
              <button onClick={() => setPendentes([])} className="px-3 py-2 rounded bg-gray-200">Cancelar</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
