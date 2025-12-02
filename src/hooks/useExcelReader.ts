import { useEffect, useState } from 'react';
import * as XLSX from 'xlsx';

export type PecaRow = {
  nome_peca: string;
  saldo_estoque?: number | null;
  valor_unitario?: number | null;
  grupo?: string | null;
  codigo_peca: string;
  // raw original row for debugging if needed
  _raw?: Record<string, any>;
};

export type UseExcelReaderResult = {
  rows: PecaRow[];
  loading: boolean;
  errors: string[];
  warnings: string[];
  parseFile: (file: File | null) => Promise<void>;
  reset: () => void;
};

function normalizeHeader(h: string) {
  return (h || '').toString().trim().toLowerCase().replace(/\s+/g, ' ');
}

function parseNumber(v: any): number | null {
  if (v === null || v === undefined || v === '') return null;
  // remove common thousand separators and currency symbols
  let s = String(v).trim();
  // replace comma decimal if appropriate
  s = s.replace(/\s/g, '');
  // If string contains both '.' and ',', decide which is decimal separator
  if (s.indexOf(',') > -1 && s.indexOf('.') > -1) {
    // assume dot is thousand separator and comma is decimal
    s = s.replace(/\./g, '').replace(/,/g, '.');
  } else {
    // replace comma with dot
    s = s.replace(/,/g, '.');
  }
  // remove any non-numeric except dot and minus
  s = s.replace(/[^0-9.-]/g, '');
  const n = parseFloat(s);
  return Number.isFinite(n) ? n : null;
}

export default function useExcelReader(): UseExcelReaderResult {
  const [rows, setRows] = useState<PecaRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [warnings, setWarnings] = useState<string[]>([]);

  const reset = () => {
    setRows([]);
    setErrors([]);
    setWarnings([]);
    setLoading(false);
  };

  const parseFile = async (file: File | null) => {
    reset();
    if (!file) return;
    setLoading(true);
    const fileName = file.name || '';
    if (!/\.xlsx?$|\.xls$/i.test(fileName)) {
      setErrors(prev => [...prev, 'Formato de arquivo inválido. Use .xlsx ou .xls']);
      setLoading(false);
      return;
    }

    try {
      const ab = await file.arrayBuffer();
      const wb = XLSX.read(ab, { type: 'array' });
      const firstSheetName = wb.SheetNames[0];
      const ws = wb.Sheets[firstSheetName];
      if (!ws) {
        setErrors(prev => [...prev, 'Planilha vazia ou não encontrada']);
        setLoading(false);
        return;
      }

      const rawJson: any[] = XLSX.utils.sheet_to_json(ws, { defval: null });

      if (!Array.isArray(rawJson) || rawJson.length === 0) {
        setWarnings(prev => [...prev, 'Planilha vazia ou sem linhas de dados']);
        setRows([]);
        setLoading(false);
        return;
      }

      // Map headers (case-insensitive) to expected fields
      // Expected mapping from spreadsheet columns to DB fields:
      // Descricao -> nome_peca
      // Saldo Atual -> saldo_estoque
      // C Unitario -> valor_unitario
      // Grupo -> grupo
      // Cod. Produto -> codigo_peca

      const mapped: PecaRow[] = [];
      const localErrors: string[] = [];
      const localWarnings: string[] = [];

      for (let i = 0; i < rawJson.length; i++) {
        const raw = rawJson[i];
        // Normalize keys by header names
        const normalized: Record<string, any> = {};
        Object.keys(raw).forEach(k => {
          normalized[normalizeHeader(k)] = raw[k];
        });

        // find keys by approximate header
        const nome = normalized['descricao'] ?? normalized['descrição'] ?? normalized['descricao '];
        const saldo = normalized['saldo atual'] ?? normalized['saldo_atual'] ?? normalized['saldo'] ?? normalized['quantidade'] ?? null;
        const valor = normalized['c unitario'] ?? normalized['c. unitario'] ?? normalized['c unitário'] ?? normalized['valor unitario'] ?? normalized['valor_unitario'] ?? null;
        const grupo = normalized['grupo'] ?? null;
        const codigo = normalized['cod. produto'] ?? normalized['cod produto'] ?? normalized['codigo produto'] ?? normalized['codigo_produto'] ?? normalized['codigo'] ?? normalized['cod'] ?? null;

        const nomeStr = nome !== null && nome !== undefined ? String(nome).trim() : '';
        const codigoStr = codigo !== null && codigo !== undefined ? String(codigo).trim() : '';

        // Skip only if row is completely empty
        if (!nomeStr && !codigoStr && (saldo === null || saldo === undefined) && (valor === null || valor === undefined) && !grupo) {
          localWarnings.push(`Linha ${i + 2}: vazia — ignorada`);
          continue;
        }

        // Fill defaults: allow missing name or code but provide fallbacks
        const finalCodigo = codigoStr || '';
        const finalNome = nomeStr || finalCodigo || `Sem nome ${i + 2}`;

        const saldoNum = parseNumber(saldo);
        const valorNum = parseNumber(valor);

        const row: PecaRow = {
          nome_peca: finalNome,
          saldo_estoque: saldoNum,
          valor_unitario: valorNum,
          grupo: grupo ? String(grupo).trim() : null,
          codigo_peca: finalCodigo,
          _raw: raw
        };

        mapped.push(row);
      }

      if (mapped.length === 0) {
        localWarnings.push('Nenhuma linha válida encontrada para importação');
      }

      setRows(mapped);
      setErrors(localErrors);
      setWarnings(localWarnings);
    } catch (err: any) {
      console.error('Erro ao ler planilha', err);
      setErrors(prev => [...prev, err?.message || String(err)]);
    } finally {
      setLoading(false);
    }
  };

  return { rows, loading, errors, warnings, parseFile, reset };
}
