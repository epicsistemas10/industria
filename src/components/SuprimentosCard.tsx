import React, { useState } from 'react';

interface Props {
  item: any;
  onUpdate: (id: string, payload: any) => Promise<any>;
  onDelete?: (id: string) => Promise<void>;
  isDuplicate?: boolean;
}

const PRODUCTION_PER_DAY = 1000; // fardos/dia

export default function SuprimentosCard({ item, onUpdate, onDelete, isDuplicate }: Props) {
  const [minValue, setMinValue] = useState<number | null>(item.estoque_minimo ?? null);
  const qtd = Number(item.quantidade) || 0;
  const unit = (item.unidade_medida || '').toLowerCase();
  const name = (item.nome || '').toUpperCase();

  // determine type heuristics by name/codigo
  const isArame = name.includes('ARAME');
  const isBobinaKraft = name.includes('PAPEL KRAFT') || name.includes('KRAFT');
  const isLonaTransp = name.includes('LONA PLÁSTICA TRANSPARENTE') || name.includes('TRANSPARENTE');
  const isPolycinta = name.includes('POLYCINTA') || name.includes('POLY');
  const isFita095407 = (item.codigo_produto || '') === '095407' || name.includes('TENAX');
  const isLonaPreta = name.includes('LONA PLÁSTICA PRETA') || name.includes('PRETA');

  const [minUnit, setMinUnit] = useState<string | null>(() => {
    // prefer explicit meta value, fallback to heuristics
    if (item?.meta && (item.meta.min_type || item.meta.min_unit)) {
      const raw = item.meta.min_type || item.meta.min_unit;
      if (raw === 'days') return 'dias';
      return raw;
    }
    if (isArame || isFita095407) return 'fardos';
    if (isBobinaKraft) return 'malas';
    if (isLonaTransp || isPolycinta || isLonaPreta) return 'unidades';
    return 'unidades';
  });

  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // calculations
  let atendeLabel = '';
  let dias = null as number | null;
  let conversao = '';
  let estoqueDisplay = '';

  // helper to format numbers according to pt-BR (thousands with '.')
  const fmt = (n: number | null | undefined, decimals = 0) => {
    if (n == null || Number.isNaN(n)) return '-';
    if (decimals === 0) return Math.round(n).toLocaleString('pt-BR');
    return n.toLocaleString('pt-BR', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
  };

  if (isArame) {
    // qtd in Kg
    const totalFios = qtd * 5;
    const totalFardos = totalFios / 8;
    dias = totalFardos / PRODUCTION_PER_DAY;
    atendeLabel = `${fmt(totalFardos, 2)} fardos`;
    conversao = `${fmt(qtd, 0)} kg × 5 fios = ${fmt(totalFios, 0)} fios → ${fmt(totalFardos, 2)} fardos`;
    estoqueDisplay = `${fmt(qtd, 0)} kg`;
  } else if (isBobinaKraft) {
    const totalMalas = qtd * 300;
    dias = totalMalas / 40; // consumo diario 40 malas
    atendeLabel = `${fmt(totalMalas, 0)} malas`;
    conversao = `${fmt(qtd, 0)} unidades × 300 = ${fmt(totalMalas, 0)} malas`;
    estoqueDisplay = `${fmt(qtd, 0)} unidades`;
  } else if (isLonaTransp) {
    const totalBlocos = qtd * 4;
    atendeLabel = `${fmt(totalBlocos, 0)} blocos`;
    conversao = `${fmt(qtd, 0)} unidades × 4 = ${fmt(totalBlocos, 0)} blocos`;
    estoqueDisplay = `${fmt(qtd, 0)} unidades`;
  } else if (isPolycinta) {
    const totalBlocos = qtd * 10;
    atendeLabel = `${fmt(totalBlocos, 0)} blocos`;
    conversao = `${fmt(qtd, 0)} unidades × 10 = ${fmt(totalBlocos, 0)} blocos`;
    estoqueDisplay = `${fmt(qtd, 0)} unidades`;
  } else if (isFita095407) {
    const totalFardos = qtd * 150;
    dias = totalFardos / PRODUCTION_PER_DAY;
    atendeLabel = `${fmt(totalFardos, 0)} fardos`;
    conversao = `${fmt(qtd, 0)} unidades × 150 = ${fmt(totalFardos, 0)} fardos`;
    estoqueDisplay = `${fmt(qtd, 0)} unidades`;
  } else if (isLonaPreta) {
    // For Lona Preta the conversion should divide (e.g., units per carreta)
    const totalCarretas = qtd / 4;
    atendeLabel = `${fmt(totalCarretas, 2)} carretas`;
    conversao = `${fmt(qtd, 0)} unidades ÷ 4 = ${fmt(totalCarretas, 2)} carretas`;
    estoqueDisplay = `${fmt(qtd, 0)} unidades`;
  } else {
    // default display
    atendeLabel = `${fmt(qtd, 0)} ${unit || 'unidades'}`;
    conversao = `1 ${unit || 'un'} = ...`;
    estoqueDisplay = `${fmt(qtd, 0)} ${unit || ''}`;
  }

  const low = (() => {
    if (dias != null && (item.estoque_minimo != null) && item.estoque_minimo > 0) {
      // If estoque_minimo stored in same units as dias? We'll compare depending on type
      return false; // we'll check per-type below when evaluating min
    }
    return false;
  })();

  const situation = (() => {
    // Determine based on type: if estoque_minimo is set in fardos/dias/unidades
    // prefer local edit value, otherwise fall back to stored item.estoque_minimo
    const min = (minValue !== null && minValue !== undefined) ? Number(minValue) : (item.estoque_minimo != null ? Number(item.estoque_minimo) : 0);
    // use selected minUnit or meta
    const unitToUse = minUnit || (item?.meta && (item.meta.min_type || item.meta.min_unit)) || 'unidades';
    if (isArame || isFita095407) {
      const currentFardos = isArame ? ((qtd * 5) / 8) : (qtd * 150);
      if (unitToUse === 'fardos') return (min > 0 && currentFardos < min) ? 'ALERTA' : 'OK';
      // otherwise compare units fallback
      return (min > 0 && qtd < min) ? 'ALERTA' : 'OK';
    }
    if (isBobinaKraft) {
      const totalMalas = qtd * 300;
      if (unitToUse === 'dias') {
        return (min > 0 && (totalMalas / 40) < min) ? 'ALERTA' : 'OK';
      }
      return (min > 0 && totalMalas < min) ? 'ALERTA' : 'OK';
    }
    if (isLonaTransp || isPolycinta || isLonaPreta) {
      const currentUnits = qtd;
      return (min != null && currentUnits < min) ? 'ALERTA' : 'OK';
    }
    return (min > 0 && qtd < min) ? 'ALERTA' : 'OK';
  })();

  const saveMin = async () => {
    let original = null as any;
    try {
      original = { ...item };
      // show saving state
      setSaving(true);
      const payload: any = { estoque_minimo: minValue === null ? null : Number(minValue) };
      // persist min unit into meta
      payload.meta = { ...(item.meta || {}), min_type: minUnit };
      // onUpdate now returns the updated row (optimistic update handled by hook)
      const updated: any = await onUpdate(item.id, payload);
      // prefer authoritative values from server when available
      if (updated) {
        setMinValue(updated.estoque_minimo ?? (minValue === null ? null : Number(minValue)));
        setMinUnit(updated?.meta?.min_type || updated?.meta?.min_unit || minUnit);
      } else {
        setMinValue(minValue === null ? null : Number(minValue));
        setMinUnit(minUnit);
      }
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      console.error('Erro ao salvar minimo:', err);
      // optional: restore UI
      if (original) setMinValue(original.estoque_minimo ?? null);
      alert('Erro ao salvar mínimo. Veja o console para detalhes.');
    } finally {
      setSaving(false);
    }
  };

  // style card red when in ALERTA
  const cardClass = situation === 'ALERTA' ? 'bg-red-800 text-white' : 'bg-slate-800 text-gray-100';

  // Reusable card content so we can render an additional "duplicated" visual copy
  const CardInner = ({ clone }: { clone?: boolean }) => (
    <div className={`${cardClass} p-4 rounded-lg shadow-sm break-words relative ${clone ? 'opacity-90 border-2 border-dashed' : ''}`}>
      {clone && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="text-4xl font-black text-yellow-200/90 uppercase tracking-wide">DUPLICADO</div>
        </div>
      )}
      <div className="flex items-start justify-between">
        <div>
          <div className="font-semibold">{item.nome}</div>
          {isDuplicate && !clone && (
            <div className="text-xs inline-block mt-1 px-2 py-1 bg-yellow-200 text-yellow-900 rounded">Duplicado</div>
          )}
          <div className="text-xs text-gray-300">Estoque Atual: <span className="font-medium">{estoqueDisplay}</span></div>
        </div>
        <div className="text-right">
              {situation === 'ALERTA' && (
                <div className="mb-1 inline-block px-2 py-1 rounded bg-yellow-200 text-red-900 font-bold">ALERTA: abaixo do mínimo</div>
              )}
              <div className="text-xs text-gray-400">Unidade: {item.unidade_medida || '-'}</div>
        </div>
      </div>

      <div className="mt-3 text-sm text-gray-200">
        <div className="mb-2">Conversão: <span className="font-medium break-words">{conversao}</span></div>
        <div className="mb-2">Atende: <span className="font-medium break-words">{atendeLabel}</span></div>
          {dias != null && (<div className="mb-2">Dias de operação: <span className="font-medium">{fmt(Math.round(dias), 0)}</span></div>)}
          {minValue != null && (
              <div className="mb-2">Mínimo programado: <span className="font-medium">{typeof minValue === 'number' ? fmt(Number(minValue), 0) : '-'} {minUnit || 'unidades'}</span></div>
            )}
      </div>

      <div className="mt-3 flex items-center gap-2">
        <input type="number" value={minValue ?? ''} onChange={(e) => {
            const v = e.target.value;
            if (v === '') return setMinValue(null);
            const n = Number(v);
            if (Number.isNaN(n)) return setMinValue(null);
            setMinValue(n);
          }} className="px-2 py-1 rounded bg-black/30 text-white text-sm w-20" disabled={!!clone} />
        <select value={minUnit || ''} onChange={(e) => setMinUnit(e.target.value)} className="px-2 py-1 rounded bg-black/20 text-white text-sm" disabled={!!clone}>
          {isArame && <option value="fardos">fardos</option>}
          {isFita095407 && <option value="fardos">fardos</option>}
          {isBobinaKraft && (
            <>
              <option value="malas">malas</option>
              <option value="dias">dias</option>
            </>
          )}
          {(isLonaTransp || isPolycinta || isLonaPreta) && <option value="unidades">unidades</option>}
          {!isArame && !isFita095407 && !isBobinaKraft && !isLonaTransp && !isPolycinta && !isLonaPreta && <option value="unidades">unidades</option>}
        </select>
        <button onClick={saveMin} disabled={saving || clone} className="px-2 py-1 bg-indigo-600 rounded text-white text-sm">{saving ? 'Salvando...' : 'Salvar'}</button>
        {saved && <div className="text-xs text-green-300 ml-2">Salvo</div>}
        {onDelete && (
          <button onClick={async () => {
            if (!confirm('Remover suprimento?')) return;
            try {
              await onDelete(item.id);
            } catch (err) {
              console.error('Erro ao deletar suprimento:', err);
            }
          }} className="px-2 py-1 bg-red-600 rounded text-white text-sm" disabled={clone}>Excluir</button>
        )}
      </div>
    </div>
  );

  // If duplicate, render original card followed by a clearly marked duplicated visual copy
  return (
    <div className="space-y-3">
      <CardInner />
      {isDuplicate && (
        <div>
          <CardInner clone />
        </div>
      )}
    </div>
  );
}
