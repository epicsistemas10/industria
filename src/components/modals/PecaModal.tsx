import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { usePecas } from '../../hooks/usePecas';
import { storageAPI } from '../../lib/storage';
import { useToast } from '../../hooks/useToast';

interface PecaModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  pecaId?: string;
  darkMode?: boolean;
}

export default function PecaModal({ isOpen, onClose, onSuccess, pecaId, darkMode = true }: PecaModalProps) {
  const [loading, setLoading] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [formData, setFormData] = useState<any>({
    nome: '',
    codigo_interno: '',
    marca: '',
    fabricante: '',
    componente_id: '',
    estoque_minimo: 0,
    quantidade: 0,
    grupo_produto: '',
    codigo_produto: '',
    unidade_medida: '',
    fornecedor: '',
    preco_unitario: 0,
    foto_url: ''
  });
  const [unitSuggestions, setUnitSuggestions] = useState<string[]>([]);
  const [groupSuggestions, setGroupSuggestions] = useState<string[]>([]);
  const [duplicateFound, setDuplicateFound] = useState<{ id: string; nome?: string } | null>(null);

  useEffect(() => {
    if (isOpen) {
      if (pecaId) loadPeca();
      else resetForm();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, pecaId]);

  useEffect(() => {
    // load distinct grupo_produto suggestions
    const loadGroups = async () => {
      try {
        const { data, error } = await supabase.from('pecas').select('grupo_produto').not('grupo_produto', 'is', null);
        if (!error && Array.isArray(data)) {
          const uniq = Array.from(new Set(data.map((r: any) => (r.grupo_produto || '').toString()).filter(Boolean)));
          setGroupSuggestions(uniq);
        }
      } catch (e) {
        // ignore
      }
    };
    const loadUnits = async () => {
      try {
        const { data, error } = await supabase.from('pecas').select('unidade_medida').not('unidade_medida', 'is', null);
        if (!error && Array.isArray(data)) {
          const uniq = Array.from(new Set(data.map((r: any) => (r.unidade_medida || '').toString()).filter(Boolean)));
          setUnitSuggestions(uniq);
        }
      } catch (e) {
        // ignore
      }
    };
    if (isOpen) loadGroups();
    if (isOpen) loadUnits();
  }, [isOpen]);

  const { success, error: showError } = useToast();

  const loadPeca = async () => {
    if (!pecaId) return;
    try {
      setLoading(true);
      const { data, error } = await supabase.from('pecas').select('*').eq('id', pecaId).single();
      if (error) throw error;
      setFormData({
        nome: data.nome || '',
        grupo_produto: data.grupo_produto || '',
        codigo_interno: data.codigo_interno || '',
        codigo_produto: data.codigo_produto || '',
        marca: data.marca || '',
        fabricante: data.fabricante || '',
        componente_id: data.componente_id || '',
        estoque_minimo: data.estoque_minimo ?? 0,
        quantidade: data.saldo_estoque != null ? Number(data.saldo_estoque) : (data.quantidade != null ? Number(data.quantidade) : 0),
        unidade_medida: data.unidade_medida || data.unidade || '',
        fornecedor: data.fornecedor || '',
        preco_unitario: data.preco_unitario || 0,
        foto_url: data.foto_url || ''
      });
    } catch (err) {
      console.error('Erro ao carregar peça:', err);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => setFormData({ nome: '', codigo_interno: '', marca: '', fabricante: '', componente_id: '', grupo_produto: '', estoque_minimo: 0, quantidade: 0, unidade_medida: '', fornecedor: '', preco_unitario: 0, foto_url: '' });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const payload: any = {
      componente_id: formData.componente_id || null,
      grupo_produto: formData.grupo_produto || null,
      nome: formData.nome,
      codigo_produto: formData.codigo_produto || null,
      codigo_fabricante: formData.fabricante || null,
      custo_medio: formData.preco_unitario ? Number(formData.preco_unitario) : null,
      valor_unitario: formData.preco_unitario ? Number(formData.preco_unitario) : null,
      saldo_estoque: formData.quantidade != null ? Number(formData.quantidade) : 0,
      quantidade: formData.quantidade != null ? Number(formData.quantidade) : 0,
        unidade_medida: formData.unidade_medida || null,
      estoque_minimo: formData.estoque_minimo != null ? Number(formData.estoque_minimo) : null,
      foto: formData.foto_url || null,
      foto_url: formData.foto_url || null,
      observacoes: formData.fornecedor || null
    };
    // prevent duplicate codigo_produto across different records
    try {
      if (payload.codigo_produto) {
        const q = supabase.from('pecas').select('id,nome').eq('codigo_produto', payload.codigo_produto);
        if (pecaId) q.neq('id', pecaId);
        const { data: existing, error: dupErr } = await q.limit(1);
        if (dupErr) console.warn('Erro ao checar duplicatas de codigo_produto:', dupErr);
        if (Array.isArray(existing) && existing.length > 0) {
          const ex = existing[0];
          setDuplicateFound({ id: ex.id, nome: ex.nome });
          showError('Código do produto já existe em outra peça. Você pode abrir o registro existente.');
          setLoading(false);
          return;
        }
      }
    } catch (e) {
      console.warn('Erro ao verificar duplicatas:', e);
    }

    const trySave = async (operation: 'update' | 'insert', initialPayload: any) => {
      const maxRetries = 6;
      let attempt = 0;
      let currentPayload = { ...initialPayload };
      while (attempt < maxRetries) {
        attempt++;
        try {
          if (operation === 'update') {
            const { error } = await supabase.from('pecas').update(currentPayload).eq('id', pecaId);
            if (error) throw error;
            return;
          } else {
            const { data, error } = await supabase.from('pecas').insert(currentPayload).select().single();
            if (error) throw error;
            return;
          }
        } catch (err: any) {
          // try to detect PostgREST missing-column errors in different formats
          const msg = (err && (err.message || '')).toString();
          // pattern: Could not find the 'X' column
          let m = msg.match(/Could not find the '(.+?)' column/);
          // pattern: column pecas.X does not exist
          if (!m) m = msg.match(/column\s+(?:[\w"]+\.)?"?([\w_]+)"?\s+does not exist/i);
          // also check for error.code === '42703' and try to extract from message
          const col = m ? m[1] : (err && err.code === '42703' ? (msg.match(/"?([\w_]+)"?/) || [])[1] : null);
          if (col && Object.prototype.hasOwnProperty.call(currentPayload, col)) {
            delete currentPayload[col];
            continue;
          }
          throw err;
        }
      }
      throw new Error('Máximo de tentativas excedido ao tentar salvar peça');
    };

    try {
      if (pecaId) {
        await trySave('update', payload);
        success('Peça atualizada');
      } else {
        await trySave('insert', payload);
        success('Peça criada');
      }
      onSuccess();
      onClose();
    } catch (err: any) {
      console.error('Erro ao salvar peça:', err);
      // detect duplicate key from Postgres
      if (err && (err.code === '23505' || (err.error && err.error.code === '23505'))) {
        showError('Código do produto já existe em outra peça. Escolha outro código.');
      } else {
        showError('Erro ao salvar peça');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setUploadingImage(true);
      const publicUrl = await storageAPI.uploadImage(file, 'pecas', 'fotos');
      setFormData({ ...formData, foto_url: publicUrl });
      if (pecaId) {
        // Try to persist foto_url to the existing record; ignore non-fatal errors
        await supabase.from('pecas').update({ foto: publicUrl, foto_url: publicUrl }).eq('id', pecaId);
        success('Foto enviada');
      }
    } catch (err) {
      console.error('Erro ao enviar imagem:', err);
      showError('Erro ao enviar imagem');
    } finally {
      setUploadingImage(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className={`${darkMode ? 'bg-slate-800' : 'bg-white'} rounded-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto`}>
        <div className="sticky top-0 bg-gradient-to-r from-indigo-600 to-blue-600 p-6 flex justify-between items-center rounded-t-xl">
          <h2 className="text-2xl font-bold text-white">{pecaId ? 'Editar Peça' : 'Nova Peça'}</h2>
          <button onClick={onClose} className="text-white"><i className="ri-close-line text-2xl"></i></button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Nome da Peça *</label>
              <input required value={formData.nome} onChange={(e) => setFormData({ ...formData, nome: e.target.value })} className="w-full px-4 py-2 rounded-lg border" />
            </div>

              <div>
                <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Grupo do Produto</label>
                <input list="peca-grupos" value={formData.grupo_produto || ''} onChange={(e) => setFormData({ ...formData, grupo_produto: e.target.value })} className="w-full px-4 py-2 rounded-lg border" />
                <datalist id="peca-grupos">
                  {groupSuggestions.map(g => <option key={g} value={g} />)}
                </datalist>
              </div>

            <div>
              <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Código Interno</label>
              <input value={formData.codigo_interno} onChange={(e) => setFormData({ ...formData, codigo_interno: e.target.value })} className="w-full px-4 py-2 rounded-lg border" />
            </div>

            <div>
              <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Código do Produto</label>
              <input value={formData.codigo_produto || ''} onChange={(e) => setFormData({ ...formData, codigo_produto: e.target.value })} className="w-full px-4 py-2 rounded-lg border" />
            </div>

            <div>
              <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Marca</label>
              <input value={formData.marca} onChange={(e) => setFormData({ ...formData, marca: e.target.value })} className="w-full px-4 py-2 rounded-lg border" />
            </div>

            <div>
              <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Fabricante</label>
              <input value={formData.fabricante} onChange={(e) => setFormData({ ...formData, fabricante: e.target.value })} className="w-full px-4 py-2 rounded-lg border" />
            </div>

            <div>
              <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Unidade</label>
              <input list="peca-unidades" value={formData.unidade_medida || ''} onChange={(e) => setFormData({ ...formData, unidade_medida: e.target.value })} className="w-full px-4 py-2 rounded-lg border" />
              <datalist id="peca-unidades">
                {unitSuggestions.map(u => <option key={u} value={u} />)}
                <option value="un" />
                <option value="kg" />
                <option value="m" />
                <option value="l" />
              </datalist>
            </div>

            <div>
              <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Estoque Mínimo</label>
              <input type="number" min="0" value={formData.estoque_minimo} onChange={(e) => setFormData({ ...formData, estoque_minimo: parseInt(e.target.value) || 0 })} className="w-full px-4 py-2 rounded-lg border" />
            </div>

            <div>
              <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Quantidade em Estoque</label>
              <input type="number" min="0" value={formData.quantidade} onChange={(e) => setFormData({ ...formData, quantidade: parseInt(e.target.value) || 0 })} className="w-full px-4 py-2 rounded-lg border" />
            </div>

            <div>
              <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Valor Unit.</label>
              <input type="number" step="0.01" min="0" value={formData.preco_unitario || 0} onChange={(e) => setFormData({ ...formData, preco_unitario: parseFloat(e.target.value) || 0 })} className="w-full px-4 py-2 rounded-lg border" />
            </div>

            <div className="md:col-span-2">
              <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Fornecedor</label>
              <input value={formData.fornecedor} onChange={(e) => setFormData({ ...formData, fornecedor: e.target.value })} className="w-full px-4 py-2 rounded-lg border" />
            </div>

            <div className="md:col-span-2">
              <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Foto</label>
              <div className="flex items-center gap-4">
                {formData.foto_url && <img src={formData.foto_url} alt="Preview" className="w-20 h-20 rounded-lg object-cover" />}
                <label className="px-4 py-2 bg-indigo-600 text-white rounded-lg cursor-pointer">
                  {formData.foto_url ? 'Alterar Foto' : 'Fazer Upload'}
                  <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                </label>
              </div>
            </div>
          </div>

          {duplicateFound && (
            <div className="p-3 rounded bg-yellow-600 text-white flex items-center justify-between">
              <div>
                <div className="font-semibold">Peça existente: {duplicateFound.nome || duplicateFound.id}</div>
                <div className="text-sm">Este código já pertence a outra peça.</div>
              </div>
              <div className="flex gap-2">
                <button type="button" onClick={() => {
                  // dispatch event so parent page can open the existing piece
                  window.dispatchEvent(new CustomEvent('open-peca', { detail: { id: duplicateFound.id } }));
                }} className="px-4 py-2 bg-white text-black rounded">Abrir peça existente</button>
                <button type="button" onClick={() => setDuplicateFound(null)} className="px-4 py-2 bg-gray-200 text-black rounded">Ignorar</button>
              </div>
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <button type="button" onClick={onClose} disabled={loading} className="flex-1 px-6 py-3 rounded-lg bg-gray-200">Cancelar</button>
            <button type="submit" disabled={loading} className="flex-1 px-6 py-3 bg-gradient-to-r from-indigo-600 to-blue-600 text-white rounded-lg">{loading ? 'Salvando...' : pecaId ? 'Atualizar' : 'Criar'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

