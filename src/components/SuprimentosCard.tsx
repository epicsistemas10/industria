import React, { useState } from 'react';

interface Props {
  item: any;
  onUpdate?: (id: string, payload: any) => Promise<any>;
  onDelete?: (id: string) => Promise<void>;
  isDuplicate?: boolean;
  as?: 'card' | 'row';
  initialExpanded?: boolean;
  tvMode?: boolean;
}

export default function SuprimentosCard({
  item,
  onUpdate,
  onDelete,
  isDuplicate,
  as = 'card',
  initialExpanded = false,
  tvMode = false,
}: Props) {
  const [expanded, setExpanded] = useState<boolean>(() => Boolean(initialExpanded && !tvMode));
  const [saving, setSaving] = useState(false);

  const nome = item?.nome ?? '—';
  const saldo = Number(item?.saldo_estoque ?? item?.quantidade ?? 0) || 0;
  const unidade = item?.unidade_medida || item?.unidade || 'un';
  const estoqueMinimo = item?.estoque_minimo ?? null;

  const isLow = estoqueMinimo != null && Number(estoqueMinimo) > 0 && saldo < Number(estoqueMinimo);

  const fmt = (n: number | null | undefined) => (n == null || Number.isNaN(n) ? '-' : Math.round(n).toLocaleString('pt-BR'));

  const handleSaveMin = async (value: number | null) => {
    if (!onUpdate) return;
    try {
      setSaving(true);
      await onUpdate(item.id, { estoque_minimo: value === null ? null : Number(value) });
    } catch (err) {
      console.error(err);
      alert('Erro ao salvar mínimo');
    } finally {
      setSaving(false);
    }
  };

  // Row rendering
  if (as === 'row') {
    return (
      <tr className={`${isLow ? 'bg-red-900/10' : ''}`}>
        <td className="px-4 py-3">
          <div className="font-medium">{nome}</div>
          <div className="text-xs text-gray-400">{item?.codigo_produto ?? '-'}</div>
        </td>
        <td className="px-4 py-3">{unidade}</td>
        <td className="px-4 py-3 text-right">{fmt(saldo)}</td>
        <td className="px-4 py-3 text-right">{estoqueMinimo != null ? String(estoqueMinimo) : '-'}</td>
        <td className="px-4 py-3 text-center">
          {!tvMode && (
            <div className="flex items-center justify-center gap-2">
              <button onClick={() => setExpanded(s => !s)} className="w-8 h-8 bg-gray-700 text-white rounded">⋯</button>
              {onDelete && (
                <button
                  onClick={async () => {
                    if (!confirm('Remover suprimento?')) return;
                    try {
                      await onDelete(item.id);
                    } catch (err) {
                      console.error(err);
                    }
                  }}
                  className="w-8 h-8 bg-red-600 text-white rounded"
                >
                  🗑
                </button>
              )}
            </div>
          )}
        </td>
      </tr>
    );
  }

  // Card rendering
  const Card = ({ clone }: { clone?: boolean }) => (
    <div className={`p-3 rounded-md shadow-sm bg-neutral-800 text-white ${tvMode ? 'h-48 text-sm' : 'h-auto text-base'}`}>
      {clone && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="text-4xl font-black text-yellow-200/90 uppercase tracking-wide">DUPLICADO</div>
        </div>
      )}

      <div className="flex items-start justify-between">
        <div>
          <div className={`${tvMode ? 'font-semibold text-lg' : 'font-semibold'}`}>{nome}</div>
          <div className={`${tvMode ? 'text-xs text-gray-300' : 'text-xs text-gray-300'}`}>{item?.codigo_produto ?? '-'}</div>
          {/* show programmed minimum on card (useful for TV mode) */}
          <div className="text-xs text-slate-200 mt-1">Mínimo programado: <span className="font-medium">{estoqueMinimo != null ? String(estoqueMinimo) : '—'}</span></div>
        </div>
        <div className="text-right">
          <div className={`${tvMode ? 'font-medium bg-green-700 px-2 py-0.5 rounded text-base' : 'font-medium bg-green-700 px-2 py-0.5 rounded'}`}>{fmt(saldo)} {unidade}</div>
          {isLow && <div className="text-xs text-red-300 mt-1">Abaixo do mínimo</div>}
        </div>
      </div>

      {!tvMode && (
        <div className="mt-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button onClick={() => setExpanded(s => !s)} className="px-2 py-1 bg-indigo-600 rounded text-sm">{expanded ? 'Fechar' : 'Detalhes'}</button>
            {onUpdate && (
              <button onClick={async () => { await onUpdate(item.id, {}); }} className="px-2 py-1 bg-blue-600 rounded text-sm">Atualizar</button>
            )}
          </div>
          {onDelete && (
            <button onClick={async () => { if (!confirm('Remover suprimento?')) return; await onDelete(item.id); }} className="px-2 py-1 bg-red-600 rounded text-sm">Excluir</button>
          )}
        </div>
      )}

      {expanded && !tvMode && (
        <div className="mt-3 text-sm text-gray-200">
          <div>Mínimo: {estoqueMinimo != null ? String(estoqueMinimo) : '-'}</div>
          <div>Unidade: {unidade}</div>
          {onUpdate && (
            <div className="mt-2 flex items-center gap-2">
              <input
                type="number"
                defaultValue={estoqueMinimo ?? ''}
                onBlur={(e) => {
                  const v = e.target.value;
                  const n = v === '' ? null : Number(v);
                  if (Number.isNaN(n as number)) return;
                  handleSaveMin(n as number | null);
                }}
                className="px-2 py-1 rounded bg-black/30 text-white text-sm w-24"
              />
              <button onClick={() => setExpanded(false)} className="px-2 py-1 bg-gray-700 rounded text-sm">Fechar</button>
            </div>
          )}
        </div>
      )}
    </div>
  );

  return (
    <div className="space-y-3">
      <Card />
      {isDuplicate && (
        <div>
          <Card clone />
        </div>
      )}
    </div>
  );
}
