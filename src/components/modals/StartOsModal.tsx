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

  useEffect(() => {
    if (!isOpen) return;
    setStartAt(new Date().toISOString().slice(0, 16)); // yyyy-mm-ddThh:mm for input
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
        const ids = Array.from(new Set((parsedPlannedIds() || [])));
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

  // helper to collect equipe ids referenced by planned services
  const parsedPlannedIds = () => {
    try {
      const lst = (ordem?.observacoes ? JSON.parse(ordem.observacoes) : { planned_services: [] })?.planned_services || planned || [];
      return lst.map((p: any) => p?.equipe_id).filter(Boolean);
    } catch (e) {
      return [];
    }
  };

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
                    className={`w-full text-left px-3 py-2 rounded border ${selected ? 'bg-green-600 text-white' : 'bg-transparent text-left text-sm'} `}
                  >
                    <div className="flex items-center justify-between">
                      <div className="font-medium">{name}</div>
                      <div className="flex items-center gap-2">
                        <div className="text-xs text-gray-300">Equipe: {p.equipe_id || '-'}</div>
                        {p.iniciado_em && (
                          <div className="inline-block px-2 py-0.5 text-xs rounded bg-green-600 text-white">Iniciado</div>
                        )}
                        <button type="button" onClick={(e) => { e.stopPropagation(); setShowComponenteModal(true); }} className="ml-2 text-xs px-2 py-1 rounded bg-amber-600 text-black">Terceirizar</button>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="mb-4 text-sm text-gray-300">Sem serviços planejados para esta OS.</div>
        )}

        <div className="mb-4">
          <label className="block text-sm font-medium mb-2">Data e hora de início</label>
          <input type="datetime-local" value={startAt} onChange={(e) => setStartAt(e.target.value)} className="w-full px-3 py-2 rounded border" />
        </div>

        <div id="startos-parts-section" className="border rounded p-3 mb-4">
          <h4 className="font-semibold mb-2">Peças usadas / trocadas</h4>
          {(getObservacoesObject().parts_used || []).length === 0 && (
            <div className="text-sm text-gray-300 mb-2">Nenhuma peça registrada.</div>
          )}
          {(getObservacoesObject().parts_used || []).map((p: any, idx: number) => (
            <div key={idx} className="flex items-center justify-between gap-4 py-2">
              <div>
                <div className="font-medium">{p.componente_nome || p.componente_id || '—'}</div>
                <div className="text-sm text-gray-400">Qtd: {p.quantidade} • Custo: R$ {Number(p.custo || 0).toFixed(2)}</div>
                <div className="text-xs text-gray-300">{p.notas}</div>
              </div>
            </div>
          ))}

          <div className="grid grid-cols-1 md:grid-cols-4 gap-2 items-end mt-3">
            <select value={partsForm.componente_id} onChange={(e) => setPartsForm({ ...partsForm, componente_id: e.target.value })} className="px-3 py-2 rounded border col-span-2">
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
            <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>Peças adicionais</label>
            <div className="flex gap-2">
              <input type="text" value={additionalQuery} onChange={(e) => setAdditionalQuery(e.target.value)} placeholder="Buscar por código ou nome" className="flex-1 px-3 py-2 rounded border" />
              <button type="button" onClick={searchAdditional} className="px-3 py-2 bg-emerald-500 rounded">Buscar</button>
            </div>
            <div className="mt-2">
              {additionalResults.length === 0 && <div className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>Nenhum resultado</div>}
              {additionalResults.map((c) => (
                <div key={c.id} className="flex items-center justify-between gap-2 py-2 border-b border-slate-600">
                  <div className="flex items-center gap-3">
                    <input type="checkbox" checked={!!selectedAdditional[String(c.id)]} onChange={(e) => setSelectedAdditional({ ...selectedAdditional, [String(c.id)]: e.target.checked })} />
                    <div>
                      <div className="font-medium">{c.codigo_produto ? `${c.codigo_produto} — ${c.nome}` : c.nome}</div>
                      <div className="text-sm text-gray-400">R$ {Number(c.valor_unitario || 0).toFixed(2)}</div>
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

        <div className="flex justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2 rounded bg-gray-300">Cancelar</button>
          <button onClick={handleConfirm} disabled={saving} className="px-4 py-2 rounded bg-yellow-600 text-black">{saving ? 'Iniciando...' : 'Confirmar'}</button>
        </div>
      </div>
    </div>
  );
}
