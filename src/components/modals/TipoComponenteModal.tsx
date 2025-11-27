import { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useToast } from '../../hooks/useToast';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  darkMode?: boolean;
}

export default function TipoComponenteModal({ isOpen, onClose, onSuccess, darkMode = true }: Props) {
  const [nome, setNome] = useState('');
  const [loading, setLoading] = useState(false);
  const { success, error: showError } = useToast();

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nome.trim()) return;
    try {
      setLoading(true);
      const { data, error } = await supabase.from('tipos_componentes').insert({ nome });
      if (error) throw error;
      // prefer toast success if available
      try { success('Tipo criado'); } catch {}
      setNome('');
      onSuccess && onSuccess();
      onClose();
    } catch (err) {
      console.error('Erro ao criar tipo de componente:', err);
      showError('Erro ao criar tipo');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className={`${darkMode ? 'bg-slate-800' : 'bg-white'} rounded-xl max-w-md w-full p-6`}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-white">Novo Tipo de Componente</h3>
          <button onClick={onClose} className="text-gray-200 hover:text-white">
            <i className="ri-close-line text-2xl"></i>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              Nome *
            </label>
            <input
              type="text"
              required
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              className={`w-full px-4 py-2 rounded-lg border ${darkMode ? 'bg-slate-700 border-slate-600 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
              placeholder="Ex: Pistão, Válvula, Rolamento"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-2 rounded-lg bg-slate-700 text-white hover:bg-slate-600">
              Cancelar
            </button>
            <button type="submit" disabled={loading} className="flex-1 px-4 py-2 rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 text-white">
              {loading ? 'Salvando...' : 'Criar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
