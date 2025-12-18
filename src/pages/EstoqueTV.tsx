import React, { useEffect, useMemo, useRef, useState } from 'react';
import { supabase } from '../lib/supabase';
import useSuprimentos from '../hooks/useSuprimentos';
import {
  CheckCircle,
  AlertTriangle,
  AlertCircle,
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
import rawGroupMapping from '../data/group-mapping.json';

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
  const [autoRefresh, setAutoRefresh] = useState<boolean>(false);
  const [tvMode, setTvMode] = useState<boolean>(false);
  const [carouselIndex, setCarouselIndex] = useState<number>(0);
  const [companyLogo, setCompanyLogo] = useState<string>('');
  // always show suprimentos as rows in TV
  

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

      const pData = await fetchAllRows('pecas', 'id,nome,codigo_produto,quantidade,saldo_estoque,estoque_minimo,grupo_produto,valor_unitario');
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
    // Resolve company logo: prefer env, then localStorage, then Supabase public file 'company_logo.png'
    (async () => {
      try {
        const envLogo = (import.meta as any).env?.VITE_COMPANY_LOGO_URL || null;
        if (envLogo) { setCompanyLogo(envLogo); return; }
        try {
          const saved = typeof window !== 'undefined' ? localStorage.getItem('company_logo') : null;
          if (saved) { setCompanyLogo(saved); return; }
        } catch (e) {}
        try {
          const mod = await import('../lib/supabase');
          const supabase = (mod as any).supabase;
          if (supabase) {
            const { data } = supabase.storage.from('mapas').getPublicUrl('company_logo.png');
            const publicUrl = data?.publicUrl || null;
            if (publicUrl) { setCompanyLogo(publicUrl); return; }
          }
        } catch (e) {}
        setCompanyLogo('/favicon.svg');
      } catch (e) { setCompanyLogo('/favicon.svg'); }
    })();

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
  // Build a merged, deduplicated row set for metrics and alerts
  const mergedRows = useMemo(() => {
    const allRows = [...(pecas || []), ...((suprimentosState && suprimentosState.length) ? suprimentosState : (suprimentosFromHook || []))];
    const groups = new Map<string, any[]>();
    for (const it of allRows) {
      const key = normalizeLookupName(it.nome || it.codigo_produto || '');
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(it);
    }

    // If there's an empty key group, try to reassign LONA-like items to canonical keys and drop fluidos
    if (groups.has('')) {
      const emptyList = groups.get('') || [];
      const toKeep: any[] = [];
      for (const it of emptyList) {
        const up = (it.nome || '').toString().toUpperCase();
        if (/FLUIDO|FLUIDO DE FREIO|FREIO/.test(up)) {
          // drop brake fluids from suprimentos TV view/metrics
          continue;
        }
        if (up.includes('LONA') && up.includes('PRETA')) {
          if (!groups.has('LONA PLASTICA PRETA')) groups.set('LONA PLASTICA PRETA', []);
          groups.get('LONA PLASTICA PRETA')!.push(it);
          continue;
        }
        if (up.includes('LONA') && (up.includes('TRANSPARENTE') || up.includes('TRANSP'))) {
          if (!groups.has('LONA PLASTICA TRANSPARENTE')) groups.set('LONA PLASTICA TRANSPARENTE', []);
          groups.get('LONA PLASTICA TRANSPARENTE')!.push(it);
          continue;
        }
        // otherwise keep in empty group
        toKeep.push(it);
      }
      if (toKeep.length > 0) groups.set('', toKeep); else groups.delete('');
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
  }, [pecas, suprimentosState, suprimentosFromHook]);

  // metrics and alerts will be computed from suprimentos representatives below

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

  // build merged groups from pecas + suprimentos (used for rendering and metrics)
  const mergedGroups = useMemo(() => {
    const allRows = [...(pecas || []), ...((suprimentosState && suprimentosState.length) ? suprimentosState : (suprimentosFromHook || []))];
    const groups = new Map<string, any[]>();
    for (const it of allRows) {
      const key = normalizeLookupName(it.nome || it.codigo_produto || '');
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(it);
    }

    // If there's an empty key group, try to reassign LONA-like items to canonical keys and drop fluids
    if (groups.has('')) {
      const emptyList = groups.get('') || [];
      const toKeep: any[] = [];
      for (const it of emptyList) {
        const up = (it.nome || '').toString().toUpperCase();
        if (/\b(FLUIDO|FLUIDO DE FREIO|FREIO|DOT)\b/i.test(up)) {
          // drop brake fluids from suprimentos TV view/metrics
          continue;
        }
        if (up.includes('LONA') && up.includes('PRETA')) {
          if (!groups.has('LONA PLASTICA PRETA')) groups.set('LONA PLASTICA PRETA', []);
          groups.get('LONA PLASTICA PRETA')!.push(it);
          continue;
        }
        if (up.includes('LONA') && (up.includes('TRANSPARENTE') || up.includes('TRANSP'))) {
          if (!groups.has('LONA PLASTICA TRANSPARENTE')) groups.set('LONA PLASTICA TRANSPARENTE', []);
          groups.get('LONA PLASTICA TRANSPARENTE')!.push(it);
          continue;
        }
        toKeep.push(it);
      }
      if (toKeep.length > 0) groups.set('', toKeep); else groups.delete('');
    }

    return groups;
  }, [pecas, suprimentosState, suprimentosFromHook]);

  const mergedRowsFromGroups = useMemo(() => {
    const reps: any[] = [];
    for (const [key, list] of mergedGroups) {
      if (!list || list.length === 0) continue;
      // prefer a row from `pecas` if available
      const pecaMatch = (pecas || []).find(p => normalizeLookupName(p.nome || p.codigo_produto || '') === key);
      if (pecaMatch) {
        reps.push(pecaMatch);
        continue;
      }
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
  }, [mergedGroups, pecas]);

  // tvRenderRows: only products that exist both in suprimentos and pecas
  const tvRenderRows = useMemo(() => {
    const pecaKeys = new Set<string>();
    for (const p of (pecas || [])) pecaKeys.add(normalizeLookupName(p.nome || p.codigo_produto || ''));
    const suprKeys = new Set<string>();
    for (const s of ((suprimentosState && suprimentosState.length) ? suprimentosState : (suprimentosFromHook || []))) suprKeys.add(normalizeLookupName(s.nome || s.codigo_produto || ''));
    const rows: any[] = [];
    for (const r of mergedRowsFromGroups) {
      const key = normalizeLookupName(r.nome || r.codigo_produto || '');
      if (!key) continue;
      // include items present in pecas OR suprimentos (union) so pecas-only updates (e.g., estoque_minimo) appear on TV
      if (!pecaKeys.has(key) && !suprKeys.has(key)) continue;
      // exclude non-suprimentos families like brake fluids and specific correia Poly-V matches
      const rn = (r.nome || '').toString().toUpperCase();
      if (/\b(FLUIDO|FREIO|DOT)\b/i.test(rn)) continue; // brake fluids
      if (rn.includes('CORREIA') || rn.includes('POLY V') || rn.includes('POLY-V') || rn.includes('POLYV')) continue; // exclude Poly-V correias
      rows.push(r);
    }
    return rows;
  }, [mergedRowsFromGroups, pecas, suprimentosState, suprimentosFromHook]);

  // Debug: log counts and presence of specific normalized keys (temporary)
  useEffect(() => {
    try {
      const pecaKeys = new Set<string>();
      for (const p of (pecas || [])) pecaKeys.add(normalizeLookupName(p.nome || p.codigo_produto || ''));
      const suprKeys = new Set<string>();
      for (const s of ((suprimentosState && suprimentosState.length) ? suprimentosState : (suprimentosFromHook || []))) suprKeys.add(normalizeLookupName(s.nome || s.codigo_produto || ''));
      const mergedCount = (mergedRowsFromGroups || []).length;
      const tvCount = (tvRenderRows || []).length;
      console.info('[EstoqueTV debug] counts', { pecaCount: (pecas || []).length, suprCount: ((suprimentosState && suprimentosState.length) ? suprimentosState.length : (suprimentosFromHook || []).length), mergedCount, tvCount });
      console.info('[EstoqueTV debug] keys present', { hasLonaPreta: pecaKeys.has('LONA PLASTICA PRETA') || suprKeys.has('LONA PLASTICA PRETA'), hasCorrea: pecaKeys.has(normalizeLookupName('CORREIA')) || suprKeys.has(normalizeLookupName('CORREIA')) });
    } catch (e) { /* ignore */ }
  }, [pecas, suprimentosState, suprimentosFromHook, mergedRowsFromGroups, tvRenderRows]);

  // Build suprimentos representatives exactly like the Suprimentos page (group by normalized key and pick representative)
  const suprimentosRepresentatives = useMemo(() => {
    const items = (suprimentosState && suprimentosState.length) ? suprimentosState : (suprimentosFromHook || []);
    const groups = new Map<string, any[]>();
    for (const it of (items || [])) {
      const key = normalizeLookupName(it.codigo_produto || it.nome || '');
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(it);
    }
    const representatives: any[] = [];
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
      representatives.push(list[0]);
    }
    return representatives;
  }, [suprimentosState, suprimentosFromHook]);

  // Use suprimentos representatives as the TV render rows so TV matches the Suprimentos page exactly
  const tvRenderRowsFromSuprimentos = useMemo(() => {
    return suprimentosRepresentatives || [];
  }, [suprimentosRepresentatives]);

  // Recompute metrics and alertItems using suprimentos representatives (so TV metrics match Suprimentos page)
  const metricsFromSuprimentos = useMemo(() => {
    let ok = 0, atMin = 0, below = 0;
    const rows = tvRenderRowsFromSuprimentos;
    for (const r of rows) {
      const qty = Number(r.saldo_estoque ?? r.quantidade ?? 0) as number;
      const min = Number(r.estoque_minimo ?? 0) as number;
      if (min > 0) {
        if (qty > min) ok++;
        else if (qty === min) atMin++;
        else below++;
      } else {
        if (qty > 0) ok++; else below++;
      }
    }
    const total = rows.length || 1;
    const healthyPercent = Math.round((ok / total) * 100);
    return { ok, atMin, below, total, healthyPercent };
  }, [tvRenderRowsFromSuprimentos]);

  // Build alert list from `pecas` (authoritative). Use suprimentos representatives to obtain current qty when present.
  const alertItemsFromSuprimentos = useMemo(() => {
    const out: any[] = [];
    // build mapping code -> friendly name from static mapping file (fallback for stored codes)
    const mappingArray: Array<{ codigo: string; grupo: string }> = Array.isArray(rawGroupMapping) ? rawGroupMapping : [];
    const codeToName = new Map<string, string>(mappingArray.map(m => [m.codigo, m.grupo]));
    const reps = suprimentosRepresentatives || [];
    const repMap = new Map<string, any>();
    for (const r of reps) repMap.set(normalizeLookupName(r.nome || r.codigo_produto || ''), r);
    for (const p of (pecas || [])) {
      const minRaw = p.estoque_minimo;
      // skip pecas without configured minimum
      if (minRaw == null || Number(minRaw) <= 0) continue;
      const key = normalizeLookupName(p.nome || p.codigo_produto || '');
      const sup = repMap.get(key);
      const qty = Number(sup?.saldo_estoque ?? sup?.quantidade ?? p.saldo_estoque ?? p.quantidade ?? 0) as number;
      const min = Number(p.estoque_minimo ?? 0) as number;
      let status: 'ok' | 'min' | 'critical' = 'ok';
      if (min > 0) {
        if (qty > min) status = 'ok';
        else if (qty === min) status = 'min';
        else status = 'critical';
      }
      if (status !== 'ok') {
        const rawGroup = (p.grupo_produto || sup?.grupo_produto) ?? null;
        const groupName = rawGroup ? (codeToName.get(String(rawGroup)) ?? String(rawGroup)) : 'Sem Grupo';
        out.push({ kind: 'peca', id: p.id, nome: p.nome, codigo: p.codigo_produto, qty, min, status, grupo: groupName });
      }
    }
    out.sort((a, b) => {
      const sev = { 'critical': 2, 'min': 1 } as any;
      const sa = sev[a.status] ?? 0;
      const sb = sev[b.status] ?? 0;
      if (sa !== sb) return sb - sa;
      return a.qty - b.qty;
    });
    return out;
  }, [pecas, suprimentosRepresentatives]);

  // Alias metrics and alert items to the values computed from suprimentos representatives
  // Compute metrics over `pecas` (authoritative total count) using suprimentos values when available
  const metricsFromPecas = useMemo(() => {
    let ok = 0, atMin = 0, below = 0;
    const reps = suprimentosRepresentatives || [];
    const repMap = new Map<string, any>();
    for (const r of reps) repMap.set(normalizeLookupName(r.nome || r.codigo_produto || ''), r);
    const rows = pecas || [];
    // Only consider pecas that have an explicit estoque_minimo configured (> 0)
    let totalWithMin = 0;
    for (const p of rows) {
      const minRaw = p.estoque_minimo;
      if (minRaw == null || Number(minRaw) <= 0) continue;
      totalWithMin += 1;
      const key = normalizeLookupName(p.nome || p.codigo_produto || '');
      const sup = repMap.get(key);
      const qty = Number(sup?.saldo_estoque ?? sup?.quantidade ?? p.saldo_estoque ?? p.quantidade ?? 0) as number;
      const min = Number(p.estoque_minimo ?? 0) as number;
      if (min > 0) {
        if (qty > min) ok++;
        else if (qty === min) atMin++;
        else below++;
      }
    }
    const total = totalWithMin || 1;
    const healthyPercent = Math.round((ok / total) * 100);
    // return counts computed from `pecas` (authoritative). Expose totalWithMin and totalPecas.
    return { ok, atMin, below, totalWithMin, totalPecas: (rows || []).length, healthyPercent };
  }, [pecas, suprimentosRepresentatives]);

  const metrics = metricsFromPecas;
  const alertItems = alertItemsFromSuprimentos;

  // TV mode helpers
  const toggleFullscreen = async () => {
    try {
      const el = document.documentElement;
      if (!document.fullscreenElement) {
        if (el.requestFullscreen) await el.requestFullscreen();
        try { document.documentElement.style.backgroundColor = '#071122'; document.body.style.background = '#071122'; } catch (e) {}
      } else {
        if (document.exitFullscreen) await document.exitFullscreen();
        try { document.documentElement.style.backgroundColor = ''; document.body.style.background = ''; } catch (e) {}
      }
    } catch (e) { console.warn('fullscreen failed', e); }
  };

  // keep tvMode state in sync with actual fullscreen state to avoid click mismatches
  useEffect(() => {
    const onFull = () => {
      const isFull = Boolean(document.fullscreenElement);
      setTvMode(isFull);
      try {
        if (isFull) { document.documentElement.style.backgroundColor = '#071122'; document.body.style.background = '#071122'; }
        else { document.documentElement.style.backgroundColor = ''; document.body.style.background = ''; }
      } catch (e) {}
    };
    window.addEventListener('fullscreenchange', onFull);
    return () => window.removeEventListener('fullscreenchange', onFull);
  }, []);

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
      <img src={companyLogo || '/logo.png'} alt="Empresa" className="h-12 w-auto object-contain filter brightness-0 invert" onError={() => { if (companyLogo !== '/favicon.svg') setCompanyLogo('/favicon.svg'); }} />
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

  const SummaryCards = () => {
    // compute separate monetary totals for pecas and suprimentos
    const suprKeys = new Set<string>();
    for (const s of (suprimentosRepresentatives || [])) suprKeys.add(normalizeLookupName(s.nome || s.codigo_produto || ''));

    // compute raw pecas total (sum of all pecas values) and build price map
    let pecasTotalRaw = 0;
    const pecaPriceMap = new Map<string, number>();
    for (const p of (pecas || [])) {
      const key = normalizeLookupName(p.nome || p.codigo_produto || '');
      const qty = Number(p.saldo_estoque ?? p.quantidade ?? 0) || 0;
      const val = Number((p as any).valor_unitario ?? 0) || 0;
      pecasTotalRaw += qty * val;
      pecaPriceMap.set(key, val);
    }

    const parseMoney = (v: any) => {
      if (v == null) return null;
      if (typeof v === 'number') return v;
      let s = String(v).trim();
      if (s === '') return null;
      s = s.replace(/\u00A0/g, '');
      if (s.indexOf(',') > -1 && s.indexOf('.') > -1) s = s.replace(/\./g, '').replace(/,/g, '.');
      else s = s.replace(/,/g, '.');
      s = s.replace(/[^0-9.-]/g, '');
      const n = parseFloat(s);
      return Number.isFinite(n) ? n : null;
    };

    // Sum suprimentos value using explicit `valor_total` when available across all suprimentos rows.
    // Sum suprimentos values and track overlap with pecas (to avoid double counting)
    let suprimentosTotal = 0;
    let overlapTotal = 0;
    const suprimentosItems = (suprimentosState && suprimentosState.length) ? suprimentosState : (suprimentosFromHook || []);
    for (const s of (suprimentosItems || [])) {
      const key = normalizeLookupName(s.nome || s.codigo_produto || '');
      const explicitTotal = parseMoney((s as any).valor_total);
      let supValue = 0;
      if (explicitTotal != null) {
        supValue = explicitTotal;
      } else {
        const qty = Number(s.saldo_estoque ?? s.quantidade ?? 0) || 0;
        const unit = parseMoney((s as any).valor_unitario) ?? parseMoney(pecaPriceMap.get(key)) ?? 0;
        const safeUnit = unit > 1e9 ? 0 : unit;
        supValue = qty * safeUnit;
      }
      suprimentosTotal += supValue;
      if (pecaPriceMap.has(key)) overlapTotal += supValue;
    }

    // Deduct suprimentos values that correspond to pecas from pecas total to avoid double counting
    let pecasTotal = pecasTotalRaw - overlapTotal;
    if (pecasTotal < 0) pecasTotal = 0;

    const totalValue = pecasTotal + suprimentosTotal;

    return (
      <div className={`grid grid-cols-1 md:grid-cols-4 gap-3 w-full`}> 
      <div className="p-2 rounded-2xl bg-gradient-to-br from-white/3 to-white/6 backdrop-blur border border-white/6 flex items-center gap-2">
        <div className="p-2 rounded-lg bg-[#0b3f1a]/80 text-[#22c55e] shadow">
          <CheckCircle size={20} />
        </div>
        <div>
          <div className="text-[11px] text-slate-300">Produtos (Peças)</div>
          <div className="text-xl font-extrabold">{metrics.totalPecas ?? (pecas || []).length}</div>
          <div className="text-[11px] text-slate-200">Com mínimo cadastrado: {metrics.totalWithMin ?? 0} • {metrics.healthyPercent}% saudável</div>
        </div>
      </div>

      <div className="p-2 rounded-2xl bg-gradient-to-br from-white/3 to-white/6 backdrop-blur border border-white/6 flex items-center gap-2">
        <div className="p-2 rounded-lg bg-[#533f03]/80 text-[#facc15] shadow">
          <AlertTriangle size={20} />
        </div>
        <div>
          <div className="text-[11px] text-slate-300">Produtos no Mínimo</div>
          <div className="text-xl font-extrabold">{metrics.atMin}</div>
        </div>
      </div>

      <div className={`p-2 rounded-2xl border border-white/6 flex items-center gap-2`} style={{ background: 'linear-gradient(90deg, rgba(255,255,255,0.04), rgba(255,0,0,0.02))' }}>
        <div className="p-2 rounded-lg bg-[#4a0b0b]/80 text-[#ef4444] shadow">
          <Slash size={20} />
        </div>
        <div>
          <div className="text-[11px] text-slate-300">Produtos Abaixo do Mínimo</div>
          <div className="text-xl font-extrabold text-[#ef4444]">{metrics.below} <span className="text-xs text-red-200 font-semibold">AÇÃO</span></div>
          <div className="text-[11px] text-slate-200">Itens críticos</div>
        </div>
      </div>

      <div className="p-2 rounded-2xl bg-gradient-to-br from-white/3 to-white/6 backdrop-blur border border-white/6 flex items-center gap-2 justify-between">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-[#0b1722]/80 text-[#60a5fa] shadow">
            <PackageIcon size={20} />
          </div>
          <div>
            <div className="text-[11px] text-slate-300">Valor Total</div>
            <div className="text-base font-extrabold">{totalValue > 0 ? totalValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : '—'}</div>
            <div className="text-[12px] text-slate-200">Valor Peças: {pecasTotal > 0 ? pecasTotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : '—'}</div>
            <div className="text-[12px] text-slate-200">Valor Suprimentos: {suprimentosTotal > 0 ? suprimentosTotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : '—'}</div>
          </div>
        </div>
      </div>
    </div>
  );
  };

  function ProductCard({ item }: { item: any }) {
    const estoqueAtual = Number(item.qty ?? item.saldo_estoque ?? item.quantidade ?? 0);
    const minimo = Number(item.min ?? item.estoque_minimo ?? 0);
    const isCritical = minimo > 0 && estoqueAtual < minimo;
    const isMinimum = minimo > 0 && estoqueAtual === minimo;

    const bgColor = isCritical
      ? 'bg-red-900/60 border-red-500 ring-2 ring-red-500/20'
      : isMinimum
      ? 'bg-yellow-900/40 border-yellow-400 ring-2 ring-yellow-400/20'
      : 'bg-green-900/40 border-green-400 ring-2 ring-green-400/20';

    const Icon = isCritical ? AlertTriangle : isMinimum ? AlertCircle : CheckCircle;
    const statusLabel = isCritical ? 'Crítico' : isMinimum ? 'No mínimo' : 'OK';

    return (
      <div className={`border ${bgColor} p-2 rounded-xl shadow-sm flex flex-col justify-between min-h-[96px]`}>
        <div className="flex items-start justify-between">
          <div className="text-sm font-medium tracking-wide text-white max-w-[75%] truncate">{item.nome}</div>
          <Icon className="text-white w-5 h-5" />
        </div>

        <div className="text-sm text-gray-300 mt-2">Código: {item.codigo ?? '—'}</div>
        <div className="flex justify-between mt-3 items-end text-white">
          <div>
            <div className="text-xs text-slate-200">Estoque Atual</div>
            <div className="font-semibold text-base">{fmt(estoqueAtual)}</div>
          </div>
          <div className="text-right">
            <div className="text-xs text-slate-200">Mínimo Cadastro</div>
            <div className="font-semibold text-base">{fmt(minimo)}</div>
          </div>
        </div>

        <div className="mt-3 font-bold text-center text-white text-sm">{statusLabel}</div>
      </div>
    );
  }

  // No auto-scroll for TV; grid layout will display items without vertical scroll

  // Use the shared `SuprimentosCard` component for consistency with the Suprimentos page

  return (
    <div className={`min-h-screen text-white ${tvMode ? 'text-2xl' : 'text-base md:text-lg lg:text-xl'} font-sans bg-[#071122]`}>
      <Header />

      <main className={`p-6 ${tvMode ? 'px-12 py-8' : ''}`}>
        {/* Sections carousel when TV mode active */}
        <div className="mb-6">
          <div className={`${tvMode ? 'flex items-start gap-6' : ''}`}>
            <SummaryCards />
          </div>
        </div>

        <div className={`space-y-6 ${tvMode ? 'h-[58vh]' : ''}`}>
          {/* Apenas Produtos em Alerta — ocupa toda a área */}
          <div className="w-full p-4 bg-transparent min-h-[60vh]">
            <div>
              <h2 className="text-lg font-bold mb-3">Produtos em Alerta</h2>
          
              <div>
                          <div className="grid grid-cols-5 gap-2 w-full mt-6 px-2">
                  {((alertItems || []) as any[]).slice().sort((a, b) => String(a.nome || '').localeCompare(String(b.nome || ''), 'pt-BR', { sensitivity: 'base' })).map((item: any) => (
                    <ProductCard key={item.id || `${item.codigo}-${item.nome}`} item={item} />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer removed as requested (no last-updated card or info button) */}
      </main>

      {/* removed pulsing animations for TV stability and readability */}
    </div>
  );
}
