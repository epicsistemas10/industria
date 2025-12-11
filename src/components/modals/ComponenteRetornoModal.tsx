import React, { useState } from 'react';
import { storageAPI } from '../../lib/storage';
import { componenteTerceirizadoAPI } from '../../lib/api';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  record: any | null;
  darkMode?: boolean;
  onUpdated?: () => void;
}

export default function ComponenteRetornoModal({ isOpen, onClose, record, darkMode = true, onUpdated }: Props) {
  const [loading, setLoading] = useState(false);
  const [fotos, setFotos] = useState<File[]>([]);
  const [custo, setCusto] = useState<number>(0);
  const [notas, setNotas] = useState<string>('');
  const [dataRetorno, setDataRetorno] = useState<string>(new Date().toISOString().slice(0,10));

  const handleFiles = (files: FileList | null) => {
    if (!files) return;
    setFotos(Array.from(files).slice(0,6));
  };

  const handleSubmit = async () => {
    if (!record) return;
    try {
      setLoading(true);
      let fotosUrls: string[] | null = null;
      if (fotos.length) {
        const folder = `componente_terceirizado/retorno/${record.id}/${Date.now()}`;
        fotosUrls = await storageAPI.uploadMultipleImages(fotos, 'componentes', folder);
      }
      const patch: any = {
        data_retorno: dataRetorno || new Date().toISOString(),
        status: 'retornou',
        custo: custo || null,
      };
      if (fotosUrls && fotosUrls.length) patch.fotos_retorno = fotosUrls;
      if (notas) patch.motivo = (record.motivo ? record.motivo + '\n' : '') + notas;

      await componenteTerceirizadoAPI.update(record.id, patch);
      if (onUpdated) onUpdated();
      onClose();
    } catch (e) {
      console.error('Erro ao marcar retorno', e);
      alert('Erro ao registrar retorno. Veja o console.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !record) return null;

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className={`${darkMode ? 'bg-slate-800' : 'bg-white'} rounded-xl max-w-lg w-full p-6`}> 
        <h3 className="text-xl font-semibold mb-4">Registrar Retorno do Componente</h3>
        <div className="space-y-3">
          <div>
            <div className="text-sm text-gray-300 mb-1">Componente</div>
            <div className="font-medium">{record.componente_id || record.componente_nome || '—'}</div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Data de Retorno</label>
            <input type="date" value={dataRetorno} onChange={(e) => setDataRetorno(e.target.value)} className="w-full px-3 py-2 rounded border" />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Custo</label>
            <input type="number" step="0.01" value={custo} onChange={(e) => setCusto(Number(e.target.value))} className="w-full px-3 py-2 rounded border" />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Fotos (retorno)</label>
            <input type="file" accept="image/*" multiple onChange={(e) => handleFiles(e.target.files)} className="w-full" />
            {fotos.length > 0 && <div className="text-sm text-gray-300 mt-2">{fotos.length} imagem(ns) selecionada(s)</div>}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Observações / Nota fiscal</label>
            <textarea value={notas} onChange={(e) => setNotas(e.target.value)} className="w-full px-3 py-2 rounded border" rows={3} />
          </div>

          <div className="flex justify-end gap-2">
            <button onClick={onClose} className="px-4 py-2 rounded bg-gray-300">Cancelar</button>
            <button onClick={handleSubmit} disabled={loading} className="px-4 py-2 rounded bg-green-600 text-white">{loading ? 'Salvando...' : 'Registrar Retorno'}</button>
          </div>
        </div>
      </div>
    </div>
  );
}
