import React, { useState } from 'react';

interface Props {
  item: any;
  onUpdate: (id: string, payload: any) => Promise<any>;
  onDelete?: (id: string) => Promise<void>;
  isDuplicate?: boolean;
  as?: 'card' | 'row';
  initialExpanded?: boolean;
}

const PRODUCTION_PER_DAY = 1000; // fardos/dia

export default function SuprimentosCard({ item, onUpdate, onDelete, isDuplicate, as = 'card', initialExpanded }: Props) {
  const [isExpanded, setIsExpanded] = useState<boolean>(() => Boolean(initialExpanded));
  const [minValue, setMinValue] = useState<number | null>(item?.estoque_minimo ?? null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const qtd = Number(item?.saldo_estoque ?? item?.quantidade ?? 0) || 0;
  const unit = (item?.unidade_medida || '').toLowerCase();
  const nameUp = (item?.nome || '').toUpperCase();

  // heuristics
  const isArame = nameUp.includes('ARAME');
  const isBobinaKraft = nameUp.includes('PAPEL KRAFT') || nameUp.includes('KRAFT');
  const isLonaTransp = nameUp.includes('LONA PLÁSTICA TRANSPARENTE') || nameUp.includes('TRANSPARENTE');
  const isPolycinta = nameUp.includes('POLYCINTA') || nameUp.includes('POLY');
  const isFita095407 = (item?.codigo_produto || '') === '095407' || nameUp.includes('TENAX');
  const isLonaPreta = nameUp.includes('LONA PLÁSTICA PRETA') || nameUp.includes('PRETA');

  const [minUnit, setMinUnit] = useState<string>(() => {
    try {
      if (item?.meta && (item.meta.min_type || item.meta.min_unit)) {
        return (item.meta.min_type === 'days' ? 'dias' : (item.meta.min_type || item.meta.min_unit));
      }
    } catch (e) {}
    if (isArame || isFita095407) return 'fardos';
    if (isBobinaKraft) return 'malas';
    if (isLonaTransp || isPolycinta || isLonaPreta) return 'unidades';
    return 'unidades';
  });

  // formatting helper
  const fmt = (n: number | null | undefined, decimals = 0) => {
    if (n == null || Number.isNaN(n)) return '-';
    if (decimals === 0) return Math.round(n).toLocaleString('pt-BR');
    return n.toLocaleString('pt-BR', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
  };

  // compute labels & conversion
  let atendeLabel = '';
  let dias: number | null = null;
  let displayDias: number | null = null;
  let conversao = '';
  let estoqueDisplay = '';

  if (isArame) {
    const totalFios = qtd * 5;
    const totalFardos = totalFios / 8;
    dias = totalFardos / PRODUCTION_PER_DAY;
    atendeLabel = `${fmt(totalFardos, 2)} fardos`;
    conversao = `${fmt(qtd, 0)} kg × 5 fios = ${fmt(totalFios, 0)} fios → ${fmt(totalFardos, 2)} fardos`;
    estoqueDisplay = `${fmt(qtd, 0)} kg`;
  } else if (isBobinaKraft) {
    const totalMalas = qtd * 300;
    dias = totalMalas / 40;
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
    // For Tenax: present values in thousands (divide by 1000) and truncate
    const displayFardos = Math.trunc(totalFardos / 1000);
    displayDias = Math.trunc((dias ?? 0) / 1000);
    atendeLabel = `${fmt(displayFardos, 0)} Fardos`;
    conversao = `${fmt(qtd, 0)} unidades × 150 = ${fmt(displayFardos, 0)} Fardos`;
    estoqueDisplay = `${fmt(qtd, 0)} unidades`;
  } else if (isLonaPreta) {
    const totalCarretas = qtd / 4;
    atendeLabel = `${fmt(totalCarretas, 2)} carretas`;
    conversao = `${fmt(qtd, 0)} unidades ÷ 4 = ${fmt(totalCarretas, 2)} carretas`;
    estoqueDisplay = `${fmt(qtd, 0)} unidades`;
  } else {
    atendeLabel = `${fmt(qtd, 0)} ${unit || 'unidades'}`;
    conversao = `1 ${unit || 'un'} = ...`;
    estoqueDisplay = `${fmt(qtd, 0)} ${unit || ''}`;
  }

  const situation = (() => {
    const min = (minValue !== null && minValue !== undefined) ? Number(minValue) : (item?.estoque_minimo != null ? Number(item.estoque_minimo) : 0);
    const unitToUse = minUnit || (item?.meta && (item.meta.min_type || item.meta.min_unit)) || 'unidades';
    if (isArame || isFita095407) {
      const currentFardos = isArame ? ((qtd * 5) / 8) : (qtd * 150);
      if (unitToUse === 'fardos') return (min > 0 && currentFardos < min) ? 'ALERTA' : 'OK';
      return (min > 0 && qtd < min) ? 'ALERTA' : 'OK';
    }
    if (isBobinaKraft) {
      const totalMalas = qtd * 300;
      if (unitToUse === 'dias') return (min > 0 && (totalMalas / 40) < min) ? 'ALERTA' : 'OK';
      return (min > 0 && totalMalas < min) ? 'ALERTA' : 'OK';
    }
    if (isLonaTransp || isPolycinta || isLonaPreta) {
      return (min != null && qtd < min) ? 'ALERTA' : 'OK';
    }
    return (min > 0 && qtd < min) ? 'ALERTA' : 'OK';
  })();

  const low = situation === 'ALERTA';

  const saveMin = async () => {
    const original = { ...item };
    try {
      setSaving(true);
      const payload: any = { estoque_minimo: minValue === null ? null : Number(minValue) };
      payload.meta = { ...(item?.meta || {}), min_type: minUnit };
      const updated: any = await onUpdate(item.id, payload);
      if (updated) {
        setMinValue(updated.estoque_minimo ?? (minValue === null ? null : Number(minValue)));
        setMinUnit(updated?.meta?.min_type || updated?.meta?.min_unit || minUnit);
      }
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      console.error('Erro ao salvar minimo:', err);
      if (original) setMinValue(original.estoque_minimo ?? null);
      alert('Erro ao salvar mínimo. Veja o console para detalhes.');
    } finally {
      setSaving(false);
    }
  };

  const cardClass = 'bg-neutral-800 text-white border border-gray-700';

  const CardInner = ({ clone }: { clone?: boolean }) => (
    <div className={`${cardClass} p-3 rounded-md shadow-sm break-words relative ${clone ? 'opacity-90 border-2 border-dashed' : ''} ${isExpanded ? 'h-auto' : 'h-48'} flex flex-col ${isExpanded ? '' : 'overflow-hidden'} text-sm`}>
      {clone && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="text-4xl font-black text-yellow-200/90 uppercase tracking-wide">DUPLICADO</div>
        </div>
      )}

      <div className="flex items-start justify-between gap-3">
        <div onClick={() => setIsExpanded(s => !s)} className="cursor-pointer">
          <div className="font-semibold">
            {/* remove numeric/code prefix for Tenax names */}
            {(() => {
              const rawName = item?.nome || '';
              const displayName = isFita095407 ? rawName.replace(/^\s*\d+\s*[-–—:]?\s*/,'').trim() : rawName;
              return <span className="bg-orange-500/90 text-black px-2 py-0.5 rounded">{displayName}</span>;
            })()}
          </div>
          {isDuplicate && !clone && (
            <div className="text-xs inline-block mt-1 px-2 py-1 bg-yellow-200 text-yellow-900 rounded">Duplicado</div>
          )}
          <div className="text-xs text-gray-300">Estoque Atual: <span className="font-medium bg-green-700 text-white px-2 py-0.5 rounded">{estoqueDisplay}</span></div>
        </div>

        {/* right column intentionally left empty to avoid breaking title layout */}
      </div>

      <div className="mt-3 text-sm text-gray-200 flex-1">
        <div className="mb-1">Atende: <span className="font-medium break-words">{atendeLabel}</span></div>
        {dias != null && (<div className="mb-1">Dias de operação: <span className="font-medium">{isFita095407 ? (displayDias != null ? fmt(displayDias, 0) : '-') : fmt(dias, 2)}</span></div>)}
        {minValue != null && (
          <div className="mb-1">Mínimo programado: <span className="font-medium">{typeof minValue === 'number' ? fmt(Number(minValue), 0) : '-'} {minUnit || 'unidades'}</span></div>
        )}
        {isExpanded && (
          <div className="mt-2 text-xs text-gray-300">Conversão: <span className="font-medium break-words">{conversao}</span></div>
        )}
      </div>

      {isExpanded && (
        <div className="mt-3 border-t border-gray-800 pt-3 flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <input
              type="number"
              value={minValue ?? ''}
              onChange={(e) => {
                const v = e.target.value;
                if (v === '') return setMinValue(null);
                const n = Number(v);
                if (Number.isNaN(n)) return setMinValue(null);
                setMinValue(n);
              }}
              className="px-2 py-1 rounded bg-black/30 text-white text-sm w-20"
            />
            <select value={minUnit || ''} onChange={(e) => setMinUnit(e.target.value)} className="px-2 py-1 rounded bg-black/20 text-white text-sm">
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
          </div>

          <div className="flex items-center gap-2">
            <button onClick={saveMin} disabled={saving} className="w-20 px-2 py-1 bg-indigo-600 rounded text-white text-sm flex-shrink-0">{saving ? 'Salvando...' : 'Salvar'}</button>
            {saved && <div className="text-xs text-green-300">Salvo</div>}
            {onDelete && (
              <button onClick={async () => { if (!confirm('Remover suprimento?')) return; try { await onDelete(item.id); } catch (err) { console.error(err); } }} className="w-20 px-2 py-1 bg-red-600 rounded text-white text-sm flex-shrink-0">Excluir</button>
            )}
          </div>
        </div>
      )}
      {low && (
        <div className="mt-2 flex items-center justify-center gap-2">
          <span className="text-red-500 text-2xl leading-none ring-2 ring-red-500/40 rounded animate-pulse" aria-hidden>▲</span>
          <span className="text-xs font-semibold text-red-300 border border-red-500/50 px-2 py-0.5 rounded animate-pulse">Abaixo do mínimo</span>
        </div>
      )}
    </div>
  );

  if (as === 'row') {
    return (
      <tr className={`${situation === 'ALERTA' ? 'bg-red-900/40' : ''}`}>
        <td className="px-4 py-3">
          <div className="font-medium">{item?.nome}</div>
          <div className="text-xs text-gray-400">{item?.codigo_produto || item?.codigo_interno || item?.codigo_fabricante || '-'}</div>
        </td>
        <td className="px-4 py-3">{item?.codigo_produto || item?.codigo_fabricante || '-'}</td>
        <td className="px-4 py-3">{item?.unidade_medida || item?.unidade || '-'}</td>
        <td className="px-4 py-3 text-right">{fmt(Number(item?.saldo_estoque != null ? item.saldo_estoque : item?.quantidade) || 0)}</td>
        <td className="px-4 py-3 text-right">{item?.estoque_minimo != null ? String(item.estoque_minimo) : '-'}</td>
        <td className="px-4 py-3 text-center">
          <div className="flex items-center justify-center gap-2">
            <button onClick={() => { const ev = new CustomEvent('open-peca', { detail: { id: item?.peca_id } }); try { document.dispatchEvent(ev); } catch (e) { /* ignore */ } }} className="w-8 h-8 bg-blue-600 text-white rounded flex items-center justify-center">
              <i className="ri-edit-line"></i>
            </button>
            {onDelete && (
              <button onClick={async () => { if (!confirm('Remover suprimento?')) return; try { await onDelete(item.id); } catch (err) { console.error(err); } }} className="w-8 h-8 bg-red-600 text-white rounded flex items-center justify-center">
                <i className="ri-delete-bin-line"></i>
              </button>
            )}
          </div>
        </td>
      </tr>
    );
  }

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
