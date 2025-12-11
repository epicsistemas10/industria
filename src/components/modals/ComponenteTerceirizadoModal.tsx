import React, { useEffect, useState } from 'react';
import { componenteTerceirizadoAPI } from '../../lib/api';
import { storageAPI } from '../../lib/storage';
import { supabase } from '../../lib/supabase';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  equipamentoId: string;
  osId?: string;
  darkMode?: boolean;
  onCreated?: () => void;
}

export default function ComponenteTerceirizadoModal({ isOpen, onClose, equipamentoId, osId, darkMode = true, onCreated }: Props) {
  const [components, setComponents] = useState<any[]>([]);
  const [terceiros, setTerceiros] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState<any>({ componente_id: '', motivo: '', terceiro_id: '', data_previsao_retorno: '', fotos: [] });

  useEffect(() => {
    if (!isOpen) return;
    (async () => {
      try {
        if (equipamentoId) {
          // load only components linked to this equipment
          const { data: rows } = await supabase.from('equipamentos_componentes').select('componentes(id, nome)').eq('equipamento_id', equipamentoId);
          const comps = (rows || []).map((r: any) => ({ id: r.componentes?.id, nome: r.componentes?.nome })).filter(Boolean);
          comps.sort((a: any, b: any) => {
            const na = (a.nome || '').toLowerCase();
            const nb = (b.nome || '').toLowerCase();
            return na < nb ? -1 : na > nb ? 1 : 0;
          });
          setComponents(comps || []);
        } else {
          const { data: comps } = await supabase.from('componentes').select('id, nome').order('nome');
          setComponents(comps || []);
        }
      } catch (e) {
        console.warn('Erro ao carregar componentes', e);
        setComponents([]);
      }

      try {
        const { data: t } = await supabase.from('terceiros').select('id, nome').order('nome');
        setTerceiros(t || []);
      } catch (e) {
        // If table doesn't exist, just ignore — we'll allow free text input
        setTerceiros([]);
      }
    })();
  }, [isOpen, equipamentoId]);

  const handleFiles = (files: FileList | null) => {
    if (!files) return;
    const arr = Array.from(files).slice(0, 6); // limit to 6
    setForm((f: any) => ({ ...f, fotos: arr }));
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);
      // upload fotos
      let fotosUrls: string[] = [];
      if (form.fotos && form.fotos.length) {
        const folder = `componente_terceirizado/${equipamentoId}/${Date.now()}`;
        fotosUrls = await storageAPI.uploadMultipleImages(form.fotos, 'componentes', folder);
      }

      const payload: any = {
        equipamento_id: equipamentoId,
        os_id: osId || null,
        componente_id: form.componente_id || null,
        motivo: form.motivo || null,
        status: 'em manutenção',
        fotos_envio: fotosUrls.length ? fotosUrls : null,
      };

      if (form.terceiro_id) payload.terceiro_id = form.terceiro_id;
      if (form.data_previsao_retorno) payload.data_retorno = form.data_previsao_retorno; // store as previsto for now

      await componenteTerceirizadoAPI.create(payload);
      if (onCreated) onCreated();
      onClose();
    } catch (e) {
      console.error('Erro ao criar componente terceirizado', e);
      alert('Erro ao registrar envio do componente. Veja o console.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className={`${darkMode ? 'bg-slate-800' : 'bg-white'} rounded-xl max-w-lg w-full p-6`}> 
        <h3 className="text-xl font-semibold mb-4">Remover / Enviar Componente ao Terceiro</h3>
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium mb-1">Componente</label>
            <select value={form.componente_id} onChange={(e) => setForm({ ...form, componente_id: e.target.value })} className="w-full px-3 py-2 rounded border">
              <option value="">Selecione o componente</option>
              {components.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Motivo</label>
            <textarea value={form.motivo} onChange={(e) => setForm({ ...form, motivo: e.target.value })} className="w-full px-3 py-2 rounded border" rows={3} />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Terceiro / Oficina</label>
            {terceiros.length > 0 ? (
              <select value={form.terceiro_id} onChange={(e) => setForm({ ...form, terceiro_id: e.target.value })} className="w-full px-3 py-2 rounded border">
                <option value="">Selecione o terceirizado</option>
                {terceiros.map(t => <option key={t.id} value={t.id}>{t.nome}</option>)}
              </select>
            ) : (
              <input type="text" value={form.terceiro_id} onChange={(e) => setForm({ ...form, terceiro_id: e.target.value })} placeholder="Nome do terceirizado" className="w-full px-3 py-2 rounded border" />
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Previsão de retorno</label>
            <input type="date" value={form.data_previsao_retorno} onChange={(e) => setForm({ ...form, data_previsao_retorno: e.target.value })} className="w-full px-3 py-2 rounded border" />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Fotos (envio)</label>
            <input type="file" accept="image/*" multiple onChange={(e) => handleFiles(e.target.files)} className="w-full" />
            {form.fotos && form.fotos.length > 0 && (
              <div className="mt-2 text-sm text-gray-300">{form.fotos.length} imagem(ns) selecionada(s)</div>
            )}
          </div>

          <div className="flex justify-end gap-2">
            <button onClick={onClose} className="px-4 py-2 rounded bg-gray-300">Cancelar</button>
            <button onClick={handleSubmit} disabled={loading} className="px-4 py-2 rounded bg-green-600 text-white">{loading ? 'Enviando...' : 'Registrar envio'}</button>
          </div>
        </div>
      </div>
    </div>
  );
}
