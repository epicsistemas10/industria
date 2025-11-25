import { useState, useEffect } from 'react';
import useSetores from '../../hooks/useSetores';

interface SetorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  setorId?: string;
  darkMode?: boolean;
}

export default function SetorModal({ isOpen, onClose, onSuccess, setorId, darkMode = true }: SetorModalProps) {
  const { setores, create, update } = useSetores();
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState('');

  useEffect(() => {
    if (isOpen) {
      if (setorId) {
        const s = setores.find(x => x.id === setorId);
        setName(s?.nome || '');
      } else {
        setName('');
      }
    }
  }, [isOpen, setorId, setores]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      if (setorId) {
        await update(setorId, { nome: name });
      } else {
        await create({ nome: name });
      }
      onSuccess();
      onClose();
    } catch (err) {
      console.error('Erro ao salvar setor:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className={`${darkMode ? 'bg-slate-800' : 'bg-white'} rounded-lg w-full max-w-md p-6` }>
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-white">{setorId ? 'Editar Setor' : 'Novo Setor'}</h3>
          <button onClick={onClose} className="text-white"><i className="ri-close-line text-xl"></i></button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-gray-300 mb-1">Nome *</label>
            <input
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 rounded border bg-slate-700 border-slate-600 text-white"
              placeholder="Ex: Produção"
            />
          </div>

          <div className="flex gap-2 justify-end">
            <button type="button" onClick={onClose} className="px-4 py-2 rounded bg-gray-500 text-white">Cancelar</button>
            <button type="submit" disabled={loading} className="px-4 py-2 rounded bg-gradient-to-r from-purple-600 to-pink-600 text-white">{loading ? 'Salvando...' : setorId ? 'Atualizar' : 'Criar'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
