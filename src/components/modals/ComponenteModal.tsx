import { useState, useEffect } from 'react';
import { componentesAPI } from '../../lib/api';
import { supabase } from '../../lib/supabase';
import { storageAPI } from '../../lib/storage';
import { useToast } from '../../hooks/useToast';

interface ComponenteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  componenteId?: string;
  darkMode?: boolean;
}

export default function ComponenteModal({ 
  isOpen, 
  onClose, 
  onSuccess, 
  componenteId,
  darkMode = true 
}: ComponenteModalProps) {
  const [loading, setLoading] = useState(false);
  const [tiposComponentes, setTiposComponentes] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    nome: '',
    codigo_interno: '',
    codigo_fabricante: '',
    marca: '',
    tipo_componente_id: '',
    especificacoes: '',
    preco_unitario: 0,
    foto_url: ''
  });
  const [equipamentosList, setEquipamentosList] = useState<any[]>([]);
  const [selectedEquipamentos, setSelectedEquipamentos] = useState<string[]>([]);
  const { success, error: showError } = useToast();

  useEffect(() => {
    if (isOpen) {
      loadTiposComponentes();
      loadEquipamentosList();
      if (componenteId) {
        loadComponente();
      } else {
        resetForm();
        // Preencher código automático com prefixo COM (pré-fill apenas informativo)
        (async () => {
          try {
            const next = await componentesAPI.getNextCodigo('COM');
            setFormData((prev) => ({ ...prev, codigo_interno: next }));
          } catch (err) {
            console.warn('Não foi possível pré-gerar código COM:', err);
          }
        })();
      }
    }
  }, [isOpen, componenteId]);

  const loadTiposComponentes = async () => {
    try {
      const { data, error } = await supabase
        .from('tipos_componentes')
        .select('*')
        .order('nome');
      if (error) throw error;
      setTiposComponentes(data || []);
    } catch (error) {
      console.error('Erro ao carregar tipos de componentes:', error);
    }
  };

  const loadEquipamentosList = async () => {
    try {
      const { data } = await supabase
        .from('equipamentos')
        .select('id, nome, codigo_interno')
        .order('nome');
      if (data) setEquipamentosList(data);
    } catch (err) {
      console.error('Erro ao carregar equipamentos para seleção:', err);
    }
  };

  const loadComponente = async () => {
    if (!componenteId) return;
    try {
      setLoading(true);
      const data = await componentesAPI.getById(componenteId);
      setFormData({
        nome: data.nome || '',
        codigo_interno: data.codigo_interno || '',
        codigo_fabricante: data.codigo_fabricante || '',
        marca: data.marca || '',
        tipo_componente_id: data.tipo_componente_id || '',
        especificacoes: data.especificacoes || '',
        preco_unitario: data.preco_unitario || 0,
        foto_url: data.foto_url || ''
      });
      // load existing equipamento associations
      try {
        const { data: assoc } = await supabase
          .from('equipamentos_componentes')
          .select('equipamento_id')
          .eq('componente_id', componenteId);
        if (assoc) setSelectedEquipamentos(assoc.map((a: any) => a.equipamento_id));
      } catch (err) {
        console.error('Erro ao carregar associações equipamentos-componentes:', err);
      }
    } catch (error) {
      console.error('Erro ao carregar componente:', error);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      nome: '',
      codigo_interno: '',
      codigo_fabricante: '',
      marca: '',
      tipo_componente_id: '',
      especificacoes: '',
      preco_unitario: 0,
      foto_url: ''
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      const payload = { ...formData };
      if (!componenteId) {
        // Sempre gerar novo código COM### no momento do envio para evitar duplicatas pré-geradas
        try {
          const next = await componentesAPI.getNextCodigo('COM');
          payload.codigo_interno = next;
        } catch (err) {
          console.error('Erro ao gerar código COM no envio:', err);
          showError('Erro ao gerar código do componente');
          setLoading(false);
          return;
        }
        const created = await componentesAPI.create(payload);
        success('Componente criado');
        // after create, insert associations
        try {
          const compId = created?.id;
          if (compId && selectedEquipamentos.length) {
            await supabase.from('equipamentos_componentes').insert(
              selectedEquipamentos.map(eid => ({ equipamento_id: eid, componente_id: compId, quantidade_usada: 1 }))
            );
          }
        } catch (err) {
          console.warn('Não foi possível criar associações equipamento-componente:', err);
        }
      } else {
        // edição: não altera o código interno
        await componentesAPI.update(componenteId, payload);
        success('Componente atualizado');
        // update associations: remove existing and recreate
        try {
          await supabase.from('equipamentos_componentes').delete().eq('componente_id', componenteId);
          if (selectedEquipamentos.length) {
            await supabase.from('equipamentos_componentes').insert(
              selectedEquipamentos.map(eid => ({ equipamento_id: eid, componente_id: componenteId, quantidade_usada: 1 }))
            );
          }
        } catch (err) {
          console.warn('Não foi possível atualizar associações equipamento-componente:', err);
        }
      }
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Erro ao salvar componente:', error);
      showError('Erro ao salvar componente');
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const publicUrl = await storageAPI.uploadImage(file, 'componentes', 'fotos');
      setFormData({ ...formData, foto_url: publicUrl });
    } catch (err) {
      console.error('Erro ao enviar imagem:', err);
      showError('Erro ao enviar imagem');
    } finally {
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className={`${darkMode ? 'bg-slate-800' : 'bg-white'} rounded-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto`}>
        <div className="sticky top-0 bg-gradient-to-r from-purple-600 to-pink-600 p-6 flex justify-between items-center rounded-t-xl">
          <h2 className="text-2xl font-bold text-white">
            <i className="ri-settings-4-line mr-2"></i>
            {componenteId ? 'Editar Componente' : 'Novo Componente'}
          </h2>
          <button
            onClick={onClose}
            className="text-white hover:text-gray-200 transition-colors cursor-pointer"
          >
            <i className="ri-close-line text-2xl"></i>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Nome do Componente *
              </label>
              <input
                type="text"
                required
                value={formData.nome}
                onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                className={`w-full px-4 py-2 rounded-lg border ${
                  darkMode 
                    ? 'bg-slate-700 border-slate-600 text-white' 
                    : 'bg-white border-gray-300 text-gray-900'
                } focus:outline-none focus:border-purple-500`}
                placeholder="Ex: Rolamento SKF 6205"
              />
            </div>

            <div>
              <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Código Interno *
              </label>
              <input
                type="text"
                required
                value={formData.codigo_interno}
                onChange={(e) => setFormData({ ...formData, codigo_interno: e.target.value })}
                readOnly={!componenteId} // leitura apenas em criação (prefere automático)
                className={`w-full px-4 py-2 rounded-lg border ${
                  darkMode 
                    ? 'bg-slate-700 border-slate-600 text-white' 
                    : 'bg-white border-gray-300 text-gray-900'
                } focus:outline-none focus:border-purple-500`}
                placeholder="Ex: COMP-001"
              />
            </div>

            <div>
              <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Código do Fabricante
              </label>
              <input
                type="text"
                value={formData.codigo_fabricante}
                onChange={(e) => setFormData({ ...formData, codigo_fabricante: e.target.value })}
                className={`w-full px-4 py-2 rounded-lg border ${
                  darkMode 
                    ? 'bg-slate-700 border-slate-600 text-white' 
                    : 'bg-white border-gray-300 text-gray-900'
                } focus:outline-none focus:border-purple-500`}
                placeholder="Ex: SKF-6205-2RS"
              />
            </div>

            <div>
              <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Marca
              </label>
              <input
                type="text"
                value={formData.marca}
                onChange={(e) => setFormData({ ...formData, marca: e.target.value })}
                className={`w-full px-4 py-2 rounded-lg border ${
                  darkMode 
                    ? 'bg-slate-700 border-slate-600 text-white' 
                    : 'bg-white border-gray-300 text-gray-900'
                } focus:outline-none focus:border-purple-500`}
                placeholder="Ex: SKF"
              />
            </div>

            <div>
              <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Tipo de Componente *
              </label>
              <select
                required
                value={formData.tipo_componente_id}
                onChange={(e) => setFormData({ ...formData, tipo_componente_id: e.target.value })}
                className={`w-full px-4 py-2 rounded-lg border cursor-pointer ${
                  darkMode 
                    ? 'bg-slate-700 border-slate-600 text-white' 
                    : 'bg-white border-gray-300 text-gray-900'
                } focus:outline-none focus:border-purple-500 pr-8`}
              >
                <option value="">Selecione o tipo</option>
                {tiposComponentes.map((tipo) => (
                  <option key={tipo.id} value={tipo.id}>
                    {tipo.nome}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Preço Unitário (R$)
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={formData.preco_unitario}
                onChange={(e) => setFormData({ ...formData, preco_unitario: parseFloat(e.target.value) || 0 })}
                className={`w-full px-4 py-2 rounded-lg border ${
                  darkMode 
                    ? 'bg-slate-700 border-slate-600 text-white' 
                    : 'bg-white border-gray-300 text-gray-900'
                } focus:outline-none focus:border-purple-500`}
                placeholder="0.00"
              />
            </div>

            <div className="md:col-span-2">
              <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Especificações
              </label>
              <textarea
                rows={3}
                value={formData.especificacoes}
                onChange={(e) => setFormData({ ...formData, especificacoes: e.target.value })}
                className={`w-full px-4 py-2 rounded-lg border ${
                  darkMode 
                    ? 'bg-slate-700 border-slate-600 text-white' 
                    : 'bg-white border-gray-300 text-gray-900'
                } focus:outline-none focus:border-purple-500`}
                placeholder="Dimensões, material, características técnicas..."
                maxLength={500}
              />
            </div>

            <div className="md:col-span-2">
              <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Foto do Componente
              </label>
              <div className="flex items-center gap-4">
                {formData.foto_url && (
                  <img src={formData.foto_url} alt="Preview" className="w-20 h-20 rounded-lg object-cover" />
                )}
                <label className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 cursor-pointer whitespace-nowrap">
                  <i className="ri-upload-2-line mr-2"></i>
                  {formData.foto_url ? 'Alterar Foto' : 'Fazer Upload'}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                </label>
                {formData.foto_url && (
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, foto_url: '' })}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 cursor-pointer whitespace-nowrap"
                  >
                    <i className="ri-delete-bin-line"></i>
                  </button>
                )}
              </div>
            </div>
          </div>

          <div>
            <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              Atribuir a Equipamentos (múltipla seleção)
            </label>
            <div className="flex items-center gap-3 mb-2">
              <label className="inline-flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={equipamentosList.length > 0 && selectedEquipamentos.length === equipamentosList.length}
                  onChange={(e) => setSelectedEquipamentos(e.target.checked ? equipamentosList.map(eq => eq.id) : [])}
                  className="w-4 h-4"
                />
                <span className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Selecionar todos</span>
              </label>
            </div>

            <div className={`max-h-48 overflow-y-auto rounded border p-2 ${darkMode ? 'bg-slate-700 border-slate-600' : 'bg-white border-gray-300'}`}>
              {equipamentosList.length === 0 && (
                <div className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Nenhum equipamento disponível</div>
              )}
              {equipamentosList.map(eq => (
                <label key={eq.id} className="flex items-center justify-between gap-3 p-1 hover:bg-opacity-5 rounded">
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      value={eq.id}
                      checked={selectedEquipamentos.includes(eq.id)}
                      onChange={(e) => {
                        const id = eq.id;
                        if (e.target.checked) setSelectedEquipamentos(prev => Array.from(new Set([...prev, id])));
                        else setSelectedEquipamentos(prev => prev.filter(x => x !== id));
                      }}
                      className="w-4 h-4"
                    />
                    <div>
                      <div className={`text-sm font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>{eq.nome}</div>
                      <div className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{eq.codigo_interno || '—'}</div>
                    </div>
                  </div>
                </label>
              ))}
            </div>
            <p className="text-sm text-gray-400 mt-1">Marque os equipamentos desejados e clique em salvar.</p>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className={`flex-1 px-6 py-3 rounded-lg transition-colors whitespace-nowrap cursor-pointer ${
                darkMode 
                  ? 'bg-slate-700 text-white hover:bg-slate-600' 
                  : 'bg-gray-200 text-gray-900 hover:bg-gray-300'
              }`}
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all whitespace-nowrap cursor-pointer disabled:opacity-50"
            >
              {loading ? 'Salvando...' : componenteId ? 'Atualizar' : 'Criar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
