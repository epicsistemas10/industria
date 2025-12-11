import { useState, useEffect } from 'react';
import { formatEquipamentoName } from '../../utils/format';
import { ordensServicoAPI } from '../../lib/api';
import { supabase } from '../../lib/supabase';
import ComponenteTerceirizadoModal from './ComponenteTerceirizadoModal';

interface OrdemServicoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  osId?: string;
  darkMode?: boolean;
}

export default function OrdemServicoModal({
  isOpen,
  onClose,
  onSuccess,
  osId,
  darkMode = true
}: OrdemServicoModalProps) {
  const [loading, setLoading] = useState(false);
  const [equipamentos, setEquipamentos] = useState<any[]>([]);
  const [equipes, setEquipes] = useState<any[]>([]);
  const [equipesMap, setEquipesMap] = useState<Record<string, string>>({});
  const [formData, setFormData] = useState<any>({
    numero_os: '',
    equipamento_id: '',
    titulo: '',
    descricao: '',
    prioridade: 'Média',
    status: 'Aberta',
    data_abertura: new Date().toISOString().split('T')[0],
    data_inicio: '',
    data_conclusao: '',
    responsavel: '',
    equipe_id: '',
    custo_estimado: 0,
    custo_real: 0,
    observacoes: ''
  });

  const [plannedServices, setPlannedServices] = useState<any[] | null>(null);
  const [serviceNames, setServiceNames] = useState<Record<string, string>>({});
  const [componentsList, setComponentsList] = useState<any[]>([]);
  const [obsText, setObsText] = useState<string>('');
  const [partsForm, setPartsForm] = useState<any>({ componente_id: '', quantidade: 1, custo: 0, notas: '' });
  const [showComponenteModal, setShowComponenteModal] = useState(false);
  const [showAdditionalSearch, setShowAdditionalSearch] = useState(false);
  const [additionalQuery, setAdditionalQuery] = useState('');
  const [additionalResults, setAdditionalResults] = useState<any[]>([]);
  const [addingQuantity, setAddingQuantity] = useState<number>(1);

  const formatNumeroOs = (raw: string) => {
    if (!raw) return '000000';
    const digits = (raw || '').toString().replace(/\D/g, '');
    const last = digits.slice(-6);
    return last.padStart(6, '0');
  };

  useEffect(() => {
    if (isOpen) {
      loadEquipamentos();
      loadEquipes();
      if (osId) loadOS();
      else {
        resetForm();
        generateNumeroOS();
      }
    }
  }, [isOpen, osId]);

  useEffect(() => {
    if (formData?.observacoes) {
      try {
        const parsed = JSON.parse(formData.observacoes);
        setPlannedServices(parsed?.planned_services || null);
      } catch (e) {
        setPlannedServices(null);
      }
    } else {
      setPlannedServices(null);
    }
  }, [formData?.observacoes]);

  useEffect(() => {
    const loadServiceNames = async () => {
      try {
        if (!plannedServices || plannedServices.length === 0) return;
        // normalize possible shapes of plannedServices entries to extract service ids
        const tryExtract = (obj: any) => {
          if (!obj) return null;
          if (typeof obj === 'string') return obj;
          if (typeof obj === 'object') {
            if (obj.id) return obj.id;
            if (obj.servico_id) return obj.servico_id;
            if (obj.uuid) return obj.uuid;
            if (obj.servico) return tryExtract(obj.servico);
            // scan for any string value that looks like a UUID
            const uuids = Object.values(obj).filter(v => typeof v === 'string' && /[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-5][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}/.test(v));
            if (uuids.length > 0) return uuids[0];
          }
          return null;
        };
        const rawIds = plannedServices.map((p: any) => tryExtract(p.servico_id || p.servico || p)).filter(Boolean) as string[];
        const ids = Array.from(new Set(rawIds));
        if (ids.length === 0) return;
        const merged: Record<string, string> = {};
        try {
          const { data: svcData } = await supabase.from('servicos').select('id, nome').in('id', ids as any[]);
          (svcData || []).forEach((s: any) => { merged[String(s.id)] = s.nome || String(s.id); });
        } catch (e) {
          // ignore
        }
        const stillMissing = ids.filter(i => !merged[String(i)]);
        if (stillMissing.length > 0) {
          try {
            const { data: eqData } = await supabase.from('equipamento_servicos').select('id, nome').in('id', stillMissing as any[]);
            (eqData || []).forEach((s: any) => { merged[String(s.id)] = s.nome || String(s.id); });
          } catch (e) {
            // ignore
          }
        }
        setServiceNames(merged);
      } catch (e) {
        console.warn('Erro ao carregar nomes de servicos', e);
      }
    };
    loadServiceNames();
  }, [plannedServices]);

  // carregar componentes vinculados ao equipamento selecionado (priorizar peças do equipamento)
  useEffect(() => {
    const loadComponentsForEquipment = async () => {
      try {
        if (!formData.equipamento_id) {
          const { data } = await supabase.from('componentes').select('id, nome').order('nome');
          setComponentsList(data || []);
          return;
        }
        const { data } = await supabase
          .from('equipamentos_componentes')
          .select('quantidade_usada, componentes(id, nome)')
          .eq('equipamento_id', formData.equipamento_id);

        if (data) {
          const componentesFormatados = data.map((item: any) => ({ id: item.componentes?.id, nome: item.componentes?.nome, quantidade_usada: item.quantidade_usada })).filter(Boolean);
          // sort client-side by nome to avoid PostgREST ordering on relationship fields
          componentesFormatados.sort((a: any, b: any) => {
            const na = (a.nome || '').toLowerCase();
            const nb = (b.nome || '').toLowerCase();
            return na < nb ? -1 : na > nb ? 1 : 0;
          });
          setComponentsList(componentesFormatados || []);
        } else {
          setComponentsList([]);
        }
      } catch (e) {
        console.warn('Erro ao carregar componentes do equipamento', e);
        setComponentsList([]);
      }
    };
    loadComponentsForEquipment();
  }, [formData.equipamento_id]);

  const loadEquipamentos = async () => {
    try {
      const { data, error } = await supabase.from('equipamentos').select('id, nome').order('nome');
      if (error) throw error;
      setEquipamentos(data || []);
    } catch (error) {
      console.error('Erro ao carregar equipamentos:', error);
    }
  };

  const loadEquipes = async () => {
    try {
      const { data, error } = await supabase.from('equipes').select('id, nome').order('nome');
      if (error) throw error;
      setEquipes(data || []);
      const map: Record<string, string> = {};
      (data || []).forEach((r: any) => { map[String(r.id)] = r.nome; });
      setEquipesMap(map);
    } catch (error) {
      console.error('Erro ao carregar equipes:', error);
    }
  };

  const toInputDateTime = (iso?: string) => {
    if (!iso) return '';
    try {
      const d = new Date(iso);
      const pad = (n: number) => n.toString().padStart(2, '0');
      const yyyy = d.getFullYear();
      const mm = pad(d.getMonth() + 1);
      const dd = pad(d.getDate());
      const hh = pad(d.getHours());
      const mi = pad(d.getMinutes());
      return `${yyyy}-${mm}-${dd}T${hh}:${mi}`;
    } catch (e) {
      return '';
    }
  };

  const generateNumeroOS = () => {
    // gerar somente 6 dígitos numéricos
    const num = Math.floor(Math.random() * 1_000_000).toString().padStart(6, '0');
    setFormData((prev: any) => ({ ...prev, numero_os: num }));
  };

  const loadOS = async () => {
    if (!osId) return;
    try {
      setLoading(true);
      const data = await ordensServicoAPI.getById(osId);
      setFormData({
        numero_os: data.numero_os || '',
        equipamento_id: data.equipamento_id || '',
        titulo: data.titulo || '',
        descricao: data.descricao || '',
        prioridade: data.prioridade || 'Média',
        status: data.status || 'Aberta',
        data_abertura: data.data_abertura || new Date().toISOString().split('T')[0],
        data_inicio: toInputDateTime(data.data_inicio) || '',
        data_conclusao: toInputDateTime(data.data_conclusao) || '',
        responsavel: data.responsavel || '',
        equipe_id: data.equipe_id || '',
        custo_estimado: data.custo_estimado || 0,
        custo_real: data.custo_real || 0,
        observacoes: data.observacoes || ''
      });
      // preparar campo de observações limpo para o mantenedor digitar
      try {
        const parsed = data.observacoes ? JSON.parse(data.observacoes) : null;
        setObsText(parsed?.notes || '');
      } catch (e) {
        setObsText('');
      }
    } catch (error) {
      console.error('Erro ao carregar OS:', error);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      numero_os: '',
      equipamento_id: '',
      titulo: '',
      descricao: '',
      prioridade: 'Média',
      status: 'Aberta',
      data_abertura: new Date().toISOString().split('T')[0],
      data_inicio: '',
      data_conclusao: '',
      responsavel: '',
      equipe_id: '',
      custo_estimado: 0,
      custo_real: 0,
      observacoes: ''
    });
    setPlannedServices(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      // preparar observações: preservar planned_services e parts_used, mas salvar notes limpo para mantenedor
      let finalForm = { ...formData };
      try {
        const existing = formData.observacoes ? JSON.parse(formData.observacoes) : {};
        const merged = { ...(existing || {}) };
        if (obsText && obsText.trim() !== '') merged.notes = obsText.trim();
        // ensure arrays exist
        merged.planned_services = merged.planned_services || (plannedServices || []);
        merged.parts_used = merged.parts_used || (existing?.parts_used || []);
        finalForm.observacoes = JSON.stringify(merged);
      } catch (e) {
        // fallback: save obsText as plain string inside JSON
        finalForm.observacoes = JSON.stringify({ notes: obsText || '' });
      }

      // converter campos datetime-local para ISO antes de enviar
      const toISO = (val: string) => {
        if (!val) return null;
        try { return new Date(val).toISOString(); } catch (e) { return val; }
      };
      finalForm = { ...finalForm, data_inicio: toISO(finalForm.data_inicio), data_conclusao: toISO(finalForm.data_conclusao) };
      if (osId) await ordensServicoAPI.update(osId, finalForm);
      else await ordensServicoAPI.create(finalForm);
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Erro ao salvar OS:', error);
      alert('Erro ao salvar ordem de serviço. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const saveDateField = async (field: 'data_inicio' | 'data_conclusao', value?: string) => {
    if (!osId) return;
    try {
      const val = typeof value !== 'undefined' ? value : formData[field];
      // convert local datetime-local value to ISO with timezone offset to preserve entered local time
      const localInputToISOWithOffset = (local?: string | null) => {
        if (!local) return null;
        try {
          const d = new Date(local);
          const pad = (n: number) => String(n).padStart(2, '0');
          const year = d.getFullYear();
          const month = pad(d.getMonth() + 1);
          const day = pad(d.getDate());
          const hours = pad(d.getHours());
          const minutes = pad(d.getMinutes());
          const offsetMin = -d.getTimezoneOffset();
          const sign = offsetMin >= 0 ? '+' : '-';
          const abs = Math.abs(offsetMin);
          const offH = pad(Math.floor(abs / 60));
          const offM = pad(abs % 60);
          return `${year}-${month}-${day}T${hours}:${minutes}:00${sign}${offH}:${offM}`;
        } catch (e) {
          try { return new Date(local as any).toISOString(); } catch (er) { return null; }
        }
      };
      const iso = localInputToISOWithOffset(val as string);
      await ordensServicoAPI.update(osId, { [field]: iso });
      // Optionally update local formData to reflect saved ISO -> but keep datetime-local string for input
    } catch (e) {
      console.error('Erro ao salvar campo de data/hora', field, e);
    }
  };

  const updateObservacoes = async (newObs: any) => {
    if (!osId) return;
    try {
      const payload = { observacoes: JSON.stringify(newObs) };
      // compute total parts cost from parts_used
      try {
        const parts = newObs.parts_used || [];
        const total = (parts || []).reduce((acc: number, p: any) => {
          const qty = Number(p.quantidade || 1);
          const custo = Number(p.custo || 0);
          return acc + (qty * custo);
        }, 0);
        payload.custo_pecas = Number((total || 0).toFixed(2));
      } catch (e) {
        // ignore cost calc errors
      }
      await ordensServicoAPI.update(osId, payload);
      setPlannedServices(newObs.planned_services || null);
      setFormData((f: any) => ({ ...f, observacoes: JSON.stringify(newObs), custo_estimada_pecas: payload.custo_pecas }));
    } catch (e) {
      console.error('Erro ao atualizar observacoes', e);
    }
  };

  const handleStartService = async (index: number) => {
    if (!plannedServices || !osId) return;
    const obs = { planned_services: [...plannedServices] };
    obs.planned_services[index] = { ...obs.planned_services[index], iniciado_em: new Date().toISOString(), status: 'em andamento' };
    await updateObservacoes(obs);
  };

  const handleFinishService = async (index: number) => {
    if (!plannedServices || !osId) return;
    const obs = { planned_services: [...plannedServices] };
    obs.planned_services[index] = { ...obs.planned_services[index], finalizado_em: new Date().toISOString(), status: 'concluido' };
    await updateObservacoes(obs);
    const allDone = obs.planned_services.every((s: any) => s.finalizado_em);
    if (allDone) {
      try {
        await ordensServicoAPI.update(osId, { status: 'Concluída', data_conclusao: new Date().toISOString() });
      } catch (e) {
        console.error('Erro ao fechar OS automaticamente', e);
      }
    }
  };

  const getObservacoesObject = () => {
    if (!formData?.observacoes) return { planned_services: plannedServices || [], parts_used: [] };
    try {
      const parsed = JSON.parse(formData.observacoes);
      parsed.planned_services = parsed.planned_services || plannedServices || [];
      parsed.parts_used = parsed.parts_used || [];
      return parsed;
    } catch (e) {
      return { planned_services: plannedServices || [], parts_used: [] };
    }
  };

  const handleAddPart = async () => {
    if (!osId) return alert('Salve a OS antes de adicionar peças.');
    try {
      const obs = getObservacoesObject();
      obs.parts_used = obs.parts_used || [];
      const comp = componentsList.find(c => String(c.id) === String(partsForm.componente_id));
      obs.parts_used.push({
        componente_id: partsForm.componente_id || null,
        componente_nome: comp?.nome || '',
        quantidade: partsForm.quantidade || 1,
        custo: partsForm.custo || 0,
        notas: partsForm.notas || '',
        criado_em: new Date().toISOString()
      });
      await updateObservacoes(obs);
      setPartsForm({ componente_id: '', quantidade: 1, custo: 0, notas: '' });
    } catch (e) {
      console.error('Erro ao adicionar peça', e);
    }
  };

  const searchAdditionalComponents = async () => {
    try {
      if (!additionalQuery || additionalQuery.trim().length < 2) return setAdditionalResults([]);
      const q = `%${additionalQuery}%`;
      // search in `pecas` table by multiple code fields and name
      const orQuery = `nome.ilike.${q},codigo_produto.ilike.${q},codigo_interno.ilike.${q},codigo_fabricante.ilike.${q}`;
      let results: any[] = [];
      try {
        const { data } = await supabase.from('pecas').select('id, nome, codigo_produto, codigo_interno, codigo_fabricante, valor_unitario').or(orQuery).limit(50);
        results = data || [];
      } catch (err) {
        console.warn('Busca multi-coluna em pecas falhou, tentando fallback por nome. Erro:', err);
      }
      // fallback: if no results, try a simpler name-only search (some installs may not have the extra code columns populated)
      if ((!results || results.length === 0) && additionalQuery.trim().length > 1) {
        try {
          // try a safe name-only query selecting common columns
          const { data: fallback } = await supabase.from('pecas').select('id, nome, valor_unitario').ilike('nome', q).limit(100);
          results = fallback || [];
        } catch (er) {
          console.error('Fallback de busca por nome em pecas também falhou:', er);
          results = [];
        }
      }
      setAdditionalResults(results || []);
    } catch (e) {
      console.error('Erro ao buscar componentes adicionais', e);
    }
  };

  const handleAddAdditional = async (component: any) => {
    if (!osId) return alert('Salve a OS antes de adicionar peças adicionais.');
    try {
      const obs = getObservacoesObject();
      obs.parts_used = obs.parts_used || [];
      const quantidade = Number(addingQuantity || 1);
      const valorUnit = Number(component.valor_unitario || 0);
      const custoCalculado = Number((quantidade * (valorUnit || 0)).toFixed(2));
      obs.parts_used.push({
        componente_id: component.id,
        componente_nome: component.nome,
        componente_codigo: component.codigo_produto || '',
        quantidade: quantidade,
        custo: custoCalculado,
        valor_unitario: valorUnit,
        notas: 'Adicional',
        criado_em: new Date().toISOString()
      });
      await updateObservacoes(obs);
      setAdditionalQuery('');
      setAdditionalResults([]);
      setShowAdditionalSearch(false);
    } catch (e) {
      console.error('Erro ao adicionar componente adicional', e);
    }
  };

  const handleRemovePart = async (index: number) => {
    if (!osId) return;
    try {
      const obs = getObservacoesObject();
      obs.parts_used = obs.parts_used || [];
      obs.parts_used.splice(index, 1);
      await updateObservacoes(obs);
    } catch (e) {
      console.error('Erro ao remover peça', e);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className={`${darkMode ? 'bg-slate-800' : 'bg-white'} rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto`}>
        <div className="sticky top-0 bg-gradient-to-r from-green-600 to-emerald-600 p-6 flex justify-between items-center rounded-t-xl">
          <h2 className="text-2xl font-bold text-white">
            <i className="ri-file-list-3-line mr-2"></i>
            {osId ? 'Editar Ordem de Serviço' : 'Nova Ordem de Serviço'}
          </h2>
          <button onClick={onClose} className="text-white hover:text-gray-200 transition-colors cursor-pointer">
            <i className="ri-close-line text-2xl"></i>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {plannedServices && plannedServices.length > 0 && (
            <div className={`${darkMode ? 'bg-slate-700 text-white' : 'bg-white text-gray-800'} border rounded p-4`}>
              <h3 className="font-semibold mb-2">Serviços planejados</h3>
              <ul className="space-y-2">
                {plannedServices.map((s: any, idx: number) => {
                  // normalize service id/name for display
                  let sidRaw: any = s.servico_id || s.servico;
                  let sid: string | null = null;
                  if (sidRaw) {
                    if (typeof sidRaw === 'string') sid = sidRaw;
                    else if (typeof sidRaw === 'object' && sidRaw !== null) sid = sidRaw.id || sidRaw.servico_id || null;
                  }
                  const svcName = sid ? serviceNames[String(sid)] : undefined;
                  const displayName = svcName || s.servico_nome || (typeof s.servico === 'object' && s.servico?.nome) || (s.servico_id || s.servico) || '—';
                  return (
                    <li key={idx} className="flex items-start gap-4">
                      <div>
                        <div className="font-medium">{displayName}</div>
                        <div className="text-sm text-gray-400">Equipe: {equipesMap[String(s.equipe_id)] || s.equipe_id || '—'}</div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Número da OS *</label>
              <input type="text" required value={formatNumeroOs(formData.numero_os)} onChange={(e) => setFormData({ ...formData, numero_os: e.target.value })} className={`w-full px-4 py-2 rounded-lg border ${darkMode ? 'bg-slate-700 border-slate-600 text-white' : 'bg-white border-gray-300 text-gray-900'} focus:outline-none focus:border-green-500`} placeholder="000000" />
            </div>

            <div>
              <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Equipamento</label>
              <select value={formData.equipamento_id} onChange={(e) => setFormData({ ...formData, equipamento_id: e.target.value })} disabled={!!osId} className={`w-full px-4 py-2 rounded-lg border cursor-pointer ${darkMode ? 'bg-slate-700 border-slate-600 text-white' : 'bg-white border-gray-300 text-gray-900'} focus:outline-none focus:border-green-500 pr-8 ${osId ? 'opacity-60 cursor-not-allowed' : ''}`}>
                <option value="">Selecione o equipamento</option>
                {equipamentos.map((eq) => (
                  <option key={eq.id} value={eq.id}>{formatEquipamentoName(eq)}</option>
                ))}
              </select>
              {osId && <div className="text-xs mt-1 text-gray-300">Equipamento travado — não pode ser alterado depois que a OS foi criada.</div>}
            </div>

            <div className="md:col-span-2">
              <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Título *</label>
              <input type="text" required value={formData.titulo} onChange={(e) => setFormData({ ...formData, titulo: e.target.value })} className={`w-full px-4 py-2 rounded-lg border ${darkMode ? 'bg-slate-700 border-slate-600 text-white' : 'bg-white border-gray-300 text-gray-900'} focus:outline-none focus:border-green-500`} placeholder="Ex: Troca de rolamento" />
            </div>

            <div>
              <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Prioridade *</label>
              <select required value={formData.prioridade} onChange={(e) => setFormData({ ...formData, prioridade: e.target.value as any })} className={`w-full px-4 py-2 rounded-lg border cursor-pointer ${darkMode ? 'bg-slate-700 border-slate-600 text-white' : 'bg-white border-gray-300 text-gray-900'} focus:outline-none focus:border-green-500 pr-8`}>
                <option value="Baixa">Baixa</option>
                <option value="Média">Média</option>
                <option value="Alta">Alta</option>
                <option value="Urgente">Urgente</option>
              </select>
            </div>

            <div>
              <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Status *</label>
              <select required value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value as any })} className={`w-full px-4 py-2 rounded-lg border cursor-pointer ${darkMode ? 'bg-slate-700 border-slate-600 text-white' : 'bg-white border-gray-300 text-gray-900'} focus:outline-none focus:border-green-500 pr-8`}>
                <option value="Aberta">Aberta</option>
                <option value="Em Andamento">Em Andamento</option>
                <option value="Pausada">Pausada</option>
                <option value="Concluída">Concluída</option>
                <option value="Cancelada">Cancelada</option>
              </select>
            </div>

            <div>
              <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Data Abertura *</label>
              <input type="date" required value={formData.data_abertura} onChange={(e) => setFormData({ ...formData, data_abertura: e.target.value })} className={`w-full px-4 py-2 rounded-lg border ${darkMode ? 'bg-slate-700 border-slate-600 text-white' : 'bg-white border-gray-300 text-gray-900'} focus:outline-none focus:border-green-500`} />
            </div>

            <div>
              <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Data Início e Hora</label>
              <input type="datetime-local" value={formData.data_inicio} onChange={(e) => setFormData({ ...formData, data_inicio: e.target.value })} onBlur={(e) => saveDateField('data_inicio', e.currentTarget.value)} className={`w-full px-4 py-2 rounded-lg border ${darkMode ? 'bg-slate-700 border-slate-600 text-black' : 'bg-white border-gray-300 text-gray-900'} focus:outline-none focus:border-green-500`} />
            </div>

            <div>
              <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Data Conclusão e Hora</label>
              <input type="datetime-local" value={formData.data_conclusao} onChange={(e) => setFormData({ ...formData, data_conclusao: e.target.value })} onBlur={(e) => saveDateField('data_conclusao', e.currentTarget.value)} className={`w-full px-4 py-2 rounded-lg border ${darkMode ? 'bg-slate-700 border-slate-600 text-black' : 'bg-white border-gray-300 text-gray-900'} focus:outline-none focus:border-green-500`} />
            </div>

            <div>
              <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Responsável</label>
              <input type="text" value={formData.responsavel} onChange={(e) => setFormData({ ...formData, responsavel: e.target.value })} className={`w-full px-4 py-2 rounded-lg border ${darkMode ? 'bg-slate-700 border-slate-600 text-white' : 'bg-white border-gray-300 text-gray-900'} focus:outline-none focus:border-green-500`} />
            </div>

            <div>
              <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Equipe</label>
              <select value={formData.equipe_id} onChange={(e) => setFormData({ ...formData, equipe_id: e.target.value })} className={`w-full px-4 py-2 rounded-lg border cursor-pointer ${darkMode ? 'bg-slate-700 border-slate-600 text-white' : 'bg-white border-gray-300 text-gray-900'} focus:outline-none focus:border-green-500 pr-8`}>
                <option value="">Selecione a equipe</option>
                {equipes.map((eq) => (
                  <option key={eq.id} value={eq.id}>{eq.nome}</option>
                ))}
              </select>
            </div>

            <div className="md:col-span-2">
              <div className={`border rounded p-4 mb-4 ${darkMode ? 'bg-slate-700 text-white' : 'bg-white text-gray-800'}`}>
                <h3 className="font-semibold mb-2">Peças usadas / trocadas</h3>
                <div className="mb-3">
                  {(getObservacoesObject().parts_used || []).length === 0 && (
                    <div className="text-sm text-gray-200">Nenhuma peça registrada.</div>
                  )}
                  {(getObservacoesObject().parts_used || []).map((p: any, idx: number) => (
                    <div key={idx} className="flex items-center justify-between gap-4 py-2">
                      <div>
                        <div className="font-medium">{p.componente_nome || p.componente_id || '—'}</div>
                        <div className="text-sm text-gray-200">Qtd: {p.quantidade} • Custo: R$ {Number(p.custo || 0).toFixed(2)}</div>
                        <div className="text-xs text-gray-300">{p.notas}</div>
                      </div>
                      <div>
                        <button type="button" onClick={() => handleRemovePart(idx)} className="px-3 py-1 rounded bg-red-600 text-white">Remover</button>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-2 items-end">
                  <select value={partsForm.componente_id} onChange={(e) => setPartsForm({ ...partsForm, componente_id: e.target.value })} className="px-3 py-2 rounded border col-span-2">
                    <option value="">Selecione a peça</option>
                    {componentsList.map(c => (
                      <option key={c.id} value={c.id}>{c.nome}</option>
                    ))}
                  </select>
                  <input type="number" min={1} value={partsForm.quantidade} onChange={(e) => setPartsForm({ ...partsForm, quantidade: Number(e.target.value) })} className="px-3 py-2 rounded border" placeholder="Qtd" />
                  <input type="number" step="0.01" value={partsForm.custo} onChange={(e) => setPartsForm({ ...partsForm, custo: Number(e.target.value) })} className="px-3 py-2 rounded border" placeholder="Custo" />
                  <input type="text" value={partsForm.notas} onChange={(e) => setPartsForm({ ...partsForm, notas: e.target.value })} className="px-3 py-2 rounded border col-span-4 md:col-span-4" placeholder="Notas" />
                  <div className="md:col-span-4 flex justify-end">
                    <button type="button" onClick={handleAddPart} className="mt-2 px-4 py-2 rounded bg-blue-600 text-white">Adicionar Peça</button>
                  </div>
                </div>
                <div className="md:col-span-2">
                  <button type="button" onClick={() => setShowAdditionalSearch(!showAdditionalSearch)} className="px-3 py-2 rounded bg-indigo-600 text-white">Peças adicionais</button>
                  {showAdditionalSearch && (
                    <div className={`mt-3 p-3 rounded ${darkMode ? 'bg-slate-700' : 'bg-gray-50'}`}>
                      <div className="flex gap-2">
                        <input type="text" value={additionalQuery} onChange={(e) => setAdditionalQuery(e.target.value)} placeholder="Buscar por código ou nome" className="flex-1 px-3 py-2 rounded border" />
                        <button type="button" onClick={searchAdditionalComponents} className="px-3 py-2 bg-emerald-500 rounded">Buscar</button>
                      </div>
                      <div className="mt-2">
                        {additionalResults.length === 0 && <div className="text-sm text-gray-300">Nenhum resultado</div>}
                        {additionalResults.map((c) => (
                          <div key={c.id} className="flex items-center justify-between gap-2 py-2 border-b border-slate-600">
                            <div>
                              <div className="font-medium">{c.codigo_produto ? `${c.codigo_produto} — ${c.nome}` : c.nome}</div>
                              <div className="text-sm text-gray-400">R$ {Number(c.valor_unitario || 0).toFixed(2)}</div>
                            </div>
                            <div className="flex items-center gap-2">
                              <input type="number" min={1} value={addingQuantity} onChange={(e) => setAddingQuantity(Number(e.target.value))} className="w-20 px-2 py-1 rounded border" />
                              <button type="button" onClick={() => handleAddAdditional(c)} className="px-3 py-1 bg-blue-600 text-white rounded">Adicionar</button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
              <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Observações</label>
              <textarea value={obsText} onChange={(e) => setObsText(e.target.value)} placeholder="Digite suas observações aqui" className={`w-full px-4 py-2 rounded-lg border ${darkMode ? 'bg-slate-700 border-slate-600 text-white' : 'bg-white border-gray-300 text-gray-900'} focus:outline-none focus:border-green-500`} rows={4} />
            </div>
          </div>

          <div className="flex justify-end gap-3">
            {osId && (
              <>
                <button type="button" onClick={() => setShowComponenteModal(true)} className="px-4 py-2 rounded-lg bg-amber-600 text-black">Componente Removido / Terceirizado</button>
              </>
            )}
            <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg bg-gray-300 text-gray-800">Fechar</button>
            <button type="submit" className="px-4 py-2 rounded-lg bg-green-600 text-white">Salvar</button>
          </div>
        </form>
      </div>
      <ComponenteTerceirizadoModal
        isOpen={showComponenteModal}
        onClose={() => setShowComponenteModal(false)}
        equipamentoId={formData.equipamento_id}
        osId={osId}
        onCreated={() => { /* TODO: refresh lists if needed */ }}
        darkMode={darkMode}
      />
    </div>
  );
}
