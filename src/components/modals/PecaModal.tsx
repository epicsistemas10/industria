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
  const [formData, setFormData] = useState({
    nome: '',
    codigo_interno: '',
    componente_id: '',
    quantidade_minima: 0,
    fornecedor: '',
    preco_unitario: 0,
    foto_url: ''
  });

  useEffect(() => {
    if (isOpen) {
      if (pecaId) loadPeca();
      else resetForm();
    }
  }, [isOpen, pecaId]);

  const { success, error: showError } = useToast();

  const loadPeca = async () => {
    if (!pecaId) return;
    try {
      setLoading(true);
      const { data, error } = await supabase.from('pecas').select('*').eq('id', pecaId).single();
      if (error) throw error;
      setFormData({
        nome: data.nome || '',
        codigo_interno: data.codigo_interno || '',
        componente_id: data.componente_id || '',
        quantidade_minima: data.quantidade_minima || 0,
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

  const resetForm = () => setFormData({ nome: '', codigo_interno: '', componente_id: '', quantidade_minima: 0, fornecedor: '', preco_unitario: 0, foto_url: '' });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      // normalize numeric / nullable fields
      const payload = {
        ...formData,
        quantidade_minima: formData.quantidade_minima === '' || formData.quantidade_minima === null ? null : Number(formData.quantidade_minima) || 0,
        preco_unitario: formData.preco_unitario === '' || formData.preco_unitario === null ? null : Number(formData.preco_unitario) || null,
        componente_id: formData.componente_id ? formData.componente_id : null,
        foto_url: formData.foto_url || null,
      };

      if (pecaId) {
        await supabase.from('pecas').update(payload).eq('id', pecaId);
        success('Peça atualizada');
      } else {
        await supabase.from('pecas').insert(payload);
        success('Peça criada');
      }
      onSuccess();
      onClose();
    } catch (err) {
      console.error('Erro ao salvar peça:', err);
      showError('Erro ao salvar peça');
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
              <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Código Interno</label>
              <input value={formData.codigo_interno} onChange={(e) => setFormData({ ...formData, codigo_interno: e.target.value })} className="w-full px-4 py-2 rounded-lg border" />
            </div>

            <div>
              <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Quantidade Mínima</label>
              <input type="number" min="0" value={formData.quantidade_minima} onChange={(e) => setFormData({ ...formData, quantidade_minima: parseInt(e.target.value) || 0 })} className="w-full px-4 py-2 rounded-lg border" />
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

          <div className="flex gap-3 pt-4">
            <button type="button" onClick={onClose} disabled={loading} className="flex-1 px-6 py-3 rounded-lg bg-gray-200">Cancelar</button>
            <button type="submit" disabled={loading} className="flex-1 px-6 py-3 bg-gradient-to-r from-indigo-600 to-blue-600 text-white rounded-lg">{loading ? 'Salvando...' : pecaId ? 'Atualizar' : 'Criar'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
