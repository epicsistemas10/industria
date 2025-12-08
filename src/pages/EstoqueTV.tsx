import React, { useEffect, useMemo, useState } from 'react';
import { supabase } from '../lib/supabase';
import useSuprimentos from '../hooks/useSuprimentos';
import {
  CheckCircle,
  AlertTriangle,
  Slash,
  Package as PackageIcon,
  Factory,
  RefreshCcw,
  Clock,
  MonitorSmartphone,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import SuprimentosCard from '../components/SuprimentosCard';

// A premium, TV-first dashboard for "CENTRAL DE ESTOQUE & SUPRIMENTOS – IBA SANTA LUZIA"
// Usage: navigate to /estoque-tv (or import and mount in a route). Optimized for 16:9 TVs.

type PecaRow = {
  id?: number;
  nome?: string;
  codigo_produto?: string | null;
  quantidade?: number | null;
  saldo_estoque?: number | null;
  estoque_minimo?: number | null;
};

type SuprimentoRow = {
  id?: number;
  nome?: string;
  codigo_produto?: string | null;
  quantidade?: number | null;
  saldo_estoque?: number | null;
  estoque_minimo?: number | null;
  meta?: any;
};

export default function EstoqueTV(): JSX.Element {
  const [pecas, setPecas] = useState<PecaRow[]>([]);
  const [suprimentosState, setSuprimentosState] = useState<SuprimentoRow[]>([]);
  const { data: suprimentosFromHook, fetch: fetchSuprimentos } = useSuprimentos();
  const [loading, setLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [autoRefresh, setAutoRefresh] = useState<boolean>(true);
  const [tvMode, setTvMode] = useState<boolean>(false);
  const [carouselIndex, setCarouselIndex] = useState<number>(0);
  const [showDebugGroups, setShowDebugGroups] = useState<boolean>(false);

  // fetch data
  const fetchAll = async () => {
    setLoading(true);
    try {
      // helper: fetch in pages to avoid server-side row caps (e.g. PostgREST limits)
      const fetchAllRows = async (table: string, cols: string) => {
        const out: any[] = [];
        const CHUNK = 1000;
        let offset = 0;
        while (true) {
          try {
            const { data, error } = await supabase.from(table).select(cols).range(offset, offset + CHUNK - 1);
            if (error) {
              console.warn(`${table} fetch chunk error`, { offset, error });
              break;
            }
            if (!data || data.length === 0) break;
            out.push(...data);
            if (data.length < CHUNK) break;
            offset += CHUNK;
          } catch (e) {
            console.warn(`${table} fetch chunk unexpected error`, e);
            break;
          }
        }
        return out;
      };

      const pData = await fetchAllRows('pecas', 'id,nome,codigo_produto,quantidade,saldo_estoque,estoque_minimo');
      setPecas(Array.isArray(pData) ? pData as PecaRow[] : []);
      // populate suprimentos from the shared hook (ensure hook data is fresh)
      try {
        const fresh = await fetchSuprimentos();
        setSuprimentosState(Array.isArray(fresh) ? fresh as SuprimentoRow[] : (Array.isArray(suprimentosFromHook) ? suprimentosFromHook as SuprimentoRow[] : []));
      } catch (e) {
        // fallback to hook data if fetch failed
        setSuprimentosState(Array.isArray(suprimentosFromHook) ? suprimentosFromHook as SuprimentoRow[] : []);
      }
      setLastUpdated(new Date());
    } catch (e) {
      console.error('fetchAll error', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
    let iv: any = null;
    if (autoRefresh) iv = setInterval(fetchAll, 30_000); // refresh every 30s by default
    return () => { if (iv) clearInterval(iv); };
  }, [autoRefresh]);

  // Carousel auto-rotate when TV mode is active
  useEffect(() => {
    if (!tvMode) return;
    const handle = setInterval(() => setCarouselIndex(i => (i + 1) % 2), 10_000); // rotate every 10s (2 panes)
    return () => clearInterval(handle);
  }, [tvMode]);

  // metrics
  const metrics = useMemo(() => {
    let ok = 0, atMin = 0, below = 0;
    // include both pecas and suprimentos in the metrics so TV reflects all inventory sources
    const rows = [...(pecas || []), ...((suprimentosState && suprimentosState.length) ? suprimentosState : (suprimentosFromHook || []))];
    for (const r of rows) {
      const qty = Number(r.saldo_estoque ?? r.quantidade ?? 0) as number;
      const min = Number(r.estoque_minimo ?? 0) as number;
      if (min > 0) {
        if (qty > min) ok++;
        else if (qty === min) atMin++;
        else /* qty < min */ below++;
      } else {
        // if no min defined treat as OK when positive, otherwise mark as below
        if (qty > 0) ok++; else below++;
      }
    }
    const total = rows.length || 1;
    const healthyPercent = Math.round((ok / total) * 100);
    return { ok, atMin, below, total, healthyPercent };
  }, [pecas, suprimentosState, suprimentosFromHook]);

  // computed alert list (merge pecas + suprimentos by name/code for listing alerts)
  const alertItems = useMemo(() => {
    // Merge pecas + suprimentos, dedupe by normalized key, then produce alert list
    const allRows = [...(pecas || []), ...((suprimentosState && suprimentosState.length) ? suprimentosState : (suprimentosFromHook || []))];
    const groups = new Map<string, any[]>();
    for (const it of allRows) {
      const key = normalizeLookupName(it.nome || it.codigo_produto || '');
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(it);
    }
    const reps: any[] = [];
    for (const [key, list] of groups) {
      if (!list || list.length === 0) continue;
      list.sort((a: any, b: any) => {
        const aP = a.peca_id ? 1 : 0;
        const bP = b.peca_id ? 1 : 0;
        if (aP !== bP) return bP - aP;
        const aM = (a.estoque_minimo != null) ? 1 : 0;
        const bM = (b.estoque_minimo != null) ? 1 : 0;
        if (aM !== bM) return bM - aM;
        const aq = Number(a.saldo_estoque ?? a.quantidade ?? 0);
        const bq = Number(b.saldo_estoque ?? b.quantidade ?? 0);
        return bq - aq;
      });
      reps.push(list[0]);
    }
    const out: any[] = [];
    for (const r of reps) {
      const qty = Number(r.saldo_estoque ?? r.quantidade ?? 0) as number;
      const min = Number(r.estoque_minimo ?? 0) as number;
      let status: 'ok' | 'min' | 'critical' = 'ok';
      if (min > 0) {
        if (qty > min) status = 'ok';
        else if (qty === min) status = 'min';
        else status = 'critical';
      } else {
        status = qty > 0 ? 'ok' : 'critical';
      }
      if (status !== 'ok') out.push({ kind: 'merged', id: r.id, nome: r.nome, codigo: r.codigo_produto, qty, min, status });
    }
    out.sort((a, b) => {
      const sev = { 'critical': 2, 'min': 1 } as any;
      const sa = sev[a.status] ?? 0;
      const sb = sev[b.status] ?? 0;
      if (sa !== sb) return sb - sa;
      return a.qty - b.qty;
    });
    return out;
  }, [pecas, suprimentosState, suprimentosFromHook]);

  // helpers
  const fmt = (n: number | null | undefined) => (n == null ? '-' : Number(n).toLocaleString('pt-BR'));

  // name normalization (same heuristics used on Suprimentos page to dedupe LONA etc.)
  function stripDiacritics(s: string) {
    try { return s.normalize('NFD').replace(/\p{Diacritic}/gu, ''); } catch (e) { return s; }
  }
  function normalizeLookupName(s: any) {
    if (s === null || s === undefined) return '';
    try {
      const raw = String(s).trim();
      let t = raw;
      if (!t) return '';
      t = stripDiacritics(t);
      t = t.replace(/\u00A0/g, ' ');
      t = t.replace(/[()\[\]{}<>]/g, ' ');
      t = t.replace(/[^\p{L}\p{N}% ]+/gu, ' ');
      t = t.replace(/\s+/g, ' ').trim().toUpperCase();

      t = t.replace(/\b\d+(?:[x×]\d+)(?:[A-Z]*)?\b/gu, '');
      t = t.replace(/\b\d+[.,]?\d*\s*(?:KG|G|GR|GRAM|M|MT|MM|MICRAS|MICRA|LT|L)\b/gu, '');
      t = t.replace(/\b\d+\s*(?:KG|G|GR|MT|M|MM|MICRAS)\b/gu, '');
      t = t.replace(/\b\d+[.,]?\d*\b/gu, '');

      t = t.replace(/\bMICRAS\b/gu, '');
      t = t.replace(/\bM2\b/gu, '');
      t = t.replace(/\s+/g, ' ').trim();

      if (t.includes('LONA') && t.includes('PRETA')) return 'LONA PLASTICA PRETA';
      if (t.includes('LONA') && (t.includes('TRANSPARENTE') || t.includes('TRANSP'))) return 'LONA PLASTICA TRANSPARENTE';
      if (t.includes('POLYCINTA') || t.includes('POLY')) return 'POLYCINTA';

      if (/\bRUI?DO(?: DE FREIO)?\b/i.test(t)) return '';

      // fallback: if normalization removed most content, use a safer key from the original raw name
      if (!t || t.length < 3) {
        const fb = stripDiacritics(raw).replace(/[^\p{L} ]+/gu, ' ').replace(/\s+/g, ' ').trim().toUpperCase();
        return fb;
      }

      return t;
    } catch (e) { return String(s).trim().toUpperCase(); }
  }

  // dedup suprimentos for TV view
  const tvSuprimentos = useMemo(() => {
    const src = (suprimentosState && suprimentosState.length) ? suprimentosState : (suprimentosFromHook || []);
    const groups = new Map<string, any[]>();
    for (const it of (src || [])) {
      const key = normalizeLookupName(it.nome || it.codigo_produto || '');
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(it);
    }
    const reps: any[] = [];
    for (const [key, list] of groups) {
      if (!list || list.length === 0) continue;
      list.sort((a: any, b: any) => {
        const aP = a.peca_id ? 1 : 0;
        const bP = b.peca_id ? 1 : 0;
        if (aP !== bP) return bP - aP;
        const aM = (a.estoque_minimo != null) ? 1 : 0;
        const bM = (b.estoque_minimo != null) ? 1 : 0;
        if (aM !== bM) return bM - aM;
        const aq = Number(a.saldo_estoque ?? a.quantidade ?? 0);
        const bq = Number(b.saldo_estoque ?? b.quantidade ?? 0);
        return bq - aq;
      });
      reps.push(list[0]);
    }
    return reps;
  }, [suprimentosState, suprimentosFromHook]);

  // debug groups for inspection when troubleshooting duplicates
  const tvGroupsDebug = useMemo(() => {
    const src = (suprimentosState && suprimentosState.length) ? suprimentosState : (suprimentosFromHook || []);
    const groups = new Map<string, any[]>();
    for (const it of (src || [])) {
      const key = normalizeLookupName(it.nome || it.codigo_produto || '');
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(it);
    }
    return groups;
  }, [suprimentosState, suprimentosFromHook]);

  // TV mode helpers
  const toggleFullscreen = async () => {
    try {
      if (!tvMode) {
        const el = document.documentElement;
        if (el.requestFullscreen) await el.requestFullscreen();
        setTvMode(true);
      } else {
        if (document.fullscreenElement) await document.exitFullscreen();
        setTvMode(false);
      }
    } catch (e) { console.warn('fullscreen failed', e); }
  };

  // simple keyboard shortcuts for TV mode: press T to toggle
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key.toLowerCase() === 't') toggleFullscreen(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [tvMode]);

  // small components
  const Header = () => (
    <header className="w-full bg-gradient-to-r from-[#0f172a] to-[#1e293b] text-white px-6 py-4 flex items-center justify-between shadow-2xl">
      <div className="flex items-center gap-4">
        <img src="/logo.png" alt="Bom Futuro" className="h-12 w-auto object-contain filter brightness-0 invert" />
        <div>
          <div className="text-xs text-slate-300">CENTRAL DE ESTOQUE & SUPRIMENTOS</div>
          <div className="text-2xl font-extrabold tracking-wider uppercase">IBA SANTA LUZIA</div>
        </div>
      </div>
        <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 text-sm text-slate-300">
          <Clock className="text-slate-200" />
          <div>{new Date().toLocaleTimeString()}</div>
        </div>
        <button onClick={() => { setAutoRefresh(a => !a); }} title="Auto refresh" className={`p-2 rounded ${autoRefresh ? 'bg-emerald-600' : 'bg-white/5'}`}>
          <RefreshCcw className="text-black" />
        </button>
        <button onClick={() => toggleFullscreen()} title="Modo TV" className="p-2 rounded bg-white/5 hover:bg-white/10">
          <MonitorSmartphone className="text-white" />
        </button>
      </div>
    </header>
  );

  const SummaryCards = () => (
    <div className={`grid ${tvMode ? 'grid-cols-3' : 'grid-cols-1 md:grid-cols-3'} gap-6 w-full`}> 
      <div className="p-6 rounded-2xl bg-gradient-to-br from-white/3 to-white/6 backdrop-blur border border-white/6 flex items-center gap-4">
        <div className="p-4 rounded-xl bg-[#0b3f1a]/80 text-[#22c55e] shadow-lg">
          <CheckCircle size={40} />
        </div>
        <div>
          <div className="text-xs text-slate-300">Produtos em Dia</div>
          <div className="text-3xl font-extrabold">{metrics.ok}</div>
          <div className="text-sm text-slate-200">{metrics.healthyPercent}% estoque saudável</div>
        </div>
      </div>

      <div className="p-6 rounded-2xl bg-gradient-to-br from-white/3 to-white/6 backdrop-blur border border-white/6 flex items-center gap-4">
        <div className="p-4 rounded-xl bg-[#533f03]/80 text-[#facc15] shadow-lg">
          <AlertTriangle size={40} />
        </div>
        <div>
          <div className="text-xs text-slate-300">Produtos no Mínimo</div>
          <div className="text-3xl font-extrabold">{metrics.atMin}</div>
          <div className="text-sm text-slate-200">Tempo estimado antes de crítico: —</div>
        </div>
      </div>

      <div className={`p-6 rounded-2xl border border-white/6 flex items-center gap-4 ${metrics.below > 0 ? 'animate-pulse-slow' : ''}`} style={{ background: 'linear-gradient(90deg, rgba(255,255,255,0.04), rgba(255,0,0,0.02))' }}>
        <div className="p-4 rounded-xl bg-[#4a0b0b]/80 text-[#ef4444] shadow-lg">
          <Slash size={40} />
        </div>
        <div>
          <div className="text-xs text-slate-300">Produtos Abaixo do Mínimo</div>
          <div className="text-3xl font-extrabold text-[#ef4444]">{metrics.below} <span className="text-sm text-red-200 font-semibold">AÇÃO URGENTE</span></div>
          <div className="text-sm text-slate-200">Itens críticos que requerem atenção imediata</div>
        </div>
      </div>
    </div>
  );

  const AlertList = () => (
    <div className="w-full">
      <h2 className="text-xl font-bold mb-4">Produtos em Alerta</h2>
      <div className={`grid ${tvMode ? 'grid-cols-3' : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'} gap-4`}> 
        {alertItems.map((a, idx) => (
          <div key={`${a.kind}-${a.id}-${idx}`} className={`p-4 rounded-xl shadow-xl border ${a.status === 'critical' ? 'bg-red-900/80 border-red-600 animate-pulse-strong' : (a.status === 'min' ? 'bg-yellow-900/70 border-yellow-400 animate-pulse-slow' : 'bg-white/3 border-white/6')}`}>
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-lg bg-white/5">
                <PackageIcon size={28} />
              </div>
              <div className="flex-1">
                <div className="text-sm text-slate-300">{a.nome}</div>
                <div className="text-xs text-slate-400">{a.codigo ?? '—'}</div>
              </div>
              <div className="text-right">
                <div className="text-xl font-bold">{fmt(a.qty)}</div>
                <div className="text-xs text-slate-400">Mín: {fmt(a.min)}</div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  // Use the shared `SuprimentosCard` component for consistency with the Suprimentos page

  return (
    <div className={`min-h-screen text-white ${tvMode ? 'text-2xl' : 'text-base'} font-sans bg-[#071122]`}>
      <Header />

      <main className={`p-6 ${tvMode ? 'px-12 py-8' : ''}`}>
        {/* Sections carousel when TV mode active */}
        <div className="mb-6">
          <div className={`${tvMode ? 'flex items-start gap-6' : ''}`}>
            <SummaryCards />
          </div>
        </div>

        <div className={`space-y-6 ${tvMode ? 'h-[58vh] overflow-hidden' : ''}`}>
          {/* Carousel panes */}
          <div className={`transition-transform duration-700`} style={{ transform: `translateX(-${carouselIndex * 100}%)` }}>
              <div className="grid grid-cols-1 gap-6" style={{ width: `${2 * 100}%`, display: 'flex' }}>
                <div style={{ width: '100%' }} className="p-4">
                  <AlertList />
                </div>
                <div style={{ width: '100%' }} className="p-4">
                  <div>
                    <h2 className="text-xl font-bold mb-4">Suprimentos</h2>
                    <div className="mb-3 flex items-center gap-3">
                      <button onClick={() => setShowDebugGroups(s => !s)} className="px-3 py-1 bg-gray-700 text-white rounded text-sm">{showDebugGroups ? 'Ocultar debug' : 'Mostrar debug'}</button>
                      <div className="text-sm text-slate-300">Itens: <strong>{(suprimentosState && suprimentosState.length) ? suprimentosState.length : (suprimentosFromHook || []).length}</strong></div>
                    </div>
                    <div className={`grid ${tvMode ? 'grid-cols-3' : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'} gap-4`}>
                      {tvSuprimentos && tvSuprimentos.length ? (
                        tvSuprimentos.map(s => <SuprimentosCard key={`sup-${s.id}`} item={s} />)
                      ) : (
                        <div className="p-6 rounded-2xl bg-white/5 border border-white/6 text-slate-300">Nenhum suprimento cadastrado.</div>
                      )}
                    </div>

                    {showDebugGroups && (
                      <div className="mt-4 p-3 bg-black/30 rounded text-sm text-slate-200">
                        <h3 className="font-bold mb-2">Debug — grupos normalizados</h3>
                        {[...tvGroupsDebug.entries()].map(([k, list]) => (
                          <div key={k} className="mb-2">
                            <div className="text-xs text-slate-400">Key: <code className="text-white">{k || '(vazio)'}</code> — count: {list.length}</div>
                            <ul className="list-disc ml-5 text-sm">
                              {list.map((it: any) => <li key={it.id || (it.nome + Math.random())}>{it.nome || it.codigo_produto || JSON.stringify(it)}</li>)}
                            </ul>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
          </div>
        </div>

        {/* Footer removed as requested (no last-updated card or info button) */}
      </main>

      {/* small styles for pulsing animations */}
      <style>{`
        .animate-pulse-slow { animation: pulse 2.6s infinite ease-in-out; }
        .animate-pulse-strong { animation: pulse 1.6s infinite ease-in-out; }
        @keyframes pulse { 0% { transform: translateY(0); } 50% { transform: translateY(-4px); } 100% { transform: translateY(0); } }
      `}</style>
    </div>
  );
}
