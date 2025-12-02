import React, { useState, useRef, useEffect } from 'react';
import { formatEquipamentoName } from '../../utils/format';

interface Servico { id: string; nome: string; percentual_revisao?: number }
interface Equipamento { id: string; nome: string; numero?: any; ind?: string; linha1?: string; linha2?: string; iba?: string; servicos?: Servico[] }

interface Props {
  equipamentos: Equipamento[];
  value: string;
  onChange: (id: string) => void;
  placeholder?: string;
  darkMode?: boolean;
}

export default function EquipmentDropdown({ equipamentos, value, onChange, placeholder = 'Selecione um equipamento', darkMode = true }: Props) {
  const [open, setOpen] = useState(false);
  const [filter, setFilter] = useState('');
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    window.addEventListener('click', onClick);
    return () => window.removeEventListener('click', onClick);
  }, []);

  const selected = equipamentos.find(eq => eq.id === value);

  const items = equipamentos.filter(eq => {
    if (!filter) return true;
    const q = filter.toLowerCase();
    return (
      (eq.nome || '').toLowerCase().includes(q) ||
      (String(eq.ind || '')).toLowerCase().includes(q) ||
      (String(eq.linha1 || '')).toLowerCase().includes(q) ||
      (String(eq.linha2 || '')).toLowerCase().includes(q)
    );
  });

  return (
    <div className="relative" ref={ref}>
      <div
        className={`w-full px-4 py-3 rounded-lg border flex items-center justify-between gap-2 cursor-pointer ${darkMode ? 'bg-slate-700 border-slate-600 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
        onClick={() => { setOpen(!open); setTimeout(() => { const el = document.getElementById('equip-search'); if (el) el.focus(); }, 50); }}
        role="button"
      >
        <div className="min-w-0">
          {selected ? (
            <div className="truncate">
              <div className={`text-sm font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>{formatEquipamentoName(selected)}</div>
              <div className={`text-xs ${darkMode ? 'text-gray-300' : 'text-gray-400'}`}>{selected.ind ? String(selected.ind) : ''}</div>
            </div>
          ) : (
            <div className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-500'}`}>{placeholder}</div>
          )}
        </div>
        <div className={`${darkMode ? 'text-gray-300' : 'text-gray-400'}`}>
          <i className="ri-arrow-down-s-line"></i>
        </div>
      </div>

      {open && (
        <div className={`absolute z-50 mt-2 w-full rounded-lg shadow-lg ${darkMode ? 'bg-slate-800 text-white' : 'bg-white text-gray-900'} max-h-60 overflow-auto`}>
          <div className="p-2">
            <input
              id="equip-search"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              placeholder="Buscar equipamento, IND ou linha..."
              className={`w-full px-3 py-2 rounded border ${darkMode ? 'bg-slate-700 border-slate-600 text-white' : 'bg-white border-gray-200 text-gray-900'}`}
            />
          </div>
          <div>
            {items.length === 0 && (
              <div className={`p-3 text-sm ${darkMode ? 'text-gray-300' : 'text-gray-500'}`}>Nenhum equipamento encontrado</div>
            )}
            {items.map(eq => (
              <button
                key={eq.id}
                onClick={() => { onChange(eq.id); setOpen(false); setFilter(''); }}
                className={`w-full text-left px-4 py-3 border-t ${darkMode ? 'border-slate-700 hover:bg-slate-700' : 'border-gray-100 hover:bg-gray-50'}`}
              >
                <div className="flex flex-col">
                  <div className="flex items-center justify-between">
                    <div className={`text-sm font-semibold truncate ${darkMode ? 'text-white' : 'text-gray-900'}`}>{eq.nome}</div>
                    {eq.numero !== undefined && eq.numero !== null && String(eq.numero).trim() !== '' && (
                      <div className="text-xs text-amber-300 ml-2">{String(eq.numero)}º</div>
                    )}
                  </div>
                  <div className={`text-xs mt-1 ${darkMode ? 'text-gray-300' : 'text-gray-500'}`}>
                    {eq.ind ? <span className="mr-2">IND: {eq.ind}</span> : null}
                    {eq.linha1 || eq.linha2 ? <span>{[eq.linha1, eq.linha2].filter(Boolean).join(' / ')}</span> : null}
                    {eq.iba ? <div className={`mt-1 text-xs ${darkMode ? 'text-gray-300' : 'text-gray-500'}`}>IBA: {eq.iba}</div> : null}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
