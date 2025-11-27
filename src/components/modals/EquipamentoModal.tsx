
import { useState, useEffect } from 'react';
import { equipamentosAPI } from '../../lib/api';
import { supabase } from '../../lib/supabase';
import { storageAPI } from '../../lib/storage';
import { useToast } from '../../hooks/useToast';

interface EquipamentoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  equipamentoId?: string;
  darkMode?: boolean;
  initialData?: any;
}

export default function EquipamentoModal({ 
  isOpen, 
  onClose, 
  onSuccess, 
  equipamentoId,
  darkMode = true,
  initialData
}: EquipamentoModalProps) {
  const [loading, setLoading] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [setores, setSetores] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    codigo_interno: '',
    nome: '',
    setor_id: '',
    descricao: '',
    especificacoes: '',
    fabricante: '',
    modelo: '',
    serie: '',
    dimensao: '',
    peso: '' as any,
    linha_setor: '',
    ano_fabricacao: '' as any,
    criticidade: 'Média' as 'Baixa' | 'Média' | 'Alta' | 'Crítica',
    status_revisao: 0,
    foto_url: '',
    mtbf: 0,
    data_inicio_revisao: '',
    data_prevista_fim: ''
  });
  const { error: showError } = useToast();

  useEffect(() => {
    if (isOpen) {
      loadSetores();
      if (equipamentoId) {
        loadEquipamento();
      } else {
        resetForm();
      }
    }
  }, [isOpen, equipamentoId, initialData]);

  const loadSetores = async () => {
    try {
      const { data, error } = await supabase
        .from('setores')
        .select('*')
        .order('nome');
      if (error) throw error;
      setSetores(data || []);
    } catch (error) {
      console.error('Erro ao carregar setores:', error);
    }
  };

  const loadEquipamento = async () => {
    if (!equipamentoId) return;
    try {
      setLoading(true);
      const data = await equipamentosAPI.getById(equipamentoId);
      setFormData({
        codigo_interno: data.codigo_interno || '',
        nome: data.nome || '',
        setor_id: data.setor_id || '',
        descricao: data.descricao || '',
        especificacoes: data.especificacoes || '',
        fabricante: data.fabricante || '',
        modelo: data.modelo || '',
        linha_setor: data.linha_setor || '',
        ano_fabricacao: data.ano_fabricacao ?? '',
        serie: (data as any).serie || '',
        dimensao: (data as any).dimensao || '',
        peso: (data as any).peso || '',
        criticidade: (['Baixa', 'Média', 'Alta', 'Crítica'].includes(data?.criticidade)
          ? (data.criticidade as 'Baixa' | 'Média' | 'Alta' | 'Crítica')
          : 'Média'),
        status_revisao: data.status_revisao || 0,
        foto_url: data.foto_url || '',
        mtbf: data.mtbf || 0,
        data_inicio_revisao: data.data_inicio_revisao || '',
        data_prevista_fim: data.data_prevista_fim || ''
      });
    } catch (error) {
      console.error('Erro ao carregar equipamento:', error);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    const base = {
      codigo_interno: '',
      nome: '',
      setor_id: '',
      descricao: '',
      especificacoes: '',
      fabricante: '',
      modelo: '',
      linha_setor: '',
      ano_fabricacao: '' as any,
      serie: '',
      dimensao: '',
      peso: '' as any,
      criticidade: 'Média' as 'Baixa' | 'Média' | 'Alta' | 'Crítica',
      status_revisao: 0,
      foto_url: '',
      mtbf: 0,
      data_inicio_revisao: '',
      data_prevista_fim: ''
    };

    if (initialData && !equipamentoId) {
      // prevent null values for controlled inputs (e.g., ano_fabricacao)
      const safe = {
        ...initialData,
        ano_fabricacao: (initialData.ano_fabricacao ?? ''),
        serie: initialData.serie ?? '',
        dimensao: initialData.dimensao ?? '',
        peso: initialData.peso ?? '',
        criticidade: (['Baixa', 'Média', 'Alta', 'Crítica'].includes(initialData?.criticidade)
          ? (initialData.criticidade as 'Baixa' | 'Média' | 'Alta' | 'Crítica')
          : 'Média')
      };
      setFormData({ ...base, ...safe } as any);
    } else {
      setFormData(base as any);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (uploadingImage) {
      showError('Upload da imagem em andamento. Aguarde antes de salvar.');
      return;
    }
    try {
      setLoading(true);
      if (equipamentoId) {
        await equipamentosAPI.update(equipamentoId, formData);
      } else {
        await equipamentosAPI.create(formData);
      }
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Erro ao salvar equipamento:', error);
      showError('Erro ao salvar equipamento');
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploadingImage(true);
      // enviando para o bucket 'equipamentos'
      const publicUrl = await storageAPI.uploadImage(file, 'equipamentos', 'fotos');
      setFormData({ ...formData, foto_url: publicUrl });
    } catch (err) {
      console.error('Erro ao enviar imagem:', err);
      // Mostrar toast de erro ao usuário
      const msg = (err as any)?.message || 'Erro ao enviar imagem. Tente novamente.';
      showError(msg);
    } finally {
      setUploadingImage(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className={`${darkMode ? 'bg-slate-800' : 'bg-white'} rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto`}>
        <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-cyan-600 p-6 flex justify-between items-center rounded-t-xl">
          <h2 className="text-2xl font-bold text-white">
            <i className="ri-tools-line mr-2"></i>
            {equipamentoId ? 'Editar Equipamento' : 'Novo Equipamento'}
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
            <div>
              <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Nome do Equipamento *
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
                } focus:outline-none focus:border-blue-500`}
                placeholder="Ex: Descaroçador 1"
              />
            </div>

            <div>
              <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                ID / Código Interno *
              </label>
              <input
                type="text"
                required
                value={formData.codigo_interno}
                onChange={(e) => setFormData({ ...formData, codigo_interno: e.target.value })}
                className={`w-full px-4 py-2 rounded-lg border ${
                  darkMode 
                    ? 'bg-slate-700 border-slate-600 text-white' 
                    : 'bg-white border-gray-300 text-gray-900'
                } focus:outline-none focus:border-blue-500`}
                placeholder="Ex: EQ-001"
              />
            </div>

            <div>
              <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Setor *
              </label>
              <select
                required
                value={formData.setor_id}
                onChange={(e) => setFormData({ ...formData, setor_id: e.target.value })}
                className={`w-full px-4 py-2 rounded-lg border cursor-pointer ${
                  darkMode 
                    ? 'bg-slate-700 border-slate-600 text-white' 
                    : 'bg-white border-gray-300 text-gray-900'
                } focus:outline-none focus:border-blue-500 pr-8`}
              >
                <option value="">Selecione o setor</option>
                {setores.map((setor) => (
                  <option key={setor.id} value={setor.id}>
                    {setor.nome}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Linha / Setor Específico
              </label>
              <input
                type="text"
                value={formData.linha_setor}
                onChange={(e) => setFormData({ ...formData, linha_setor: e.target.value })}
                className={`w-full px-4 py-2 rounded-lg border ${
                  darkMode 
                    ? 'bg-slate-700 border-slate-600 text-white' 
                    : 'bg-white border-gray-300 text-gray-900'
                } focus:outline-none focus:border-blue-500`}
                placeholder="Ex: Linha A, Setor 2"
              />
            </div>

            <div>
              <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Marca / Fabricante
              </label>
              <input
                type="text"
                value={formData.fabricante}
                onChange={(e) => setFormData({ ...formData, fabricante: e.target.value })}
                className={`w-full px-4 py-2 rounded-lg border ${
                  darkMode 
                    ? 'bg-slate-700 border-slate-600 text-white' 
                    : 'bg-white border-gray-300 text-gray-900'
                } focus:outline-none focus:border-blue-500`}
                placeholder="Ex: Siemens"
              />
            </div>

            <div>
              <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Modelo
              </label>

                <div>
                  <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Série
                  </label>
                  <input
                    type="text"
                    value={(formData as any).serie || ''}
                    onChange={(e) => setFormData({ ...formData, serie: e.target.value })}
                    className={`w-full px-4 py-2 rounded-lg border ${
                      darkMode 
                        ? 'bg-slate-700 border-slate-600 text-white' 
                        : 'bg-white border-gray-300 text-gray-900'
                    } focus:outline-none focus:border-blue-500`}
                    placeholder="Ex: S12345"
                  />
                </div>

                <div>
                  <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Dimensão
                  </label>
                  <input
                    type="text"
                    value={(formData as any).dimensao || ''}
                    onChange={(e) => setFormData({ ...formData, dimensao: e.target.value })}
                    className={`w-full px-4 py-2 rounded-lg border ${
                      darkMode 
                        ? 'bg-slate-700 border-slate-600 text-white' 
                        : 'bg-white border-gray-300 text-gray-900'
                    } focus:outline-none focus:border-blue-500`}
                    placeholder="Ex: 120x60x40"
                  />
                </div>

                <div>
                  <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Peso
                  </label>
                  <input
                    type="text"
                    value={(formData as any).peso || ''}
                    onChange={(e) => setFormData({ ...formData, peso: e.target.value })}
                    className={`w-full px-4 py-2 rounded-lg border ${
                      darkMode 
                        ? 'bg-slate-700 border-slate-600 text-white' 
                        : 'bg-white border-gray-300 text-gray-900'
                    } focus:outline-none focus:border-blue-500`}
                    placeholder="Ex: 125 kg"
                  />
                </div>
              <input
                type="text"
                value={formData.modelo}
                onChange={(e) => setFormData({ ...formData, modelo: e.target.value })}
                className={`w-full px-4 py-2 rounded-lg border ${
                  darkMode 
                    ? 'bg-slate-700 border-slate-600 text-white' 
                    : 'bg-white border-gray-300 text-gray-900'
                } focus:outline-none focus:border-blue-500`}
                placeholder="Ex: XYZ-1000"
              />
            </div>

            <div>
              <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Criticidade *
              </label>
              <select
                required
                value={formData.criticidade}
                onChange={(e) => setFormData({ ...formData, criticidade: e.target.value as any })}
                className={`w-full px-4 py-2 rounded-lg border cursor-pointer ${
                  darkMode 
                    ? 'bg-slate-700 border-slate-600 text-white' 
                    : 'bg-white border-gray-300 text-gray-900'
                } focus:outline-none focus:border-blue-500 pr-8`}
              >
                <option value="Baixa">Baixa</option>
                <option value="Média">Média</option>
                <option value="Alta">Alta</option>
                <option value="Crítica">Crítica</option>
              </select>
            </div>

            <div>
              <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Ano de Fabricação
              </label>
              <input
                type="number"
                min="1900"
                max={new Date().getFullYear()}
                value={formData.ano_fabricacao}
                onChange={(e) => {
                  const v = e.target.value;
                  setFormData({ ...formData, ano_fabricacao: v === '' ? '' : parseInt(v) as any });
                }}
                className={`w-full px-4 py-2 rounded-lg border ${
                  darkMode 
                    ? 'bg-slate-700 border-slate-600 text-white' 
                    : 'bg-white border-gray-300 text-gray-900'
                } focus:outline-none focus:border-blue-500`}
              />
            </div>

            <div className="md:col-span-2">
              <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Especificações Técnicas
              </label>
              <textarea
                rows={3}
                value={formData.especificacoes}
                onChange={(e) => setFormData({ ...formData, especificacoes: e.target.value })}
                className={`w-full px-4 py-2 rounded-lg border ${
                  darkMode 
                    ? 'bg-slate-700 border-slate-600 text-white' 
                    : 'bg-white border-gray-300 text-gray-900'
                } focus:outline-none focus:border-blue-500`}
                placeholder="Potência, voltagem, capacidade, etc..."
                maxLength={500}
              />
            </div>

            <div className="md:col-span-2">
              <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Descrição
              </label>
              <textarea
                rows={3}
                value={formData.descricao}
                onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                className={`w-full px-4 py-2 rounded-lg border ${
                  darkMode 
                    ? 'bg-slate-700 border-slate-600 text-white' 
                    : 'bg-white border-gray-300 text-gray-900'
                } focus:outline-none focus:border-blue-500`}
                placeholder="Descreva o equipamento..."
                maxLength={500}
              />
            </div>

            <div className="md:col-span-2">
              <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Foto do Equipamento
              </label>
              <div className="flex items-center gap-4">
                {formData.foto_url && (
                  <img src={formData.foto_url} alt="Preview" className="w-20 h-20 rounded-lg object-cover" />
                )}
                <label className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 cursor-pointer whitespace-nowrap">
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
              disabled={loading || uploadingImage}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-lg hover:from-blue-700 hover:to-cyan-700 transition-all whitespace-nowrap cursor-pointer disabled:opacity-50"
            >
              {loading ? 'Salvando...' : equipamentoId ? 'Atualizar' : 'Criar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
