import { useState } from 'react';
import { useForm } from 'react-hook-form';
import EquipamentoModal from './modals/EquipamentoModal';
import { parseExcelFile, executeImport } from '../lib/importEquipamentos';

export default function ImportarEquipamentos({ onComplete }: { onComplete?: () => void } = {}) {
  const { register, handleSubmit } = useForm();
  const [previewItems, setPreviewItems] = useState<any[]>([]);
  const [logs, setLogs] = useState<string[]>([]);
  const [progress, setProgress] = useState(0);
  const [loading, setLoading] = useState(false);
  const [openModal, setOpenModal] = useState(false);
  const [initialData, setInitialData] = useState<any | null>(null);

  const onFile = async (data: any) => {
    const file: File = data.file[0];
    if (!file) return;
    setLoading(true);
    try {
      const { items, logs } = await parseExcelFile(file);
      setPreviewItems(items);
      setLogs(logs);
    } catch (err) {
      setLogs([`Erro ao ler o arquivo: ${String(err)}`]);
    } finally {
      setLoading(false);
    }
  };

  const onImportNow = async () => {
    setLoading(true);
    setLogs([]);
    setProgress(0);
    const onProgress = (p: number, message?: string) => {
      setProgress(p);
      if (message) setLogs((l) => [...l, message]);
    };

    try {
      const res = await executeImport(previewItems, onProgress);
      setLogs((l) => [...l, `Criados: ${res.created}, Atualizados: ${res.updated}, Falhas: ${res.failed}`]);
      if (typeof onComplete === 'function') onComplete();
    } catch (err) {
      setLogs((l) => [...l, `Erro durante importação: ${String(err)}`]);
    } finally {
      setLoading(false);
      setProgress(100);
    }
  };

  const openInModal = (item: any) => {
    setInitialData(item);
    setOpenModal(true);
  };

  return (
    <div className="p-4 bg-gray-900 rounded-lg border border-gray-800">
      <form onSubmit={handleSubmit(onFile)} className="flex items-center gap-3">
        <input {...register('file')} type="file" accept=".xlsx,.xls,.csv" />
        <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded">Escolher Arquivo</button>
      </form>

      <div className="mt-4">
        <div className="w-full bg-gray-800 rounded h-3 overflow-hidden">
          <div className="bg-green-500 h-3 transition-all" style={{ width: `${progress}%` }} />
        </div>
      </div>

      <div className="mt-4">
        <h4 className="text-white font-medium mb-2">Itens encontrados ({previewItems.length})</h4>
        <div className="max-h-56 overflow-y-auto bg-slate-800 rounded p-2">
          {previewItems.map((it, idx) => (
            <div key={it.id || idx} className="flex items-center justify-between p-2 border-b border-slate-700">
              <div>
                <div className="text-sm text-white">{it.nome || '-'} <span className="text-xs text-gray-400">({it.id})</span></div>
                <div className="text-xs text-gray-400">{it.modelo || ''} {it.fabricante ? `· ${it.fabricante}` : ''}</div>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => openInModal(it)} className="px-3 py-1 bg-slate-700 text-white rounded">Abrir</button>
              </div>
            </div>
          ))}
          {previewItems.length === 0 && <div className="text-gray-400 text-sm">Nenhum item carregado.</div>}
        </div>
      </div>

      <div className="mt-4 flex gap-2">
        <button onClick={onImportNow} disabled={loading || previewItems.length === 0} className="px-4 py-2 bg-green-600 text-white rounded">Importar Agora</button>
      </div>

      <div className="mt-4">
        <h5 className="text-white font-medium">Logs</h5>
        <div className="max-h-40 overflow-y-auto bg-black/30 rounded p-2 text-sm text-gray-300">
          {logs.map((l, i) => <div key={i}>{l}</div>)}
        </div>
      </div>

      {openModal && (
        <EquipamentoModal
          isOpen={openModal}
          onClose={() => { setOpenModal(false); }}
          onSuccess={() => { /* refresh handled elsewhere */ }}
          initialData={initialData}
        />
      )}
    </div>
  );
}
