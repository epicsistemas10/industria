import React, { useEffect, useRef, useState } from 'react';
import { ordensServicoAPI } from '../../lib/api';
import { supabase } from '../../lib/supabase';
import ComponenteTerceirizadoModal from './ComponenteTerceirizadoModal';

interface StartOsModalProps {
  isOpen: boolean;
  onClose: () => void;
  ordem: any | null;
  onStarted: () => void;
  darkMode?: boolean;
}

export default function StartOsModal({ isOpen, onClose, ordem, onStarted, darkMode = true }: StartOsModalProps) {
  const [planned, setPlanned] = useState<any[]>([]);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [startAt, setStartAt] = useState<string>('');
  const [saving, setSaving] = useState(false);
  const [serviceNames, setServiceNames] = useState<Record<string, string>>({});
  const [componentsList, setComponentsList] = useState<any[]>([]);
  const [partsForm, setPartsForm] = useState<any>({ componente_id: '', quantidade: 1, custo: 0, notas: '' });
  const [additionalQuery, setAdditionalQuery] = useState('');
  const [additionalResults, setAdditionalResults] = useState<any[]>([]);
  const [addingQuantity, setAddingQuantity] = useState<number>(1);
  const [showComponenteModal, setShowComponenteModal] = useState(false);
  const [selectedAdditional, setSelectedAdditional] = useState<Record<string, boolean>>({});
  const [additionalQtyMap, setAdditionalQtyMap] = useState<Record<string, number>>({});
  const partsQuantityRef = useRef<HTMLInputElement | null>(null);
  const [equipesMap, setEquipesMap] = useState<Record<string, string>>({});
  const [showConfirmStart, setShowConfirmStart] = useState<number | null>(null);
  const [showConfirmEnd, setShowConfirmEnd] = useState<number | null>(null);
  const [endAt, setEndAt] = useState<string>('');
  const [showParts, setShowParts] = useState<boolean>(false);
  const [showConfirmCloseOS, setShowConfirmCloseOS] = useState(false);

  const formatLocalForInput = (d: Date = new Date()) => {
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  };

  const localInputToISOWithOffset = (local: string | undefined | null) => {
    if (!local) return new Date().toISOString();
    // local expected as 'YYYY-MM-DDTHH:mm'
    try {
      const d = new Date(local);
      const pad = (n: number) => String(n).padStart(2, '0');
      const year = d.getFullYear();
      const month = pad(d.getMonth() + 1);
      const day = pad(d.getDate());
      const hours = pad(d.getHours());
      const minutes = pad(d.getMinutes());
      const offsetMin = -d.getTimezoneOffset(); // minutes ahead of UTC
      const sign = offsetMin >= 0 ? '+' : '-';
      const abs = Math.abs(offsetMin);
      const offH = pad(Math.floor(abs / 60));
      const offM = pad(abs % 60);
      return `${year}-${month}-${day}T${hours}:${minutes}:00${sign}${offH}:${offM}`;
    } catch (e) {
      return new Date(local as any).toISOString();
    }
  };

  const getPlannedServiceKey = (p: any) => {
    if (!p) return '';
    if (typeof p === 'string') return p;
    if (typeof p === 'object') {
      if (p.servico_id) return String(p.servico_id);
      if (p.id) return String(p.id);
      if (p.uuid) return String(p.uuid);
      if (p.servico && typeof p.servico === 'string') return p.servico;
      if (p.servico && typeof p.servico === 'object') {
        if (p.servico.id) return String(p.servico.id);
        if (p.servico.uuid) return String(p.servico.uuid);
      }
    }
    return '';
  };

  const parsedPlannedIds = () => {
    try {
      const lst = (ordem?.observacoes ? JSON.parse(ordem.observacoes) : { planned_services: [] })?.planned_services || planned || [];
      return lst.map((p: any) => p?.equipe_id).filter(Boolean);
    } catch (e) {
      return [];
    }
  };

  useEffect(() => {
    if (!isOpen) return;
    setStartAt(formatLocalForInput()); // local yyyy-mm-ddThh:mm for input
    if (ordem?.observacoes) {
      try {
        const parsed = JSON.parse(ordem.observacoes);
        setPlanned(parsed?.planned_services || []);
        setSelectedIndex(parsed?.planned_services && parsed.planned_services.length ? 0 : null);
      } catch (e) {
        setPlanned([]);
        setSelectedIndex(null);
      }
    } else {
      setPlanned([]);
      setSelectedIndex(null);
    }
    // load equipes names used by planned services
    (async () => {
      try {
        const ids = Array.from(new Set((ordem?.observacoes ? (JSON.parse(ordem.observacoes).planned_services || []).map((p:any)=>p.equipe_id) : []) || []))
          .filter(Boolean);
        if (ids.length === 0) { setEquipesMap({}); return; }
        const { data } = await supabase.from('equipes').select('id, nome').in('id', ids as any[]);
        const map: Record<string, string> = {};
        (data || []).forEach((r: any) => { map[String(r.id)] = r.nome; });
        setEquipesMap(map);
      } catch (e) {
        // ignore
      }
    })();
    // load components for equipment to allow selecting parts
    (async () => {
      try {
        if (!ordem?.equipamento_id) {
          const { data } = await supabase.from('componentes').select('id, nome').order('nome');
          setComponentsList(data || []);
          return;
        }
        const { data } = await supabase.from('equipamentos_componentes').select('quantidade, componentes(id, nome)').eq('equipamento_id', ordem.equipamento_id);
        const comps = (data || []).map((r: any) => ({ id: r.componentes?.id, nome: r.componentes?.nome }));
        comps.sort((a: any, b: any) => (a.nome || '').localeCompare(b.nome || ''));
        setComponentsList(comps || []);
      } catch (e) {
        console.warn('Erro ao carregar componentes para StartOsModal', e);
        setComponentsList([]);
      }
    })();
    // reset confirm states when ordem changes
    setShowConfirmStart(null);
    setShowConfirmEnd(null);
  }, [isOpen, ordem]);

  useEffect(() => {
    if (!isOpen) return;
    const loadNames = async () => {
      try {
        // extract service ids from multiple possible shapes
        const idsSet = new Set<string>();
        planned.forEach((p: any) => {
          if (!p) return;
          if (typeof p === 'string') idsSet.add(p);
          if (typeof p === 'object') {
            if (p.servico_id) idsSet.add(String(p.servico_id));
            else if (p.id) idsSet.add(String(p.id));
            else if (p.uuid) idsSet.add(String(p.uuid));
            else if (p.servico && typeof p.servico === 'string') idsSet.add(p.servico);
            else if (p.servico && typeof p.servico === 'object') {
              if (p.servico.id) idsSet.add(String(p.servico.id));
              if (p.servico.uuid) idsSet.add(String(p.servico.uuid));
            }
          }
        });
        const ids = Array.from(idsSet).filter(Boolean);
        if (ids.length === 0) {
          setServiceNames({});
          return;
        }
        const map: Record<string, string> = {};
        try {
          const { data } = await supabase.from('servicos').select('id, nome').in('id', ids as any[]);
          (data || []).forEach((s: any) => { map[String(s.id)] = s.nome || String(s.id); });
        } catch (e) {
          // ignore
        }
        // fallback to equipamento_servicos for ids not found in servicos
        const stillMissing = ids.filter(i => !map[String(i)]);
        if (stillMissing.length > 0) {
          try {
            const { data: eqData } = await supabase.from('equipamento_servicos').select('id, nome').in('id', stillMissing as any[]);
            (eqData || []).forEach((s: any) => { map[String(s.id)] = s.nome || String(s.id); });
          } catch (e) {
            // ignore
          }
        }
        setServiceNames(map);
      } catch (e) {
        console.warn('Erro ao carregar nomes de serviços', e);
      }
    };
    loadNames();
  }, [isOpen, planned]);

  // (parsedPlannedIds helper is defined earlier; avoid duplicate declaration)

  const handleConfirm = async () => {
    if (!ordem) return;
    try {
      setSaving(true);
      const iso = startAt ? new Date(startAt).toISOString() : new Date().toISOString();
      const updatedObs = { planned_services: planned.slice() };
      if (selectedIndex !== null && updatedObs.planned_services[selectedIndex]) {
        updatedObs.planned_services[selectedIndex] = { ...updatedObs.planned_services[selectedIndex], iniciado_em: iso, status: 'em andamento' };
      }

      // preserve existing parts_used if present
      try {
        const existing = ordem.observacoes ? JSON.parse(ordem.observacoes) : {};
        updatedObs.parts_used = existing.parts_used || [];
      } catch (e) {
        updatedObs.parts_used = [];
      }

      const payload: any = { status: 'Em Andamento', data_inicio: iso };
      if (updatedObs.planned_services.length || (updatedObs.parts_used && updatedObs.parts_used.length)) payload.observacoes = JSON.stringify(updatedObs);

      await ordensServicoAPI.update(ordem.id, payload);
      onStarted();
      onClose();
    } catch (e) {
      console.error('Erro ao iniciar OS:', e);
      alert('Erro ao iniciar OS. Veja o console para detalhes.');
    } finally {
      setSaving(false);
    }
  };

  const getObservacoesObject = () => {
    if (!ordem?.observacoes) return { planned_services: planned || [], parts_used: [] };
    try {
      const parsed = JSON.parse(ordem.observacoes);
      parsed.planned_services = parsed.planned_services || planned || [];
      parsed.parts_used = parsed.parts_used || [];
      return parsed;
    } catch (e) {
      return { planned_services: planned || [], parts_used: [] };
    }
  };

  const handleAddPart = () => {
    if (!ordem) return alert('Salve a OS antes de adicionar peças.');
    try {
      const obs = getObservacoesObject();
      obs.parts_used = obs.parts_used || [];
      const comp = componentsList.find((c: any) => String(c.id) === String(partsForm.componente_id));
      obs.parts_used.push({
        componente_id: partsForm.componente_id || null,
        componente_nome: comp?.nome || '',
        quantidade: partsForm.quantidade || 1,
        custo: partsForm.custo || 0,
        notas: partsForm.notas || '',
        criado_em: new Date().toISOString()
      });
      ordensServicoAPI.update(ordem.id, { observacoes: JSON.stringify(obs) });
      setPartsForm({ componente_id: '', quantidade: 1, custo: 0, notas: '' });
      alert('Peça adicionada');
    } catch (e) {
      console.error('Erro ao adicionar peça', e);
      alert('Erro ao adicionar peça');
    }
  };

  const confirmStartForIndex = async (i: number) => {
    if (!ordem) return;
    try {
      const iso = startAt ? localInputToISOWithOffset(startAt) : new Date().toISOString();
      const updatedObs = { planned_services: planned.slice() };
      updatedObs.planned_services[i] = { ...updatedObs.planned_services[i], iniciado_em: iso, status: 'em andamento' };
      const payload: any = { status: 'Em Andamento', data_inicio: iso, observacoes: JSON.stringify(updatedObs) };
      await ordensServicoAPI.update(ordem.id, payload);
      alert('Serviço iniciado');
      // update local planned state so UI shows Finalizar immediately if modal stays open
      setPlanned((prev) => {
        const copy = prev.slice();
        copy[i] = { ...copy[i], iniciado_em: iso, status: 'em andamento' };
        return copy;
      });
      setShowConfirmStart(null);
      setShowParts(true);
      onStarted();
      onClose();
      try { window.dispatchEvent(new CustomEvent('app:refresh-hotspots')); } catch (e) {}
    } catch (err) {
      console.error('Erro ao iniciar serviço', err);
      alert('Erro ao iniciar serviço');
    }
  };

  const confirmEndForIndex = async (i: number) => {
    if (!ordem) return;
    try {
      const iso = endAt ? localInputToISOWithOffset(endAt) : new Date().toISOString();
      const updatedObs = { planned_services: planned.slice() };
      updatedObs.planned_services[i] = { ...updatedObs.planned_services[i], finalizado_em: iso, status: 'concluido' };
      const allFinished = updatedObs.planned_services.every((ps: any) => ps.finalizado_em);
      const payload: any = { observacoes: JSON.stringify(updatedObs) };
      if (allFinished) {
        payload.status = 'Concluída';
        payload.data_conclusao = iso;
      }
      alert('Serviço finalizado');
      await ordensServicoAPI.update(ordem.id, payload);
      // update planned locally
      setPlanned((prev) => {
        const copy = prev.slice();
        copy[i] = { ...copy[i], finalizado_em: iso, status: 'concluido' };
        return copy;
      });
      setShowConfirmEnd(null);
      onStarted();
      onClose();
      try { window.dispatchEvent(new CustomEvent('app:refresh-hotspots')); } catch (e) {}
    } catch (err) {
      console.error('Erro ao finalizar serviço', err);
      alert('Erro ao finalizar serviço');
    }
  };

  const searchAdditional = async () => {
    try {
      if (!additionalQuery || additionalQuery.trim().length < 2) return setAdditionalResults([]);
      const q = `%${additionalQuery}%`;
      // try name-only first (safer across schemas)
      try {
        const { data } = await supabase.from('pecas').select('id, nome, valor_unitario, codigo_produto, codigo_peca, produto').ilike('nome', q).limit(50);
        if (data && data.length) return setAdditionalResults(data || []);
      } catch (er) {
        console.warn('Busca por nome em pecas falhou:', er);
      }
      // fallback: try more columns if necessary
      try {
        const orQuery = `nome.ilike.${q},codigo_produto.ilike.${q},codigo_peca.ilike.${q},produto.ilike.${q},codigo_fabricante.ilike.${q}`;
        const { data } = await supabase.from('pecas').select('id, nome, valor_unitario, codigo_produto, codigo_peca, produto, codigo_fabricante').or(orQuery).limit(50);
        setAdditionalResults(data || []);
      } catch (er) {
        console.error('Busca adicional em pecas falhou:', er);
        setAdditionalResults([]);
      }
    } catch (e) {
      console.error('Erro na busca adicional', e);
    }
  };

  const handleAddAdditional = async (component: any) => {
    if (!ordem) return alert('Salve a OS antes de adicionar peças adicionais.');
    try {
      const obs = getObservacoesObject();
      obs.parts_used = obs.parts_used || [];
      const quantidade = Number(addingQuantity || 1);
      const valorUnit = Number(component.valor_unitario || 0);
      const custoCalculado = Number((quantidade * (valorUnit || 0)).toFixed(2));
      obs.parts_used.push({
        componente_id: component.id,
        componente_nome: component.nome,
        componente_codigo: component.codigo_produto || component.codigo_peca || '',
        quantidade: quantidade,
        custo: custoCalculado,
        valor_unitario: valorUnit,
        notas: 'Adicional',
        criado_em: new Date().toISOString()
      });
      await ordensServicoAPI.update(ordem.id, { observacoes: JSON.stringify(obs) });
      setAdditionalQuery('');
      setAdditionalResults([]);
      setShowComponenteModal(false);
      alert('Peça adicional adicionada');
    } catch (e) {
      console.error('Erro ao adicionar peça adicional', e);
      alert('Erro ao adicionar peça adicional');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className={`${darkMode ? 'bg-slate-800' : 'bg-white'} rounded-xl max-w-3xl w-full p-6 max-h-[80vh] overflow-y-auto`}> 
        <h3 className="text-xl font-semibold mb-4">Iniciar Ordem de Serviço</h3>
        <p className="text-sm mb-4">Selecione o serviço que será iniciado e confirme a data/hora de início.</p>

        {planned.length > 0 ? (
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">Equipamento</label>
            <div className="mb-3 text-sm">
              <div className="font-medium">{ordem?.equipamentos?.codigo_interno || ordem?.equipamentos?.codigo || '—'}</div>
              <div className="text-sm text-gray-300">{ordem?.equipamentos?.nome || ordem?.equipamentos?.descricao || ''}</div>
            </div>

            <label className="block text-sm font-medium mb-2">Serviços planejados</label>
            <div className="flex flex-col gap-2">
              {planned.map((p: any, i: number) => {
                const key = getPlannedServiceKey(p) || String(p.servico_id || p.servico || `svc-${i}`);
                const name = (key && serviceNames[String(key)]) || p.servico_nome || (p.servico && p.servico.nome) || String(p.servico_id || p.servico || `Serviço ${i+1}`);
                const selected = selectedIndex === i;
                return (
                  <button
                    key={i}
                    type="button"
                    onClick={() => {
                      setSelectedIndex(i);
                      // scroll to parts section and focus quantity input
                      const partsEl = document.getElementById('startos-parts-section');
                      if (partsEl) partsEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
                      setTimeout(() => {
                        if (partsQuantityRef.current) partsQuantityRef.current.focus();
                      }, 250);
                    }}
                      className={`w-full text-left px-3 py-2 rounded border ${selected ? 'bg-green-600 text-white' : 'bg-transparent text-left text-sm'} ${!selected && darkMode ? 'text-black' : ''}`}
                  >
                    <div className="flex items-center justify-between">
                        <div className={`font-medium ${darkMode ? 'text-black' : ''}`}>{name}</div>
                        <div className="flex items-center gap-2">
                          <div className={`text-xs ${darkMode ? 'text-black' : 'text-gray-300'}`}>Equipe: {equipesMap[String(p.equipe_id)] || p.equipe_id || '-'}</div>
                        {p.iniciado_em && (
                          <div className="inline-block px-2 py-0.5 text-xs rounded bg-green-600 text-white">Iniciado</div>
                        )}
                        <button type="button" onClick={(e) => { e.stopPropagation(); setShowComponenteModal(true); }} className="ml-2 text-xs px-2 py-1 rounded bg-amber-600 text-black">Terceirizar</button>
                        {!p.iniciado_em && (
                          <button type="button" onClick={(e) => { e.stopPropagation(); setShowConfirmStart(i); setStartAt(formatLocalForInput()); }} title="Play" className="ml-2 text-xs px-2 py-1 rounded bg-green-600 text-white">Play</button>
                        )}
                        {p.iniciado_em && !p.finalizado_em && (
                          <button type="button" onClick={(e) => { e.stopPropagation(); setShowConfirmEnd(i); setEndAt(formatLocalForInput()); }} title="Finalizar" className="ml-2 text-xs px-2 py-1 rounded bg-red-600 text-white">Finalizar</button>
                        )}
                      </div>
                    </div>
                    {showConfirmStart === i && (
                      <div className="mt-3 flex items-center gap-2">
                        <input type="datetime-local" value={startAt} onChange={(e) => setStartAt(e.target.value)} className={`px-3 py-2 rounded border ${darkMode ? 'bg-white text-black' : ''}`} />
                        <button onClick={() => confirmStartForIndex(i)} className="px-3 py-2 bg-green-600 text-white rounded">Confirmar</button>
                        <button onClick={() => setShowConfirmStart(null)} className="px-3 py-2 bg-gray-300 rounded">Cancelar</button>
                      </div>
                    )}
                    {showConfirmEnd === i && (
                      <div className="mt-3 flex items-center gap-2">
                        <input type="datetime-local" value={endAt} onChange={(e) => setEndAt(e.target.value)} className={`px-3 py-2 rounded border ${darkMode ? 'bg-white text-black' : ''}`} />
                        <button onClick={() => confirmEndForIndex(i)} className="px-3 py-2 bg-red-600 text-white rounded">Finalizar</button>
                        <button onClick={() => setShowConfirmEnd(null)} className="px-3 py-2 bg-gray-300 rounded">Cancelar</button>
                      </div>
                    )}
                  </button>
                );
              })}
              {planned.length > 0 && planned.every((ps:any)=>ps && (ps.finalizado_em || ps.status === 'concluido')) && ordem?.status !== 'Concluída' && (
                <div className="mt-4 flex items-center gap-2">
                  {!showConfirmCloseOS && (
                    <button type="button" onClick={() => setShowConfirmCloseOS(true)} className="px-3 py-2 rounded bg-indigo-600 text-white">Deseja Encerrar a OS</button>
                  )}
                  {showConfirmCloseOS && (
                    <div className="flex items-center gap-2">
                      <div className={`text-sm ${darkMode ? 'text-black' : ''}`}>Confirma encerrar a OS como concluída?</div>
                      <button onClick={async () => {
                        try {
                          const iso = new Date().toISOString();
                          await ordensServicoAPI.update(ordem.id, { status: 'Concluída', data_conclusao: iso });
                          alert('OS marcada como Concluída');
                          setShowConfirmCloseOS(false);
                          onStarted();
                          onClose();
                          try { window.dispatchEvent(new CustomEvent('app:refresh-hotspots')); } catch (e) {}
                        } catch (e) {
                          console.error('Erro ao encerrar OS', e);
                          alert('Erro ao encerrar OS');
                        }
                      }} className="px-3 py-2 bg-green-600 text-white rounded">Confirmar</button>
                      <button onClick={() => setShowConfirmCloseOS(false)} className="px-3 py-2 bg-gray-300 rounded">Cancelar</button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="mb-4 text-sm text-gray-300">Sem serviços planejados para esta OS.</div>
        )}

        <div className="mb-4">
          <div className="mb-4">
            <button type="button" onClick={() => setShowParts(!showParts)} className="px-3 py-2 rounded bg-gray-200 text-sm">{showParts ? 'Ocultar peças' : 'Mostrar peças'}</button>
          </div>

          {showParts && (
            <div id="startos-parts-section" className="border rounded p-3 mb-4">
              <h4 className={`font-semibold mb-2 ${darkMode ? 'text-black' : ''}`}>Peças usadas / trocadas</h4>
              {(getObservacoesObject().parts_used || []).length === 0 && (
                <div className="text-sm text-gray-300 mb-2">Nenhuma peça registrada.</div>
              )}

              {(getObservacoesObject().parts_used || []).map((p: any, idx: number) => (
                <div key={idx} className="flex items-center justify-between gap-4 py-2">
                  <div>
                    <div className={`font-medium ${darkMode ? 'text-black' : ''}`}>{p.componente_nome || p.componente_id || '—'}</div>
                    <div className={`${darkMode ? 'text-black' : 'text-sm text-gray-400'}`}>Qtd: {p.quantidade} • Custo: R$ {Number(p.custo || 0).toFixed(2)}</div>
                    <div className={`${darkMode ? 'text-black' : 'text-xs text-gray-300'}`}>{p.notas}</div>
                  </div>
                </div>
              ))}

              <div className="grid grid-cols-1 md:grid-cols-4 gap-2 items-end mt-3">
                <select value={partsForm.componente_id} onChange={(e) => setPartsForm({ ...partsForm, componente_id: e.target.value })} className={`px-3 py-2 rounded border col-span-2 ${darkMode ? 'text-black' : ''}`}>
                  <option value="">Selecione a peça</option>
                  {componentsList.map(c => (
                    <option key={c.id} value={c.id}>{c.nome}</option>
                  ))}
                </select>
                <input ref={partsQuantityRef} type="number" min={1} value={partsForm.quantidade} onChange={(e) => setPartsForm({ ...partsForm, quantidade: Number(e.target.value) })} className="px-3 py-2 rounded border" placeholder="Qtd" />
                <input type="number" step="0.01" value={partsForm.custo} onChange={(e) => setPartsForm({ ...partsForm, custo: Number(e.target.value) })} className="px-3 py-2 rounded border" placeholder="Custo" />
                <input type="text" value={partsForm.notas} onChange={(e) => setPartsForm({ ...partsForm, notas: e.target.value })} className="px-3 py-2 rounded border col-span-4 md:col-span-4" placeholder="Notas" />
                <div className="md:col-span-4 flex justify-end">
                  <button type="button" onClick={handleAddPart} className="mt-2 px-4 py-2 rounded bg-blue-600 text-white">Adicionar Peça</button>
                </div>
              </div>

              <div className="mt-3">
                <button type="button" onClick={() => setShowComponenteModal(true)} className="px-3 py-2 rounded bg-amber-600 text-black">Componente Removido / Terceirizado</button>
              </div>

                <div className="mt-3">
                <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-black' : 'text-gray-700'}`}>Peças adicionais</label>
                <div className="flex gap-2">
                  <input type="text" value={additionalQuery} onChange={(e) => setAdditionalQuery(e.target.value)} placeholder="Buscar por código ou nome" className="flex-1 px-3 py-2 rounded border" />
                  <button type="button" onClick={searchAdditional} className="px-3 py-2 bg-emerald-500 rounded">Buscar</button>
                </div>

                <div className="mt-2">
                  {additionalResults.length === 0 && <div className={`text-sm ${darkMode ? 'text-black' : 'text-gray-600'}`}>Nenhum resultado</div>}

                  {additionalResults.map((c) => (
                    <div key={c.id} className="flex items-center justify-between gap-2 py-2 border-b border-slate-600">
                      <div className="flex items-center gap-3">
                        <input type="checkbox" checked={!!selectedAdditional[String(c.id)]} onChange={(e) => setSelectedAdditional({ ...selectedAdditional, [String(c.id)]: e.target.checked })} />
                        <div>
                          <div className={`font-medium ${darkMode ? 'text-black' : ''}`}>{c.codigo_produto ? `${c.codigo_produto} — ${c.nome}` : c.nome}</div>
                          <div className={`${darkMode ? 'text-black' : 'text-gray-400'} text-sm`}>R$ {Number(c.valor_unitario || 0).toFixed(2)}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <input type="number" min={1} value={additionalQtyMap[String(c.id)] ?? addingQuantity} onChange={(e) => setAdditionalQtyMap({ ...additionalQtyMap, [String(c.id)]: Number(e.target.value) })} className="w-20 px-2 py-1 rounded border" />
                        <button type="button" onClick={() => handleAddAdditional(c)} className="px-3 py-1 bg-blue-600 text-white rounded">Adicionar</button>
                      </div>
                    </div>
                  ))}

                  {additionalResults.length > 0 && (
                    <div className="mt-2 flex justify-end">
                      <button type="button" onClick={async () => {
                        const ids = Object.keys(selectedAdditional).filter(k => selectedAdditional[k]);
                        if (ids.length === 0) return alert('Selecione ao menos uma peça.');
                        try {
                          const obs = getObservacoesObject();
                          obs.parts_used = obs.parts_used || [];
                          ids.forEach((id) => {
                            const comp = additionalResults.find(r => String(r.id) === String(id));
                            if (!comp) return;
                            const quantidade = Number(additionalQtyMap[String(id)] ?? addingQuantity ?? 1);
                            const valorUnit = Number(comp.valor_unitario || 0);
                            const custoCalculado = Number((quantidade * (valorUnit || 0)).toFixed(2));
                            obs.parts_used.push({
                              componente_id: comp.id,
                              componente_nome: comp.nome,
                              componente_codigo: comp.codigo_produto || comp.codigo_peca || '',
                              quantidade,
                              custo: custoCalculado,
                              valor_unitario: valorUnit,
                              notas: 'Adicional',
                              criado_em: new Date().toISOString(),
                            });
                          });
                          await ordensServicoAPI.update(ordem!.id, { observacoes: JSON.stringify(obs) });
                          setSelectedAdditional({});
                          setAdditionalQtyMap({});
                          setAdditionalQuery('');
                          setAdditionalResults([]);
                          alert('Peças adicionais adicionadas');
                        } catch (e) {
                          console.error('Erro ao adicionar peças selecionadas', e);
                          alert('Erro ao adicionar peças selecionadas');
                        }
                      }} className="px-4 py-2 bg-blue-600 text-white rounded">Adicionar selecionadas</button>
                    </div>
                  )}
                </div>

                <ComponenteTerceirizadoModal
                  isOpen={showComponenteModal}
                  onClose={() => setShowComponenteModal(false)}
                  equipamentoId={ordem?.equipamento_id}
                  osId={ordem?.id}
                  onCreated={() => { /* refresh if needed */ }}
                  darkMode={darkMode}
                />
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2 rounded bg-gray-300">Cancelar</button>
          <button onClick={handleConfirm} disabled={saving} className="px-4 py-2 rounded bg-yellow-600 text-black">{saving ? 'Iniciando...' : 'Confirmar'}</button>
        </div>
      </div>
    </div>
  );
}
