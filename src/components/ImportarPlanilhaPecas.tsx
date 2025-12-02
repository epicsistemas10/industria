import React, { useState } from 'react';
import useExcelReader, { PecaRow } from '../hooks/useExcelReader';
import { supabase } from '../lib/supabase';
interface ImportarPlanilhaPecasProps {
  onClose?: () => void;
  onImported?: () => void;
}

export default function ImportarPlanilhaPecas({ onClose, onImported }: ImportarPlanilhaPecasProps) {
  const { rows, loading, errors, warnings, parseFile, reset } = useExcelReader();
  const [file, setFile] = useState<File | null>(null);
  const [sending, setSending] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [sendErrors, setSendErrors] = useState<string | null>(null);

  const onFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setSuccessMsg('');
    setSendErrors(null);
    const f = e.target.files && e.target.files[0] ? e.target.files[0] : null;
    setFile(f);
    await parseFile(f);
  };

  const handleImport = async () => {
    setSendErrors(null);
    setSuccessMsg('');
    if (!rows || rows.length === 0) {
      setSendErrors('Nenhuma linha válida para importar');
      return;
    }

    setSending(true);
    try {
      // Prepare payload mapping to actual DB columns in `pecas` table.
      // The DB schema contains: nome, codigo_fabricante, vida_util_hours, custo_medio, foto, observacoes
      // We'll map known fields and serialize extra fields into `observacoes` as JSON.
      const payload = rows.map(r => {
        // Map fields to new DB columns when available
        return {
          nome: r.nome_peca || 'Sem nome',
          codigo_fabricante: r.codigo_peca || null,
          custo_medio: r.valor_unitario != null ? Number(r.valor_unitario) : null,
          valor_unitario: r.valor_unitario != null ? Number(r.valor_unitario) : null,
          saldo_estoque: r.saldo_estoque != null ? Number(r.saldo_estoque) : 0,
          grupo: r.grupo || null,
          codigo_peca: r.codigo_peca || null,
          observacoes: r._raw ? JSON.stringify({ _raw: r._raw }) : null
        } as any;
      });

      // Attempt insert with retries: if PostgREST complains about unknown columns,
      // remove that column from payload and retry. This makes the importer robust
      // against schema drift where new columns aren't yet present.
      let attemptPayload = payload.map(p => ({ ...p }));
      let inserted: any = null;
      let finalError: any = null;
      const maxAttempts = 6;

      for (let attempt = 0; attempt < maxAttempts; attempt++) {
        const { data, error } = await supabase.from('pecas').insert(attemptPayload);
        if (!error) {
          inserted = data;
          finalError = null;
          break;
        }

        finalError = error;
        const msg = (error && (error.message || '')).toString();
        // Detect PostgREST schema cache error about missing column
        const m = msg.match(/Could not find the '([^']+)' column/i);
        if (m && m[1]) {
          const col = m[1];
          console.warn(`Import: unknown column reported by server: ${col}. Removing and retrying.`);
          // remove this column from attemptPayload
          attemptPayload = attemptPayload.map(obj => {
            const copy: any = { ...obj };
            delete copy[col];
            return copy;
          });
          // continue to next attempt
          continue;
        }

        // If error is not about missing column, stop retrying
        break;
      }

      if (finalError) {
        console.error('Erro ao inserir pecas:', JSON.stringify(finalError, null, 2));
        const msgParts = [finalError.message];
        if ((finalError as any).details) msgParts.push((finalError as any).details);
        if ((finalError as any).hint) msgParts.push(`Hint: ${(finalError as any).hint}`);
        setSendErrors(msgParts.filter(Boolean).join(' — '));
      } else {
        const data = inserted;
        setSuccessMsg(`Importação concluída. ${Array.isArray(data) ? data.length : rows.length} registros enviados.`);
        // reset states
        setFile(null);
        reset();
        // also clear file input (if present in DOM)
        const el = document.getElementById('input-import-pecas') as HTMLInputElement | null;
        if (el) el.value = '';
        try {
          if (onImported) await onImported();
        } catch (e) {
          // ignore fetch errors here
        }
        // close panel after import if requested
        if (onClose) onClose();
      }
    } catch (err: any) {
      console.error(err);
      setSendErrors(err?.message || String(err));
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-6">
      <div className="bg-white dark:bg-slate-800 rounded-lg p-6 shadow">
        <h2 className="text-lg font-semibold mb-4 dark:text-white">Importar Planilha de Peças</h2>

        <div className="flex flex-col items-center gap-3">
          <label htmlFor="input-import-pecas" className="w-full">
            <div className="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer hover:border-blue-400">
              <input id="input-import-pecas" type="file" accept=".xlsx,.xls" onChange={onFileChange} className="hidden" />
              <div className="text-sm text-gray-500 dark:text-gray-300">Arraste e solte ou clique para selecionar um arquivo Excel (.xlsx/.xls)</div>
            </div>
          </label>

          {loading && <div className="text-sm text-gray-500">Lendo planilha...</div>}

          {errors.length > 0 && (
            <div className="w-full bg-red-50 border border-red-200 text-red-700 p-3 rounded">
              {errors.map((err, idx) => (<div key={idx}>{err}</div>))}
            </div>
          )}

          {warnings.length > 0 && (
            <div className="w-full bg-yellow-50 border border-yellow-200 text-yellow-700 p-3 rounded">
              {warnings.map((w, idx) => (<div key={idx}>{w}</div>))}
            </div>
          )}

          <div className="w-full">
            <div className="flex justify-between items-center mb-2">
              <div className="text-sm text-gray-600 dark:text-gray-300">Pré-visualização ({rows.length} linhas)</div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => { setFile(null); reset(); const el = document.getElementById('input-import-pecas') as HTMLInputElement | null; if (el) el.value = ''; }}
                  className="px-3 py-1 bg-gray-200 dark:bg-slate-700 rounded text-sm"
                >Limpar</button>
                <button
                  type="button"
                  onClick={handleImport}
                  disabled={rows.length === 0 || sending}
                  className={`px-4 py-2 rounded text-white ${rows.length === 0 || sending ? 'bg-gray-400 cursor-not-allowed' : 'bg-emerald-600 hover:bg-emerald-700'}`}
                >{sending ? 'Importando...' : 'Importar'}</button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="text-left">
                  <tr>
                    <th className="px-2 py-1 font-medium dark:text-gray-300">Nome</th>
                    <th className="px-2 py-1 font-medium dark:text-gray-300">Código</th>
                    <th className="px-2 py-1 font-medium dark:text-gray-300">Saldo</th>
                    <th className="px-2 py-1 font-medium dark:text-gray-300">Valor Unit.</th>
                    <th className="px-2 py-1 font-medium dark:text-gray-300">Grupo</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r: PecaRow, idx: number) => (
                    <tr key={idx} className={`${idx % 2 === 0 ? '' : 'bg-gray-50 dark:bg-slate-700'}`}>
                      <td className="px-2 py-1 text-sm dark:text-gray-100">{r.nome_peca}</td>
                      <td className="px-2 py-1 text-sm dark:text-gray-100">{r.codigo_peca}</td>
                      <td className="px-2 py-1 text-sm dark:text-gray-100">{r.saldo_estoque ?? ''}</td>
                      <td className="px-2 py-1 text-sm dark:text-gray-100">{r.valor_unitario ?? ''}</td>
                      <td className="px-2 py-1 text-sm dark:text-gray-100">{r.grupo ?? ''}</td>
                    </tr>
                  ))}
                  {rows.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-2 py-6 text-center text-sm text-gray-500 dark:text-gray-400">Nenhuma linha lida ainda</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {successMsg && (
              <div className="mt-4 p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded">{successMsg}</div>
            )}

            {sendErrors && (
              <div className="mt-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded">{sendErrors}</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
