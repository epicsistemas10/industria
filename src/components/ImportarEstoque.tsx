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
  valor_unitario: number | null;
  estoque_minimo?: number | null;
  grupo?: string | null;
  _raw?: Record<string, any>;
};

interface ImportarEstoqueProps {
  onClose?: () => void;
  onImported?: () => void;
}

function normalizeHeader(h: string) {
  if (!h && h !== 0) return '';
  // normalize unicode spaces and remove control characters, keep only letters/numbers/space/underscore
  let s = String(h);
  // convert NBSP and other non-standard spaces to normal space
  s = s.replace(/\u00A0/g, ' ');
  // remove control chars
  s = s.replace(/[\x00-\x1F\x7F]/g, '');
  // collapse runs of non-alphanumeric into a single space
  s = s.replace(/[^\p{L}\p{N}_]+/gu, ' ');
  return s.trim().toLowerCase().replace(/\s+/g, ' ');
}

function parseNumber(v: any): number | null {
  if (v === null || v === undefined || v === '') return null;
  let s = String(v).trim();
  // treat dash-only values as null
  if (/^[-–—\u2013\u2014]+$/.test(s)) return null;
  // remove non-breaking spaces and normal whitespace
  s = s.replace(/\u00A0/g, '');
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
  const [fileRowsCount, setFileRowsCount] = useState<number | null>(null);
  const [parsed, setParsed] = useState<ParsedRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [pendentes, setPendentes] = useState<ParsedRow[]>([]);
  const [processing, setProcessing] = useState(false);
  const [totalOps, setTotalOps] = useState(0);
  const [completedOps, setCompletedOps] = useState(0);
  const [processedResult, setProcessedResult] = useState<{ updates: number; news: number } | null>(null);
  const [failedUpdates, setFailedUpdates] = useState<any[]>([]);
  const [preparedUpdates, setPreparedUpdates] = useState<{ match: { field: string; value: any }; payload: any }[]>([]);
  const [parseWarnings, setParseWarnings] = useState<any[]>([]);
  const [groupSuggestions, setGroupSuggestions] = useState<string[]>([]);
  const [groupCodeMap, setGroupCodeMap] = useState<Record<string, string>>({});
  const [mappingText, setMappingText] = useState<string>('');
  const [debugEnableSave, setDebugEnableSave] = useState(false);
  const { success, error } = useToast();

  // resolveGroupName must be available to parsing logic — define it here
  const resolveGroupName = (raw: any): string | null => {
    if (raw === null || raw === undefined) return null;
    let s = String(raw).trim();
    if (!s) return null;
    // If already matches a mapped name, return as-is
    const exactValues = Object.values(groupCodeMap || {});
    if (exactValues.includes(s)) return s;
    // try exact key match
    if (groupCodeMap[s]) return groupCodeMap[s];
    // try to extract first continuous digit sequence (codes often numeric)
    const m = s.match(/(\d+)/);
    if (m && m[1]) {
      const digits = m[1];
      if (groupCodeMap[digits]) return groupCodeMap[digits];
      // try with trimmed leading zeros on mapping keys
      const mapByDigits: Record<string,string> = {};
      Object.keys(groupCodeMap).forEach(k => { mapByDigits[String(k).replace(/^0+/, '')] = groupCodeMap[k]; });
      const digitsTrimmed = digits.replace(/^0+/, '');
      if (mapByDigits[digitsTrimmed]) return mapByDigits[digitsTrimmed];
    }
    // fallback: return original trimmed string (it might already be the name)
    return s;
  };

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
        const grupo = normalized['grupo produto'] ?? normalized['grupo_produto'] ?? normalized['grupo'] ?? normalized['grupo do produto'] ?? null;
        const unidade = normalized['u.m.'] ?? normalized['u.m'] ?? normalized['um'] ?? normalized['unidade medida'] ?? normalized['unidade'] ?? null;
        // prefer explicit columns whenever present in the sheet; be tolerant to headers like 'SALDOEM ESTOQUE' (no strict exact matching)
        const keys = Object.keys(normalized || {});
        const explicitSaldoField = keys.find(k => k && k.toLowerCase().includes('saldo')) ?? null;
        const explicitValorField = keys.find(k => k && k.toLowerCase().includes('valor')) ?? null;
        let saldo = explicitSaldoField ? normalized[explicitSaldoField] : (normalized['saldo em estoque'] ?? normalized['saldo'] ?? normalized['saldo_estoque'] ?? normalized['quantidade'] ?? null);
        let valorTotal = explicitValorField ? normalized[explicitValorField] : (normalized['valor em estoque'] ?? normalized['valor total'] ?? normalized['valor_total'] ?? normalized['valor'] ?? null);

        // skip completely empty rows
        if (!codigo && !descricao && (saldo === null || saldo === undefined) && (valorTotal === null || valorTotal === undefined)) continue;

        // Heuristic: if valorTotal is missing or parsed as zero, try to auto-detect a currency-like column in the raw row
        const detectValorFromRaw = () => {
          try {
            const rawVals = Object.values(raw || {});
            // prefer fields that look like currency: contain comma as decimal separator or have currency symbol
            for (const v of rawVals) {
              if (v === null || v === undefined) continue;
              const s = String(v);
              // quick check: contains digits and either ',' or '.' and at least 2 decimal-like digits
              if (!/[0-9]/.test(s)) continue;
              // look for currency-like pattern: 1.234,56 or 1234,56 or R$ 1.234,56
              if (/[.,][0-9]{2}\b/.test(s) || /r\$/.test(s.toLowerCase())) {
                const n = parseNumber(s);
                if (n !== null && n !== 0) return n;
              }
            }
            // fallback: any numeric non-zero value
            for (const v of rawVals) {
              const n = parseNumber(v);
              if (n !== null && n !== 0) return n;
            }
          } catch (e) {
            // ignore
          }
          return null;
        };

        // If valorTotal is empty or parses to null/0, attempt detection
        const parsedValor = parseNumber(valorTotal);
        if ((parsedValor === null || parsedValor === 0) && raw) {
          const detected = detectValorFromRaw();
          if (detected !== null) {
            valorTotal = detected;
          }
        }

        // AGGRESSIVE HEURISTIC: try to infer saldo and valor_total from other numeric fields
        // Build list of numeric candidates from normalized raw fields
        const numericCandidates: Array<{ key: string; raw: any; parsed: number }> = [];
        Object.entries(normalized).forEach(([k, v]) => {
          const n = parseNumber(v);
          if (n !== null) numericCandidates.push({ key: k, raw: v, parsed: n });
        });

        // Exclude candidates that are likely identifiers (codigo/id/grupo) so we don't mistake them for quantities
        const filteredCandidates = numericCandidates.filter(c => {
          const k = String(c.key || '').toLowerCase();
          // ignore keys that contain code/id hints
          if (/\b(cod|codigo|codi|id|grupo|grupo_)\b/.test(k)) return false;
          // also ignore if the raw string exactly matches the codigo value (avoid using the product code as a numeric candidate)
          try { if (String(c.raw || '').trim() === String(codigo || '').trim()) return false; } catch (e) {}
          return true;
        });

        // helper to choose candidate for valor_total: prefer numbers with decimal part or larger magnitudes
        const chooseValorTotal = (cands: typeof filteredCandidates) => {
          if (!cands.length) return null;
          // prefer those with fractional part
          const frac = cands.filter(c => Math.abs(c.parsed % 1) > 0.000001);
          if (frac.length) return frac[0].parsed;
          // otherwise pick the largest absolute value
          let sorted = [...cands].sort((a, b) => Math.abs(b.parsed) - Math.abs(a.parsed));
          return sorted[0].parsed;
        };

        const chooseSaldo = (cands: typeof filteredCandidates, excludeParsed?: number[]) => {
          if (!cands.length) return null;
          let possible = cands.filter(c => !(excludeParsed || []).includes(c.parsed));
          if (!possible.length) possible = cands;
          // prefer small integers (no fractional part) and reasonable inventory sizes
          const ints = possible.filter(c => Math.abs(c.parsed % 1) < 0.000001 && Math.abs(c.parsed) <= 100000);
          if (ints.length) {
            // pick the smallest positive integer (likely a quantity)
            const positives = ints.filter(c => c.parsed >= 0);
            if (positives.length) return positives.sort((a, b) => a.parsed - b.parsed)[0].parsed;
            return ints[0].parsed;
          }
          // as fallback, pick the smallest magnitude
          return possible.sort((a, b) => Math.abs(a.parsed) - Math.abs(b.parsed))[0].parsed;
        };

        // Only attempt if parsed values are missing
        let finalValorTotal = parseNumber(valorTotal);
        let finalSaldo = parseNumber(saldo);
        try {
          // Only run inference if the corresponding explicit field was NOT present in the sheet
          const wantInferValor = !explicitValorField && (finalValorTotal === null || finalValorTotal === 0);
          const wantInferSaldo = !explicitSaldoField && finalSaldo === null;
          if ((wantInferValor) || wantInferSaldo) {
            // attempt to find candidates excluding codigo-like fields
            const candidates = filteredCandidates;
            if (candidates.length > 0) {
              // if both missing
              if ((wantInferValor) && wantInferSaldo) {
                // prefer valor_total as fractional or largest, saldo as small integer
                const inferredValor = chooseValorTotal(candidates);
                const inferredSaldo = chooseSaldo(candidates, inferredValor !== null ? [inferredValor] : []);
                if (inferredValor !== null && finalValorTotal === null) finalValorTotal = inferredValor;
                if (inferredSaldo !== null && finalSaldo === null) finalSaldo = inferredSaldo;
              } else if ((wantInferValor) && finalSaldo !== null) {
                // find valor_total candidate different from saldo
                const inferredValor = chooseValorTotal(candidates.filter(c => Math.abs(c.parsed - finalSaldo!) > 0.0001));
                if (inferredValor !== null) finalValorTotal = inferredValor;
              } else if (finalValorTotal !== null && wantInferSaldo) {
                const inferredSaldo = chooseSaldo(candidates.filter(c => Math.abs(c.parsed - finalValorTotal!) > 0.0001));
                if (inferredSaldo !== null) finalSaldo = inferredSaldo;
              }
            }
          }
        } catch (e) {
          // ignore heuristic errors
          console.warn('heuristic inference error', e);
        }

        // apply inferred values if found
        if (finalValorTotal !== null && (parseNumber(valorTotal) === null || parseNumber(valorTotal) === 0)) {
          valorTotal = finalValorTotal;
          // debug log when we inferred a valor_total
          try { if (String(codigo).trim() === '000176') console.log('[ImportarEstoque] inferred valor_total=', finalValorTotal); } catch(e){}
        }
        if (finalSaldo !== null && parseNumber(saldo) === null) {
          // set saldo to inferred
          try { if (String(codigo).trim() === '000176') console.log('[ImportarEstoque] inferred saldo=', finalSaldo); } catch(e){}
          // assign back to normalized raw variable so rest of code uses it
          // we keep original 'saldo' variable as raw; but parsed value will be used later when calling parseNumber(saldo)
          // easiest: overwrite saldo with stringified inferred value
          // but ensure we set as numeric-compatible string
          // e.g., 14.4 -> '14.4'
          // keep locale safe by using dot
          saldo = String(finalSaldo);
        }

        const computedValorUnitario = (parseNumber(valorTotal) !== null && parseNumber(saldo) !== null && Number(parseNumber(saldo)) !== 0)
          ? (parseNumber(valorTotal) !== null && parseNumber(saldo) !== null && Number(parseNumber(saldo)) !== 0 ? (parseNumber(valorTotal) as number) / (parseNumber(saldo) as number) : null)
          : null;

        // resolve group using mapping (if sheet contains a code) so pendentes show group names
        const resolvedGrupo = resolveGroupName(grupo);
        mapped.push({
          codigo: codigo ? String(codigo).trim() : '',
          descricao: (descricao ? String(descricao).trim() : ''),
          // default unidade to 'UN' if missing to avoid blocking saves
          unidade: unidade ? String(unidade).trim() : 'UN',
          saldo: parseNumber(saldo),
          valor_total: parseNumber(valorTotal),
          // try computed value, otherwise attempt compute from total/saldo, otherwise leave null
          valor_unitario: computedValorUnitario ?? ((parseNumber(valorTotal) !== null && parseNumber(saldo) !== null && (parseNumber(saldo) as number) !== 0) ? (parseNumber(valorTotal) as number) / (parseNumber(saldo) as number) : null),
          // preserve estoque_minimo as null unless sheet provides a value
          estoque_minimo: null,
          grupo: resolvedGrupo ?? (grupo ? String(grupo).trim() : null),
          _raw: raw
        });

        // targeted debug: if this is the problematic code, log raw and normalized fields
        try {
          if (String(codigo).trim() === '000176') {
            console.groupCollapsed('[ImportarEstoque] DEBUG código 000176 (parsing)');
            console.log('raw row object:', raw);
            console.log('normalized keys/values:', normalized);
            const parsedFields = Object.entries(normalized).map(([k, v]) => ({ key: k, raw: v, parsed: parseNumber(v) }));
            console.table(parsedFields);
            console.groupEnd();
          }
        } catch (e) { /* ignore debug errors */ }
      }

      // detect rows where valor_total parsed as 0/null or saldo is null (possible parsing/header mismatch)
      const warnings: any[] = [];
      for (let i = 0; i < mapped.length; i++) {
        const r = mapped[i];
        const rawVals = Object.entries(r._raw || {}).map(([k, v]) => ({ key: k, normalizedKey: normalizeHeader(String(k)), rawValue: v, parsed: parseNumber(v) }));
        let pushed = false;

        // case A: valor_total is null/0 but raw contains numeric values
        if ((r.valor_total === 0 || r.valor_total === null) && r._raw) {
          const anyNumeric = rawVals.some(rv => rv.parsed !== null && rv.parsed !== 0);
          if (anyNumeric) {
            warnings.push({ index: i, codigo: r.codigo, descricao: r.descricao, reason: 'valor_total null/0 but raw has numeric', raw: r._raw, rawParsed: rawVals });
            pushed = true;
          }
        }

        // case B: saldo is null or not a number (e.g. '-')
        if ((r.saldo === null || r.saldo === undefined) && r._raw && !pushed) {
          warnings.push({ index: i, codigo: r.codigo, descricao: r.descricao, reason: 'saldo null/invalid', raw: r._raw, rawParsed: rawVals });
          pushed = true;
        }

        if (warnings.length >= 40) break;
      }

      setParsed(mapped);
      setFileRowsCount(rawJson.length || mapped.length);
      setParseWarnings(warnings);
      // debug logs to help diagnose parsing issues
      try {
        console.info('[ImportarEstoque] fileRowsCount=', rawJson.length || mapped.length, 'parsed=', mapped.length, 'warnings=', warnings.length);
        console.groupCollapsed('[ImportarEstoque] parsed sample (first 10)');
        console.table(mapped.slice(0, 10).map(m => ({ codigo: m.codigo, descricao: m.descricao, saldo: m.saldo, valor_total: m.valor_total, valor_unitario: m.valor_unitario })));
        console.groupEnd();
        if (warnings.length) {
          console.groupCollapsed('[ImportarEstoque] parse warnings sample');
          console.log(warnings.slice(0, 10));
          console.groupEnd();
        }
      } catch (e) {
        // ignore
      }
    } catch (err: any) {
      console.error('Erro ao ler arquivo', err);
      error('Erro ao ler arquivo. Veja console para detalhes.');
    } finally {
      setLoading(false);
    }
  };

  // load existing groups for suggestions (used in pendentes UI)
  React.useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const { data, error } = await supabase.from('pecas').select('grupo_produto').not('grupo_produto', 'is', null).range(0, 19999);
        if (!error && Array.isArray(data) && mounted) {
          const uniq = Array.from(new Set(data.map((r: any) => (r.grupo_produto || '').toString()).filter(Boolean)));
          setGroupSuggestions(uniq);
        }
      } catch (e) { /* ignore */ }
    })();
    return () => { mounted = false; };
  }, []);

  

  const processarDadosPlanilha = async () => {
    if (!parsed || parsed.length === 0) return;
    setProcessing(true);
    try {
      // show total operations as total parsed rows (updates + new)
      setTotalOps(parsed.length);
      setCompletedOps(0);
      // build lookup: prefer codigo, fallback to descricao
      const codigos = parsed.map(p => p.codigo).filter(Boolean);
      const nomes = parsed.map(p => p.descricao).filter(Boolean);

      // query db for matches by codigo_produto or nome
      // IMPORTANT: avoid building one huge .in(...) list (very long URLs -> net::ERR_FAILED / 400).
      // Instead, fetch in small chunks and merge results. Consider adding a server RPC later.
      const chunkArray = (arr: string[], size: number) => {
        const out: string[][] = [];
        for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
        return out;
      };

      const CHUNK_SIZE = 50; // safe default — adjust if necessary
      let existentes: any[] = [];

      if (codigos.length) {
        const chunks = chunkArray(codigos, CHUNK_SIZE);
        for (const c of chunks) {
          try {
            const { data: byCode, error: byCodeErr } = await supabase.from('pecas').select('*').in('codigo_produto', c).range(0, 19999);
            if (byCodeErr) {
              console.warn('chunked lookup by codigo failed for chunk', c.slice(0,3), '... err=', byCodeErr);
            }
            existentes = existentes.concat(byCode || []);
          } catch (e) {
            console.warn('Unexpected error during chunked codigo lookup', e);
          }
        }
      }

      if (nomes.length) {
        const chunksN = chunkArray(nomes, CHUNK_SIZE);
        for (const c of chunksN) {
          try {
            const { data: byName, error: byNameErr } = await supabase.from('pecas').select('*').in('nome', c).range(0, 19999);
            if (byNameErr) {
              console.warn('chunked lookup by nome failed for chunk', c.slice(0,3), '... err=', byNameErr);
            }
            existentes = existentes.concat(byName || []);
          } catch (e) {
            console.warn('Unexpected error during chunked nome lookup', e);
          }
        }
      }

      // dedupe existentes by id
      const mapExist: Record<string, any> = {};
      (existentes || []).forEach(e => { if (e && e.id) mapExist[e.id] = e; });

      // build maps by codigo and nome for quick lookup
      const byCodigo: Record<string, any> = {};
      const byNome: Record<string, any> = {};
      (existentes || []).forEach(e => { if (e.codigo_produto) byCodigo[String(e.codigo_produto).trim()] = e; if (e.nome) byNome[String(e.nome).trim()] = e; });

      const toUpdate: { match: { field: string; value: any }; payload: any }[] = [];
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
            // apply group from sheet (if provided) — resolve code->name using mapping
            if (row.grupo) {
              const resolved = resolveGroupName(row.grupo);
              if (resolved) payload.grupo_produto = resolved;
            }
            // SALDO (quantidade) must come from the spreadsheet column (e.g. "SALDOEM ESTOQUE")
            if (typeof row.saldo === 'number') {
              payload.saldo_estoque = row.saldo;
              // database column is `quantidade`
              payload.quantidade = row.saldo;
            }
            if (typeof row.valor_total === 'number') payload.valor_total = row.valor_total;
            // compute valor_unitario from valor_total / saldo when both are present in the sheet
            if (typeof row.valor_total === 'number' && typeof row.saldo === 'number' && row.saldo !== 0) {
              payload.valor_unitario = (row.valor_total as number) / (row.saldo as number);
            } else if (typeof row.valor_unitario === 'number') {
              // fallback: use explicitly provided unit value if present in the sheet
              payload.valor_unitario = row.valor_unitario;
            }
          if (Object.keys(payload).length > 0) {
            // prefer matching by codigo_produto or nome to avoid issues with id type mismatches
            if (found.codigo_produto) {
              toUpdate.push({ match: { field: 'codigo_produto', value: String(found.codigo_produto).trim() }, payload, existing: { id: found.id, codigo_produto: found.codigo_produto, quantidade: found.quantidade, saldo_estoque: found.saldo_estoque, valor_unitario: found.valor_unitario, valor_total: found.valor_total } });
            } else if (found.nome) {
              toUpdate.push({ match: { field: 'nome', value: String(found.nome).trim() }, payload, existing: { id: found.id, codigo_produto: found.codigo_produto, quantidade: found.quantidade, saldo_estoque: found.saldo_estoque, valor_unitario: found.valor_unitario, valor_total: found.valor_total } });
            } else {
              toUpdate.push({ match: { field: 'id', value: found.id }, payload, existing: { id: found.id, codigo_produto: found.codigo_produto, quantidade: found.quantidade, saldo_estoque: found.saldo_estoque, valor_unitario: found.valor_unitario, valor_total: found.valor_total } });
            }
          }
        } else {
          newItems.push(row);
        }
      }

      setPendentes(newItems);

      // Do NOT execute updates now. Prepare updates and present them to the user.
      // The user must click "Salvar no sistema" to apply updates and inserts.
      setPreparedUpdates(toUpdate);
      // consider newItems as processed for progress UI (they still require user confirmation to save)
      if (newItems.length > 0) setCompletedOps(prev => prev + newItems.length);

      // debug: log pendentes for inspection
      try {
        console.info('[ImportarEstoque] pendentes count=', newItems.length);
        console.groupCollapsed('[ImportarEstoque] pendentes sample');
        console.table(newItems.slice(0, 10).map(n => ({ codigo: n.codigo, descricao: n.descricao, saldo: n.saldo, valor_total: n.valor_total, valor_unitario: n.valor_unitario })));
        console.groupEnd();
      } catch (e) { /* ignore */ }

      // finished preparing updates; leave pendentes for user confirmation
      setProcessedResult({ updates: toUpdate.length, news: newItems.length });
      // If file had additional rows (blank/ignored), include that info in toast
      if (fileRowsCount && fileRowsCount > parsed.length) {
        success(`Processamento concluído. ${parsed.length} linhas processadas de ${fileRowsCount} lidas. ${toUpdate.length} atualizações prontas. ${newItems.length} novos encontrados.`);
      } else {
        success(`Processamento concluído. ${parsed.length} linhas processadas. ${toUpdate.length} atualizações prontas. ${newItems.length} novos encontrados.`);
      }
      success(`Processamento concluído. ${toUpdate.length} atualizações prontas. ${newItems.length} novos encontrados.`);
    } catch (err: any) {
      console.error('Erro ao processar planilha', err);
      error('Erro ao processar planilha. Veja console para detalhes.');
    } finally {
      setProcessing(false);
      setTotalOps(0);
      setCompletedOps(0);
    }
  };

  const cadastrarNovosProdutos = async (lista: ParsedRow[]) => {
    // 'lista' may be empty — we still want to apply any preparedUpdates detected during processing.
    // Validate required fields only when there are pendentes to insert.
    if (lista && lista.length > 0) {
      for (const it of lista) {
        if (!it.descricao || !it.codigo || !it.unidade) {
          error('Preencha nome, código e unidade para todos os itens pendentes antes de salvar.');
          return;
        }
      }
    }

    try {
      console.info('[ImportarEstoque] cadastrarNovosProdutos called, lista.length=', lista.length);
      // prepare progress UI: total ops = prepared updates + new inserts
      const pendingUpdatesPreview = preparedUpdates || [];
      setProcessing(true);
      setTotalOps((pendingUpdatesPreview.length || 0) + (lista ? lista.length : 0));
      setCompletedOps(0);
      console.groupCollapsed('[ImportarEstoque] pendentes payload sample');
      try { console.table(lista.slice(0,10).map(l => ({ codigo: l.codigo, descricao: l.descricao, saldo: l.saldo, valor_total: l.valor_total, valor_unitario: l.valor_unitario }))); } catch(e) {}
      console.groupEnd();

      // First: apply any prepared updates (these were detected during processing)
      const pendingUpdates = preparedUpdates || [];
      const updateFailures: any[] = [];
      if (pendingUpdates.length > 0) {
        console.info('[ImportarEstoque] applying prepared updates (concurrent batches):', pendingUpdates.length);
        // Concurrent batch runner to speed up many updates. Adjust BATCH_SIZE if needed.
        const BATCH_SIZE = 20;

        const applyUpdate = async (u: any) => {
          try {
            const field = u.match.field;
            const value = u.match.value;
            if (debugEnableSave) {
              // only fetch before when debug is enabled (slower)
              try {
                const { data: b } = await supabase.from('pecas').select('id, codigo_produto, quantidade, saldo_estoque, valor_unitario, valor_total').eq(field, value as any).maybeSingle();
                console.info('[ImportarEstoque] update BEFORE', { match: u.match, before: b, payload: u.payload });
              } catch (e) { /* ignore */ }
            }

            const { error: upErr } = await supabase.from('pecas').update(u.payload).eq(field, value as any);
            if (upErr) {
              console.warn('update error for', field, value, upErr);
              updateFailures.push({ match: u.match, payload: u.payload, error: upErr });
            } else if (debugEnableSave) {
              // only fetch after when debug is enabled
              try {
                const { data: a } = await supabase.from('pecas').select('id, codigo_produto, quantidade, saldo_estoque, valor_unitario, valor_total').eq(field, value as any).maybeSingle();
                console.info('[ImportarEstoque] update AFTER', { match: u.match, after: a });
              } catch (e) { /* ignore */ }
            }
            setCompletedOps(prev => prev + 1);
          } catch (e) {
            console.error('unexpected update error', e);
            updateFailures.push({ match: u.match, payload: u.payload, error: e });
            setCompletedOps(prev => prev + 1);
          }
        };

        for (let i = 0; i < pendingUpdates.length; i += BATCH_SIZE) {
          const batch = pendingUpdates.slice(i, i + BATCH_SIZE);
          await Promise.all(batch.map(u => applyUpdate(u)));
        }
      }

      // record failures to state so user can retry
      if (updateFailures.length > 0) {
        setFailedUpdates(prev => [...prev, ...updateFailures.map(f => ({ item: { match: f.match, payload: f.payload }, error: f.error }))]);
        error(`Falha em ${updateFailures.length} atualizações. Verifique os itens e tente novamente.`);
      } else if (pendingUpdates.length > 0) {
        success(`Atualizações aplicadas: ${pendingUpdates.length}`);
        // clear prepared data and UI preview since updates were applied
        setPreparedUpdates([]);
        setPendentes([]);
        setParsed([]);
        setProcessedResult(null);
        // finalize progress and close modal
        setCompletedOps(prev => prev + 0);
        setProcessing(false);
        if (onImported) await onImported();
        if (onClose) onClose();
        // if there were no new items to insert (lista is empty), finish here
        if (!lista || lista.length === 0) return;
      }

      // Clear prepared updates regardless (we recorded failures separately)
      setPreparedUpdates([]);

      // Now proceed to insert new products (lista)
      const payload = lista.map(it => {
        const p: any = {
          nome: it.descricao,
          codigo_produto: it.codigo,
          unidade_medida: it.unidade,
          grupo_produto: it.grupo ?? null,
        };
        if (typeof it.saldo === 'number') {
          p.quantidade = it.saldo;
          p.saldo_estoque = it.saldo;
        }
        if (typeof it.valor_total === 'number') p.valor_total = it.valor_total;
        // compute valor_unitario from valor_total / quantidade (saldo) when possible
        if (typeof it.valor_unitario === 'number') {
          p.valor_unitario = it.valor_unitario;
        } else if (typeof it.valor_total === 'number' && typeof it.saldo === 'number' && it.saldo !== 0) {
          p.valor_unitario = (it.valor_total as number) / (it.saldo as number);
        } else {
          p.valor_unitario = null;
        }
        p.estoque_minimo = typeof it.estoque_minimo === 'number' ? it.estoque_minimo : null;
        return p;
      });

      // Remove codes that already exist to avoid duplicate-key errors
      const codes = payload.map(p => p.codigo_produto).filter(Boolean);
      if (codes.length) {
        const { data: existing = [] } = await supabase.from('pecas').select('codigo_produto').in('codigo_produto', codes as string[]).range(0, 19999);
        const existingSet = new Set((existing || []).map((e: any) => String(e.codigo_produto).trim()));
        const filtered = payload.filter(p => !existingSet.has(String(p.codigo_produto).trim()));
        if (filtered.length === 0) {
          success('Nenhum novo produto para inserir (já existem no sistema).');
          setPendentes([]);
          setParsed([]);
          setProcessedResult(null);
          setProcessing(false);
          if (onImported) await onImported();
          if (onClose) onClose();
          return;
        }

        // Try upsert on codigo_produto to be safer (will update if exists)
        let attemptPayload = filtered.map(p => ({ ...p }));
        try {
          const { data, error: upsertErr } = await supabase.from('pecas').upsert(attemptPayload, { onConflict: 'codigo_produto' });
          if (upsertErr) {
            console.warn('Upsert errored, fallback to insert attempt', upsertErr);
          } else {
            success(`Inseridos/atualizados ${Array.isArray(data) ? data.length : 0} produtos`);
            setPendentes([]);
            setParsed([]);
            setProcessedResult(null);
            setProcessing(false);
            if (onImported) await onImported();
            if (onClose) onClose();
            return;
          }
        } catch (e) {
          console.warn('Upsert threw', e);
        }

        // fallback insert with retry removing unknown columns
        let finalError: any = null;
        let attemptPayload2 = attemptPayload.map(p => ({ ...p }));
        for (let attempt = 0; attempt < 6; attempt++) {
          const { data, error: insertErr } = await supabase.from('pecas').insert(attemptPayload2);
          if (!insertErr) {
            success(`Inseridos ${Array.isArray(data) ? data.length : 0} novos produtos`);
            setPendentes([]);
            setParsed([]);
            setProcessedResult(null);
            setProcessing(false);
            if (onImported) await onImported();
            if (onClose) onClose();
            return;
          }
          finalError = insertErr;
          const msg = String(insertErr.message || insertErr);
          if (insertErr && (insertErr as any).code === '23505') {
            const detail = (insertErr as any).details || '';
            const mdup = detail.match(/Key \(([^)]+)\)=\(([^)]+)\) already exists/);
            if (mdup) {
              const col = mdup[1];
              const val = mdup[2];
              attemptPayload2 = attemptPayload2.filter(obj => String(obj[col]) !== val);
              if (attemptPayload2.length === 0) {
                success('Inserção concluída parcialmente; restos já existiam.');
                setPendentes([]);
                setParsed([]);
                if (onImported) await onImported();
                return;
              }
              continue;
            }
          }
          const m = msg.match(/Could not find the '([^']+)' column/i);
          if (m && m[1]) {
            const col = m[1];
            attemptPayload2 = attemptPayload2.map(obj => { const copy: any = { ...obj }; delete copy[col]; return copy; });
            continue;
          }
          break;
        }
        console.error('Erro ao inserir novos produtos', finalError);
        setProcessing(false);
        error('Erro ao inserir novos produtos. Veja console para detalhes.');
      } else {
        // nothing to insert
        success('Nenhum novo produto para inserir.');
        setPendentes([]);
        setParsed([]);
        setProcessedResult(null);
        setProcessing(false);
        if (onImported) await onImported();
        if (onClose) onClose();
      }
    } catch (err: any) {
      console.error(err);
      error('Erro ao inserir novos produtos. Veja console para detalhes.');
      setProcessing(false);
    }
    finally {
      // ensure processing flag is cleared
      setProcessing(false);
      setTotalOps(0);
      setCompletedOps(0);
    }
  };

  // helpers to update pendente fields in UI
  const updatePendenteField = (idx: number, key: keyof ParsedRow, value: any) => {
    setPendentes(prev => prev.map((p, i) => i === idx ? ({ ...p, [key]: value }) : p));
  };

  // Consider pendentes valid when they have at least code and description.
  // We auto-fill unidade, valor_unitario and estoque_minimo with sane defaults above.
  const allPendentesValid = pendentes.length > 0 && pendentes.every(p => p.descricao && p.codigo);

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

        {/* Group code -> name mapping: paste JSON here (optional) */}
        <div className="mb-4">
          <div className="text-xs text-gray-600 dark:text-gray-300 mb-2">Mapa de grupos (opcional): cole o JSON de mapeamento {`[{"codigo":"0623005","grupo":"PARAFUSOS..."}, ...]`}</div>
          <textarea value={mappingText} onChange={(e) => setMappingText(e.target.value)} placeholder='Cole aqui o JSON com código->grupo' className="w-full h-24 p-2 border rounded bg-white/5 text-xs" />
          <div className="flex items-center gap-2 mt-2">
            <button onClick={() => {
              try {
                const parsedMap = JSON.parse(mappingText || '[]');
                if (!Array.isArray(parsedMap)) throw new Error('JSON deve ser um array');
                const map: Record<string,string> = {};
                parsedMap.forEach((it: any) => {
                  if (!it || !it.codigo) return;
                  const key = String(it.codigo).trim();
                  const val = String(it.grupo || it.nome || it.group || '').trim();
                  if (!val) return;
                  map[key] = val;
                  // also add trimmed-leading-zero key for flexibility
                  map[String(key).replace(/^0+/, '')] = val;
                });
                setGroupCodeMap(map);
                // merge mapped names into suggestions
                const names = Object.values(map).filter(Boolean);
                setGroupSuggestions(prev => Array.from(new Set([...(prev || []), ...names])));
                success('Mapeamento carregado. Os códigos serão resolvidos ao processar a planilha.');
              } catch (e: any) {
                console.error('Erro ao carregar mapeamento', e);
                error('JSON inválido. Verifique o formato.');
              }
            }} className="px-3 py-2 rounded bg-blue-600 text-white text-sm">Carregar mapeamento</button>
            <button onClick={() => { setMappingText(''); setGroupCodeMap({}); success('Mapeamento limpo.'); }} className="px-3 py-2 rounded bg-gray-200 text-sm">Limpar mapeamento</button>
          </div>
        </div>

        <div className="mb-4">
          <button onClick={processarDadosPlanilha} disabled={parsed.length === 0 || processing} className={`px-4 py-2 rounded text-white ${parsed.length === 0 || processing ? 'bg-gray-400' : 'bg-emerald-600 hover:bg-emerald-700'}`}>{processing ? 'Processando...' : 'Processar Planilha'}</button>
        </div>

        {processing && totalOps > 0 && (
          <div className="mb-4">
            {(() => {
              const percent = totalOps > 0 ? Math.round((completedOps / totalOps) * 100) : 0;
              return (
                <>
                  <div className="text-sm text-gray-600 dark:text-gray-300 mb-1">Processando: {completedOps}/{totalOps} ({percent}%)</div>
                  <div className="w-full h-3 bg-gray-200 rounded overflow-hidden">
                    <div className="h-3 bg-emerald-600" style={{ width: `${percent}%` }} />
                  </div>
                </>
              );
            })()}
          </div>
        )}

        {/* Show confirmation and top Save/Cancel after processing so buttons are visible */}
        {!processing && processedResult && (
          <div className="mb-4 p-3 border rounded bg-gray-50 dark:bg-slate-800">
            <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-700 dark:text-gray-300">Processado: <strong>{processedResult.updates}</strong> atualizações prontas e <strong>{processedResult.news}</strong> novos produtos encontrados.</div>
                      <div className="flex items-center gap-2">
                        {/* If there are no pendentes but updates were applied, inform the user. */}
                        <button disabled={!(allPendentesValid || (processedResult && processedResult.updates > 0) || debugEnableSave)} onClick={async () => {
                          console.info('[ImportarEstoque] Salvar button clicked', { preparedUpdatesCount: preparedUpdates.length, pendentesCount: pendentes.length, processedResult });
                          try {
                            await cadastrarNovosProdutos(pendentes);
                          } catch (e) {
                            console.error('[ImportarEstoque] salvar handler error', e);
                            error('Erro ao salvar. Veja console para detalhes.');
                          }
                        }} className={`px-4 py-2 rounded text-white ${!(allPendentesValid || (processedResult && processedResult.updates > 0) || debugEnableSave) ? 'bg-gray-400' : 'bg-blue-600 hover:bg-blue-700'}`}>Salvar no sistema</button>
                        {processedResult.updates > 0 && (pendentes.length === 0) && (
                          <div className="text-xs text-gray-600 dark:text-gray-300 ml-3">(Atualizações aplicadas automaticamente; nenhum novo produto para salvar.)</div>
                        )}
                        {failedUpdates.length > 0 && (
                          <button onClick={async () => {
                            // retry failed updates
                            try {
                              const retryItems = failedUpdates.map(f => f.item);
                              setFailedUpdates([]);
                              // attempt retries sequentially to avoid overloading the server
                              for (const u of retryItems) {
                                const field = u.match.field;
                                const value = u.match.value;
                                const { error: upErr } = await supabase.from('pecas').update(u.payload).eq(field, value as any);
                                if (upErr) console.warn('Retry update failed', upErr, u);
                              }
                              success('Tentativa de reexecução concluída. Verifique console para possíveis falhas.');
                            } catch (e) { console.error(e); error('Erro ao reexecutar atualizações. Veja console.'); }
                          }} className="px-3 py-2 rounded bg-yellow-500 text-white">Repetir atualizações falhas ({failedUpdates.length})</button>
                        )}
                        <button onClick={() => { setPendentes([]); setProcessedResult(null); }} className="px-3 py-2 rounded bg-gray-200">Cancelar</button>
                        <button onClick={() => setDebugEnableSave(d => !d)} className={`px-3 py-2 rounded ${debugEnableSave ? 'bg-yellow-400' : 'bg-gray-100'}`}>{debugEnableSave ? 'Desativar debug' : 'Habilitar Salvar (debug)'}</button>
                      </div>
                </div>
          </div>
        )}

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

        {parseWarnings.length > 0 && (
          <div className="mb-4 p-3 border rounded bg-yellow-50">
            <div className="text-sm font-semibold mb-2">Aviso: possíveis valores não reconhecidos</div>
            <div className="text-xs text-gray-700 mb-2">Foram encontradas linhas em que o parser retorna valor total zerado, mas a linha contém valores numéricos — veja exemplos abaixo (máx. 20).</div>
            <div className="overflow-auto max-h-48">
              <table className="min-w-full text-xs">
                <thead>
                  <tr>
                    <th className="px-2 py-1">#</th>
                    <th className="px-2 py-1">Código</th>
                    <th className="px-2 py-1">Descrição</th>
                    <th className="px-2 py-1">Raw (exemplo)</th>
                  </tr>
                </thead>
                <tbody>
                  {parseWarnings.map((w, i) => (
                    <tr key={i} className={`${i % 2 === 0 ? '' : 'bg-white/50'}`}>
                      <td className="px-2 py-1">{w.index + 1}</td>
                      <td className="px-2 py-1">{w.codigo || '-'}</td>
                      <td className="px-2 py-1">{w.descricao || '-'}</td>
                      <td className="px-2 py-1"><pre className="text-xs whitespace-pre-wrap">{JSON.stringify(w.raw)}</pre></td>
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
                      <th className="px-2 py-1">Grupo</th>
                    <th className="px-2 py-1">Unidade medida</th>
                    <th className="px-2 py-1">Quantidade</th>
                    <th className="px-2 py-1">Valor Total</th>
                      <th className="px-2 py-1">Valor Unit.</th>
                      <th className="px-2 py-1">Estoque Min.</th>
                  </tr>
                </thead>
                <tbody>
                  {pendentes.map((p, idx) => (
                    <tr key={idx} className={`${idx % 2 === 0 ? '' : 'bg-gray-50 dark:bg-slate-700'}`}>
                      <td className="px-2 py-1">{idx + 1}</td>
                      <td className="px-2 py-1"><input className="w-36 px-2 py-1 rounded bg-white/5" value={p.codigo} onChange={(e) => updatePendenteField(idx, 'codigo', e.target.value)} /></td>
                      <td className="px-2 py-1"><input className="w-64 px-2 py-1 rounded bg-white/5" value={p.descricao} onChange={(e) => updatePendenteField(idx, 'descricao', e.target.value)} /></td>
                        <td className="px-2 py-1">
                          <input list="import-grupos" className="w-40 px-2 py-1 rounded bg-white/5" value={p.grupo ?? ''} onChange={(e) => updatePendenteField(idx, 'grupo', e.target.value)} />
                          <datalist id="import-grupos">
                            {groupSuggestions.map(g => <option key={g} value={g} />)}
                          </datalist>
                        </td>
                        <td className="px-2 py-1"><input className="w-28 px-2 py-1 rounded bg-white/5" value={p.unidade ?? ''} onChange={(e) => updatePendenteField(idx, 'unidade', e.target.value)} /></td>
                      <td className="px-2 py-1"><input className="w-24 px-2 py-1 rounded bg-white/5 text-right" value={p.saldo ?? ''} onChange={(e) => updatePendenteField(idx, 'saldo', parseNumber(e.target.value))} /></td>
                      <td className="px-2 py-1"><input className="w-32 px-2 py-1 rounded bg-white/5 text-right" value={p.valor_total ?? ''} onChange={(e) => updatePendenteField(idx, 'valor_total', parseNumber(e.target.value))} /></td>
                      <td className="px-2 py-1"><input className="w-32 px-2 py-1 rounded bg-white/5 text-right" value={p.valor_unitario ?? ''} onChange={(e) => updatePendenteField(idx, 'valor_unitario', parseNumber(e.target.value))} /></td>
                        <td className="px-2 py-1"><input className="w-24 px-2 py-1 rounded bg-white/5 text-right" value={p.estoque_minimo ?? ''} onChange={(e) => updatePendenteField(idx, 'estoque_minimo', parseNumber(e.target.value))} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex items-center gap-3">
              <button disabled={!(allPendentesValid || (processedResult && processedResult.updates > 0) || debugEnableSave)} onClick={async () => {
                console.info('[ImportarEstoque] Salvar button (pendentes) clicked', { preparedUpdatesCount: preparedUpdates.length, pendentesCount: pendentes.length, processedResult });
                try {
                  await cadastrarNovosProdutos(pendentes);
                } catch (e) {
                  console.error('[ImportarEstoque] salvar (pendentes) handler error', e);
                  error('Erro ao salvar. Veja console para detalhes.');
                }
              }} className={`px-4 py-2 rounded text-white ${!(allPendentesValid || (processedResult && processedResult.updates > 0) || debugEnableSave) ? 'bg-gray-400' : 'bg-blue-600 hover:bg-blue-700'}`}>Salvar no sistema</button>
              <button onClick={() => setPendentes([])} className="px-3 py-2 rounded bg-gray-200">Cancelar</button>
              <button onClick={() => setDebugEnableSave(d => !d)} className={`px-3 py-2 rounded ${debugEnableSave ? 'bg-yellow-400' : 'bg-gray-100'}`}>{debugEnableSave ? 'Desativar debug' : 'Habilitar Salvar (debug)'}</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
