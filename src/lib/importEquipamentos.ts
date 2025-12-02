import * as XLSX from 'xlsx';
import { supabase } from './supabase';
import { equipamentosAPI } from './api';

type RawRow = { [k: string]: any };

const COLUMN_MAP: Record<string, string> = {
  'MAQ_VEC_IMP': 'id',
  'descricao': 'nome',
  'MODELO': 'modelo',
  'marca': 'fabricante',
  'SERIE': 'serie',
  'DIMENSAO': 'dimensao',
  'PES / PESO': 'peso',
  'PES': 'peso',
  'PESO': 'peso',
  'obs': 'linha_setor',
  'data_fabricacao': 'ano_fabricacao'
};

function normalizeText(v: any) {
  if (v === null || typeof v === 'undefined') return '';
  let s = String(v);
  s = s.trim();
  // remove multiple spaces
  s = s.replace(/\s+/g, ' ');
  // remove control chars
  s = s.replace(/[\u0000-\u001F\u007F]/g, '');
  return s;
}

function sanitizeId(v: any) {
  if (v === null || typeof v === 'undefined') return '';
  let s = String(v);
  s = s.trim();
  // remove spaces and special chars, keep alphanumeric, dash and underscore
  s = s.replace(/[^a-zA-Z0-9-_]/g, '');
  return s;
}

function convertYear(value: any) {
  if (!value) return null;
  // if it's a Date
  if (value instanceof Date && !isNaN(value.getTime())) return value.getFullYear();
  // if Excel serialized date (number)
  if (typeof value === 'number') {
    const d = (XLSX as any).SSF ? (XLSX as any).SSF.parse_date_code(value) : null;
    if (d) return d.y;
  }
  // string
  const s = String(value).trim();
  const m = s.match(/(\d{4})/);
  if (m) return parseInt(m[1], 10);
  return null;
}

export async function parseExcelFile(file: File) {
  const arrayBuffer = await file.arrayBuffer();
  const workbook = XLSX.read(arrayBuffer, { type: 'array' });
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  const json: RawRow[] = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

  const items: any[] = [];
  const logs: string[] = [];

  for (let i = 0; i < json.length; i++) {
    const row = json[i];
    // Only process rows that have MAQ_VEC_IMP
    const rawId = row['MAQ_VEC_IMP'] ?? row['maq_vec_imp'] ?? row['MAQ_VEC_IMP'.toLowerCase()];
    if (!rawId || String(rawId).trim() === '') {
      logs.push(`Linha ${i + 2}: sem MAQ_VEC_IMP — ignorada`);
      continue;
    }

    const mapped: any = {};
    for (const [col, target] of Object.entries(COLUMN_MAP)) {
      // support case-insensitive headers
      const val = row[col] ?? row[col.toLowerCase()] ?? row[col.toUpperCase()] ?? row[col.replace(/\s+/g, '')];
      if (typeof val !== 'undefined') {
        mapped[target] = val;
      }
    }

    // mandatory id sanitization
    mapped.id = sanitizeId(row['MAQ_VEC_IMP'] ?? row['maq_vec_imp'] ?? row['MAQ_VEC_IMP'.toLowerCase()]);
    if (!mapped.id) {
      logs.push(`Linha ${i + 2}: MAQ_VEC_IMP inválido após sanitização — ignorada`);
      continue;
    }

    // nome
    mapped.nome = normalizeText(mapped.nome || row['descricao'] || '');
    mapped.modelo = normalizeText(mapped.modelo || row['MODELO'] || '');
    mapped.fabricante = normalizeText(mapped.fabricante || row['marca'] || '');
    mapped.serie = normalizeText(mapped.serie || row['SERIE'] || '');
    mapped.dimensao = normalizeText(mapped.dimensao || row['DIMENSAO'] || '');
    mapped.peso = normalizeText(mapped.peso || row['PES / PESO'] || row['PES'] || row['PESO'] || '');
    mapped.linha_setor = normalizeText(mapped.linha_setor || row['obs'] || '');
    const ano = convertYear(mapped.ano_fabricacao ?? row['data_fabricacao']);
    mapped.ano_fabricacao = ano;

    items.push(mapped);
  }

  // remove duplicates by id within file (keep last)
  const deduped: any[] = [];
  const seen = new Set<string>();
  for (let i = items.length - 1; i >= 0; i--) {
    const it = items[i];
    if (!seen.has(it.id)) {
      seen.add(it.id);
      deduped.unshift(it);
    } else {
      logs.push(`Duplicado no arquivo para id=${it.id} — apenas última ocorrência considerada`);
    }
  }

  return { items: deduped, logs };
}

export async function executeImport(items: any[], onProgress?: (p: number, message?: string) => void) {
  const resultLogs: string[] = [];
  if (!items || items.length === 0) return { created: 0, updated: 0, failed: 0, logs: resultLogs };

  // check existing ids in bulk
  const ids = items.map(i => i.id);
  // Detect which optional columns exist in the DB to avoid sending unknown columns
  const optionalCols = ['codigo_interno', 'serie', 'dimensao', 'peso', 'linha_setor'];
  const existingCols = new Set<string>();
  for (const col of optionalCols) {
    try {
      // Try a minimal select for the column. If the column doesn't exist PostgREST returns PGRST204.
      const { data, error } = await supabase.from('equipamentos').select(col).limit(1);
      if (!error) existingCols.add(col);
    } catch (e) {
      // ignore - column probably doesn't exist
    }
  }

  // Determine whether we can detect existing records by `codigo_interno`.
  const canUseCodigo = existingCols.has('codigo_interno');

  // Supabase REST may fail with very long query strings. Chunk the ids (or codigo_interno values).
  const existingIds = new Set<string>();
  const chunkSize = 100;
  if (canUseCodigo) {
    const codigoValues = items.map(i => i.id);
    for (let i = 0; i < codigoValues.length; i += chunkSize) {
      const chunk = codigoValues.slice(i, i + chunkSize);
      try {
        const { data: existing = [], error: selErr } = await supabase
          .from('equipamentos')
          .select('codigo_interno')
          .in('codigo_interno', chunk as any[]);
        if (selErr) {
          resultLogs.push(`Aviso: falha ao checar presença dos codigo_interno (chunk ${i / chunkSize}): ${selErr.message || selErr}`);
          continue;
        }
        (existing as any[]).forEach((r: any) => existingIds.add(r.codigo_interno));
      } catch (err: any) {
        resultLogs.push(`Aviso: exceção ao checar codigo_interno (chunk ${i / chunkSize}): ${err?.message || String(err)}`);
        continue;
      }
    }
  }

  let created = 0;
  let updated = 0;
  let failed = 0;

  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    try {
      if (onProgress) onProgress(Math.round((i / items.length) * 100), `Processando ${i + 1}/${items.length}`);

      const lookupKey = item.id;
      const existsByCodigo = canUseCodigo && existingIds.has(lookupKey);

      if (existsByCodigo) {
        // Build a DB-safe payload (only existing columns)
        const payloadUpdate: any = {
          nome: item.nome || null,
          fabricante: item.fabricante || null,
          modelo: item.modelo || null,
          ano_fabricacao: item.ano_fabricacao || null,
          descricao: item.descricao || item.linha_setor || null
        };
        // try to resolve setor name -> setor_id if provided
        if (item.linha_setor) {
          try {
            const { data: setorData, error: setorErr } = await supabase
              .from('setores')
              .select('id')
              .ilike('nome', item.linha_setor)
              .limit(1);
            if (!setorErr && setorData && setorData.length > 0) payloadUpdate.setor_id = setorData[0].id;
          } catch (e) {
            // ignore resolution errors
          }
        }
        // update by codigo_interno
        const { error: updErr } = await supabase
          .from('equipamentos')
          .update(payloadUpdate)
          .eq('codigo_interno', lookupKey);
        if (updErr) throw updErr;
        updated++;
        resultLogs.push(`Atualizado codigo_interno=${lookupKey}`);
      } else {
        // Build a DB-safe payload for insert
        const payloadCreate: any = {
          nome: item.nome || null,
          fabricante: item.fabricante || null,
          modelo: item.modelo || null,
          ano_fabricacao: item.ano_fabricacao || null,
          descricao: item.descricao || item.linha_setor || null
        };
        // if DB supports codigo_interno, store MAQ_VEC_IMP there
        if (canUseCodigo) payloadCreate.codigo_interno = item.id;
        if (item.linha_setor) {
          try {
            const { data: setorData, error: setorErr } = await supabase
              .from('setores')
              .select('id')
              .ilike('nome', item.linha_setor)
              .limit(1);
            if (!setorErr && setorData && setorData.length > 0) payloadCreate.setor_id = setorData[0].id;
          } catch (e) {
            // ignore
          }
        }
        // create without forcing UUID id
        const { error: insErr } = await supabase
          .from('equipamentos')
          .insert([payloadCreate]);
        if (insErr) throw insErr;
        created++;
        resultLogs.push(`Criado ${canUseCodigo ? `codigo_interno=${item.id}` : `nome=${item.nome || '<sem nome>'}`}`);
      }
    } catch (err: any) {
      failed++;
      const msg = err?.message || String(err);
      resultLogs.push(`Falha id=${item.id}: ${msg}`);
    }
  }

  if (onProgress) onProgress(100, 'Concluído');
  return { created, updated, failed, logs: resultLogs };
}

export default { parseExcelFile, executeImport };
