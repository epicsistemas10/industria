import React, { useState } from 'react';
import Sidebar from '../../dashboard/components/Sidebar';
import TopBar from '../../dashboard/components/TopBar';
import useSidebar from '../../../hooks/useSidebar';
import useSuprimentos from '../../../hooks/useSuprimentos';
import { supabase } from '../../../lib/supabase';
import SuprimentosCard from '../../../components/SuprimentosCard';
import { useToast } from '../../../hooks/useToast';

export default function SuprimentosPage() {
  const { isOpen: sidebarOpen, toggle: toggleSidebar } = useSidebar();
  const { data: items, loading, fetch, create, update, remove, copyFromPeca, missingTable, copyAllFromPecas } = useSuprimentos();
  const [defaultsEnsured, setDefaultsEnsured] = useState(false);
  const [search, setSearch] = useState('');
  const [showOnlyLinked, setShowOnlyLinked] = useState(true);
  const [showAutoSynced, setShowAutoSynced] = useState(false);
  const { success, error: showError } = useToast();
  const [showReport, setShowReport] = useState(false);
  const [reportText, setReportText] = useState('');
  // debug removed
  // Filter items: default show only manual copies; optionally include auto_synced rows
  const filtered = (items || []).filter((i: any) => {
    if (!i) return false;
    if (showOnlyLinked) {
      const mf = i.meta && (i.meta.from_pecas ?? i.meta.fromPecas ?? i.meta.from_peca);
      const isFrom = mf === true || mf === 'true' || mf === 1 || mf === '1';
      if (!isFrom) return false;
    } else {
      const auto = i.meta && (i.meta.auto_synced ?? i.meta.autoSynced);
      if (!showAutoSynced && (auto === true || auto === 'true' || auto === 1 || auto === '1')) return false;
    }
    if (!search) return true;
    return (String(i.nome || i.produto || '')).toLowerCase().includes(search.toLowerCase());
  });
  const filteredCount = (filtered || []).length;
  const uniqueKeysCount = new Set((filtered || []).map((it: any) => normalizeLookupName(it.codigo_produto || it.nome || ''))).size;
  let representatives: any[] = [];
  // parse formatted numbers robustly (handles '29.272', '29,272', '29.272,50')
  const parseNumber = (v: any) => {
    if (v == null) return null;
    const s = String(v).trim();
    if (s === '') return null;
    const cleaned = s.replace(/\s/g, '');
    const hasComma = cleaned.indexOf(',') >= 0;
    const hasDot = cleaned.indexOf('.') >= 0;
    try {
      if (hasComma && !hasDot) {
        const after = cleaned.split(',')[1] || '';
        if (after.length === 3) return Number(cleaned.replace(/,/g, ''));
        return Number(cleaned.replace(/,/g, '.'));
      }
      if (hasDot && !hasComma) {
        const groups = cleaned.split('.');
        if (groups.length > 1 && groups[groups.length - 1].length === 3) return Number(cleaned.replace(/\./g, ''));
        return Number(cleaned);
      }
      if (hasDot && hasComma) {
        const lastComma = cleaned.lastIndexOf(',');
        const lastDot = cleaned.lastIndexOf('.');
        if (lastComma > lastDot) return Number(cleaned.replace(/\./g, '').replace(/,/g, '.'));
        return Number(cleaned.replace(/,/g, ''));
      }
      return Number(cleaned);
    } catch (e) {
      return Number(cleaned.replace(/[^0-9.-]/g, '')) || null;
    }
  };
  const getQty = (it: any) => parseNumber(it.saldo_estoque != null ? it.saldo_estoque : (it.quantidade != null ? it.quantidade : 0)) || 0;
  const PRODUCTION_PER_DAY = 1000; // used to convert fardos -> dias

  // helpers for name normalization (copied from importer to improve matching)
  function stripDiacritics(s: string) {
    try { return s.normalize('NFD').replace(/\p{Diacritic}/gu, ''); } catch (e) { return s; }
  }
  function normalizeLookupName(s: any) {
    if (s === null || s === undefined) return '';
    try {
      let t = String(s).trim();
      if (!t) return '';
      t = stripDiacritics(t);
      t = t.replace(/\u00A0/g, ' ');
      t = t.replace(/[()\[\]{}<>]/g, ' ');
      // remove common separators and punctuation
      t = t.replace(/[^\p{L}\p{N}% ]+/gu, ' ');
      t = t.replace(/\s+/g, ' ').trim().toUpperCase();

      // remove size tokens like 6x100, 8x105MT, 60 micras, 24KG, 50KG etc.
      t = t.replace(/\b\d+(?:[x×]\d+)(?:[A-Z]*)?\b/gu, '');
      t = t.replace(/\b\d+[.,]?\d*\s*(?:KG|G|GR|GRAM|M|MT|MM|MICRAS|MICRA|LT|L)\b/gu, '');
      t = t.replace(/\b\d+\s*(?:KG|G|GR|MT|M|MM|MICRAS)\b/gu, '');
      t = t.replace(/\b\d+[.,]?\d*\b/gu, '');

      // common noise tokens
      t = t.replace(/\bMICRAS\b/gu, '');
      t = t.replace(/\bM2\b/gu, '');

      // collapse extra spaces again
      t = t.replace(/\s+/g, ' ').trim();

      // canonicalize some product families to avoid duplicates
      if (t.includes('LONA') && t.includes('PRETA')) return 'LONA PLASTICA PRETA';
      if (t.includes('LONA') && (t.includes('TRANSPARENTE') || t.includes('TRANSP'))) return 'LONA PLASTICA TRANSPARENTE';
      if (t.includes('POLYCINTA') || t.includes('POLY')) return 'POLYCINTA';

      // ignore noisy items like 'ruido de freio'
      if (/\bRUI?DO(?: DE FREIO)?\b/i.test(t)) return '';

      return t;
    } catch (e) { return String(s).trim().toUpperCase(); }
  }

  // default product definitions (idempotent seed)
  const defaultProducts = [
    { nome: 'ARAME BENEFICADO 2.23', unidade_medida: 'KG', quantidade: 40928, meta: { kind: 'arame' } },
    { nome: 'BOBINA PAPEL KRAFT 50KG', unidade_medida: 'UN', quantidade: 41, meta: { kind: 'kraft', min_type: 'malas' } },
    { nome: 'LONA PLÁSTICA TRANSPARENTE 8x105MT 60 micras 53kg', unidade_medida: 'UN', quantidade: 46, meta: { kind: 'lona_transp' } },
    { nome: 'POLYCINTA 19MM ROLO 500MT', unidade_medida: 'UN', quantidade: 183, meta: { kind: 'polycinta' } },
    { nome: '095407 - FITA TENAX 2225CJ C 2040M - RL', codigo_produto: '095407', unidade_medida: 'UN', quantidade: 212, meta: { kind: 'fita' } },
    { nome: 'LONA PLÁSTICA PRETA 6x100 40 micras 24KG', unidade_medida: 'UN', quantidade: 198, meta: { kind: 'lona_preta' } },
  ];

  // compute groups & representatives after helper functions are defined
  try {
    const _groups = new Map<string, any[]>();
    for (const it of (filtered || [])) {
      const key = normalizeLookupName(it.codigo_produto || it.nome || '');
      if (!_groups.has(key)) _groups.set(key, []);
      _groups.get(key)!.push(it);
    }
    for (const [key, list] of _groups) {
      if (!list || list.length === 0) continue;
      list.sort((a: any, b: any) => {
        const aP = a.peca_id ? 1 : 0;
        const bP = b.peca_id ? 1 : 0;
        if (aP !== bP) return bP - aP;
        const aM = (a.estoque_minimo != null) ? 1 : 0;
        const bM = (b.estoque_minimo != null) ? 1 : 0;
        if (aM !== bM) return bM - aM;
        const aq = getQty(a);
        const bq = getQty(b);
        return bq - aq;
      });
      representatives.push(list[0]);
    }
  } catch (e) {
    // ignore grouping errors in dev; representatives stays empty
    console.warn('Grouping suprimentos failed', e);
  }

  const printReport = async () => {
    const now = new Date();

    // Resolve logo: prefer env, then localStorage, then try common filenames in Supabase storage buckets, then fallback
    let logoUrl: string | null = null;
    try {
      const envLogo = (import.meta as any).env?.VITE_COMPANY_LOGO_URL || null;
      if (envLogo) logoUrl = envLogo;
    } catch (e) {}
    try {
      if (!logoUrl && typeof window !== 'undefined') {
        const saved = localStorage.getItem('company_logo');
        if (saved) logoUrl = saved;
      }
    } catch (e) {}

    const tryFiles = async (bucket: string, names: string[]) => {
      for (const name of names) {
        try {
          const { data } = await supabase.storage.from(bucket).getPublicUrl(name as string);
          const url = (data && (data as any).publicUrl) || null;
          if (url) return url;
        } catch (e) {
          // ignore and try next
        }
      }
      return null;
    };

    if (!logoUrl) {
      const buckets = ['mapas', 'logos', 'public'];
      const names = ['company_logo.png', 'company_logo.jpg', 'logo.png', 'logo.jpg', 'mapa.jpg'];
      for (const b of buckets) {
        const found = await tryFiles(b, names);
        if (found) {
          logoUrl = found;
          break;
        }
      }
    }
    if (!logoUrl) logoUrl = '/favicon.svg';

    // build HTML with logo + IBA header and styled product cards
    // dedupe items for print as well (choose stable representative per product)
    const allRows = items || [];
    const groups = new Map<string, any[]>();
    for (const it of allRows) {
      const key = normalizeLookupName(it.codigo_produto || it.nome || '');
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(it);
    }
    const uniqueRows: any[] = [];
    for (const [key, list] of groups) {
      if (!list || list.length === 0) continue;
      list.sort((a: any, b: any) => {
        const aP = a.peca_id ? 1 : 0;
        const bP = b.peca_id ? 1 : 0;
        if (aP !== bP) return bP - aP;
        const aM = (a.estoque_minimo != null) ? 1 : 0;
        const bM = (b.estoque_minimo != null) ? 1 : 0;
        if (aM !== bM) return bM - aM;
        const aq = getQty(a);
        const bq = getQty(b);
        return bq - aq;
      });
      uniqueRows.push(list[0]);
    }

    const escape = (s: any) => (s == null ? '' : String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;'));

    const cardsHtml = uniqueRows.map((it) => {
      const nome = escape(it.nome || it.produto || '-');
      const qtd = getQty(it);
      const unidade = escape(it.unidade_medida || it.unidade || 'unidades');
      const minimo = (it.estoque_minimo != null && Number(it.estoque_minimo) > 0) ? escape(Number(it.estoque_minimo).toLocaleString('pt-BR')) : '-';
      const rawMinUnit = (it.meta && (it.meta.min_type || it.meta.min_unit)) || 'unidades';
      const minUnit = escape(rawMinUnit === 'days' ? 'dias' : rawMinUnit);
      // reuse same heuristic from buildReport for the 'atende' label
      const up = (it.nome || '').toUpperCase();
      // determine ALERTA for print
      const isArame = up.includes('ARAME');
      const isBobinaKraft = up.includes('PAPEL KRAFT') || up.includes('KRAFT');
      const isLonaTransp = up.includes('LONA PLÁSTICA TRANSPARENTE') || up.includes('TRANSPARENTE');
      const isPolycinta = up.includes('POLYCINTA') || up.includes('POLY');
      const isFita095407 = (it.codigo_produto || '') === '095407' || up.includes('TENAX');
      const isLonaPreta = up.includes('LONA PLÁSTICA PRETA') || up.includes('PRETA');
      const minRaw = (it.estoque_minimo != null) ? Number(it.estoque_minimo) : null;
      const rawMinUnitPdf = (it.meta && (it.meta.min_type || it.meta.min_unit)) || 'unidades';
      const minUnitPdf = rawMinUnitPdf === 'days' ? 'dias' : rawMinUnitPdf;
      let isAlertPdf = false;
      if (minRaw != null && minRaw > 0) {
        if (isArame || isFita095407) {
          const currentFardos = isArame ? ((qtd * 5) / 8) : (qtd * 150);
          isAlertPdf = (minUnitPdf === 'fardos') ? (currentFardos < minRaw) : (qtd < minRaw);
        } else if (isBobinaKraft) {
          const totalMalas = qtd * 300;
          isAlertPdf = (minUnitPdf === 'dias') ? ((totalMalas / 40) < minRaw) : (totalMalas < minRaw);
        } else if (isLonaTransp || isPolycinta || isLonaPreta) {
          isAlertPdf = qtd < minRaw;
        } else {
          isAlertPdf = qtd < minRaw;
        }
      }
      let atende = '';
      let diasOp: number | null = null;
      if (up.includes('ARAME')) {
        const totalFios = qtd * 5;
        const totalFardos = totalFios / 8;
        const rounded = Math.round(totalFardos);
        atende = `${rounded.toLocaleString('pt-BR')} fardos`;
        diasOp = totalFardos / PRODUCTION_PER_DAY;
      } else if (up.includes('PAPEL KRAFT')) {
        const totalMalas = qtd * 300;
        atende = `${totalMalas.toLocaleString('pt-BR')} malas`;
        diasOp = totalMalas / 40;
      } else if (up.includes('LONA PLÁSTICA TRANSPARENTE')) {
        const totalBlocos = qtd * 4;
        atende = `${totalBlocos.toLocaleString('pt-BR')} blocos`;
      } else if (up.includes('POLYCINTA')) {
        const totalBlocos = qtd * 10;
        atende = `${totalBlocos.toLocaleString('pt-BR')} blocos`;
      } else if ((it.codigo_produto || '') === '095407' || up.includes('TENAX')) {
        const totalFardos = qtd * 150;
        const rounded = Math.round(totalFardos);
        atende = `${rounded.toLocaleString('pt-BR')} fardos`;
        diasOp = totalFardos / PRODUCTION_PER_DAY;
      } else if (up.includes('LONA PLÁSTICA PRETA')) {
        const totalCarretas = qtd / 4;
        atende = `${Math.round(totalCarretas).toLocaleString('pt-BR')} carretas`;
      } else {
        atende = `${qtd.toLocaleString('pt-BR')} ${unidade}`;
      }
      return `
        <section class="card">
          <h2>${nome}</h2>
          ${isAlertPdf ? `<div class="meta" style="color:#b91c1c;font-weight:700">⚠️ ABAIXO DO MÍNIMO</div>` : ''}
          <div class="meta">Estoque atual: <strong>${qtd.toLocaleString('pt-BR')}</strong> ${unidade}</div>
          <div class="meta">Atende: <strong>${escape(atende)}</strong></div>
          ${diasOp != null ? `<div class="meta">Dias de operação: <strong>${Math.round(diasOp).toLocaleString('pt-BR')}</strong></div>` : ''}
          <div class="meta">Mínimo programado: <strong>${minimo}</strong> (${minUnit})</div>
        </section>`;
    }).join('\n');
    const html = `<!doctype html><html><head><meta charset="utf-8"><title>Controle de Suprimentos</title>
      <style>
        body{font-family:Arial,Helvetica,sans-serif;padding:20px;color:#111;background:#f6f7fb}
        .header{display:flex;flex-direction:column;align-items:center;margin-bottom:18px}
        .logo{height:72px}
        .brand{font-weight:700;font-size:18px;margin-top:8px}
        .title{font-size:14px;color:#111;margin-top:6px}
        .subtitle{color:#555;font-size:12px}
        .container{max-width:1100px;margin:0 auto}
        .cards-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:18px}
        .card{background:#fff;border:1px solid #e6e9ef;padding:14px;border-radius:8px;box-shadow:0 2px 6px rgba(15,23,42,0.06);margin-bottom:0;page-break-inside:avoid}
        .card h2{margin:0 0 8px 0;font-size:15px;padding-bottom:6px;border-bottom:2px solid #eef2f7}
        .meta{font-size:13px;color:#333;margin-top:6px}
        @media print{body{background:#fff} .card{page-break-inside:avoid}}
      </style>
    </head><body>
      <div class="container">
        <div class="header">
          <img src="${logoUrl}" onerror="this.style.display='none'" class="logo" />
          <div class="brand">IBA Santa Luzia</div>
          <div class="title">Controle de Suprimentos</div>
          <div class="subtitle">${now.toLocaleString()}</div>
        </div>
        <div class="cards-grid">${cardsHtml}</div>
      </div>
    </body></html>`;

    const w = window.open('', '_blank');
    if (!w) return alert('Não foi possível abrir a janela de impressão (bloqueador de popups?)');
    w.document.open();
    w.document.write(html);
    w.document.close();
    setTimeout(() => { w.print(); }, 300);
  };

  // Build a plain-text report (for copying to WhatsApp or clipboard)
  const buildReport = () => {
    try {
      const allRows = items || [];
      const groups = new Map<string, any[]>();
      for (const it of allRows) {
        const key = normalizeLookupName(it.codigo_produto || it.nome || '');
        if (!groups.has(key)) groups.set(key, []);
        groups.get(key)!.push(it);
      }
      const uniqueRows: any[] = [];
      for (const [key, list] of groups) {
        if (!list || list.length === 0) continue;
        list.sort((a: any, b: any) => {
          const aP = a.peca_id ? 1 : 0;
          const bP = b.peca_id ? 1 : 0;
          if (aP !== bP) return bP - aP;
          const aM = (a.estoque_minimo != null) ? 1 : 0;
          const bM = (b.estoque_minimo != null) ? 1 : 0;
          if (aM !== bM) return bM - aM;
          const aq = getQty(a);
          const bq = getQty(b);
          return bq - aq;
        });
        uniqueRows.push(list[0]);
      }
      // build text lines with alerts, mínimo and days of usage
      const lines: string[] = [];
      lines.push('Relatório de Suprimentos - ' + new Date().toLocaleString());
      lines.push('');
      for (const it of uniqueRows) {
        const nome = (it.nome || it.produto || '-').toString();
        const qtd = getQty(it);
        const unidade = it.unidade_medida || it.unidade || 'un';
        const minRaw = (it.estoque_minimo != null) ? Number(it.estoque_minimo) : null;
        const rawMinUnit = (it.meta && (it.meta.min_type || it.meta.min_unit)) || 'unidades';
        const minUnit = rawMinUnit === 'days' ? 'dias' : rawMinUnit;

        // heuristics for alert and days similar to printReport
        const up = nome.toUpperCase();
        const isArame = up.includes('ARAME');
        const isBobinaKraft = up.includes('PAPEL KRAFT') || up.includes('KRAFT');
        const isLonaTransp = up.includes('LONA PLÁSTICA TRANSPARENTE') || up.includes('TRANSPARENTE');
        const isPolycinta = up.includes('POLYCINTA') || up.includes('POLY');
        const isFita095407 = (it.codigo_produto || '') === '095407' || up.includes('TENAX');
        const isLonaPreta = up.includes('LONA PLÁSTICA PRETA') || up.includes('PRETA');

        let atende = '';
        let diasOp: number | null = null;
        if (isArame) {
          const totalFios = qtd * 5;
          const totalFardos = totalFios / 8;
          const rounded = Math.round(totalFardos);
          atende = `${rounded.toLocaleString('pt-BR')} fardos`;
          diasOp = totalFardos / PRODUCTION_PER_DAY;
        } else if (isBobinaKraft) {
          const totalMalas = qtd * 300;
          atende = `${totalMalas.toLocaleString('pt-BR')} malas`;
          diasOp = totalMalas / 40;
        } else if (isLonaTransp) {
          const totalBlocos = qtd * 4;
          atende = `${totalBlocos.toLocaleString('pt-BR')} blocos`;
        } else if (isPolycinta) {
          const totalBlocos = qtd * 10;
          atende = `${totalBlocos.toLocaleString('pt-BR')} blocos`;
        } else if (isFita095407) {
          const totalFardos = qtd * 150;
          const rounded = Math.round(totalFardos);
          atende = `${rounded.toLocaleString('pt-BR')} fardos`;
          diasOp = totalFardos / PRODUCTION_PER_DAY;
        } else if (isLonaPreta) {
          const totalCarretas = qtd / 4;
          atende = `${Math.round(totalCarretas).toLocaleString('pt-BR')} carretas`;
        } else {
          atende = `${qtd.toLocaleString('pt-BR')} ${unidade}`;
        }

        let isAlert = false;
        if (minRaw != null && minRaw > 0) {
          if (isArame || isFita095407) {
            const currentFardos = isArame ? ((qtd * 5) / 8) : (qtd * 150);
            isAlert = (minUnit === 'fardos') ? (currentFardos < minRaw) : (qtd < minRaw);
          } else if (isBobinaKraft) {
            const totalMalas = qtd * 300;
            isAlert = (minUnit === 'dias') ? ((totalMalas / 40) < minRaw) : (totalMalas < minRaw);
          } else if (isLonaTransp || isPolycinta || isLonaPreta) {
            isAlert = qtd < minRaw;
          } else {
            isAlert = qtd < minRaw;
          }
        }

        // Build a clearer block per product: name, then one info per line, blank line between products
        lines.push(nome);
        lines.push(`  Qtd: ${qtd.toLocaleString('pt-BR')} ${unidade}`);
        if (minRaw != null) lines.push(`  Mínimo: ${minRaw.toLocaleString('pt-BR')} (${minUnit})`);
        lines.push(`  Atende: ${atende}`);
        if (diasOp != null) lines.push(`  Dias: ${Math.round(diasOp).toLocaleString('pt-BR')}`);
        lines.push(`  Alerta: ${isAlert ? 'SIM' : '—'}`);
        lines.push('');
      }
      const text = lines.join('\n');
      setReportText(text);
      setShowReport(true);
    } catch (e) {
      console.error('Erro ao gerar relatório de texto', e);
      setReportText('Erro ao gerar relatório');
      setShowReport(true);
    }
  };

  // Refresh stock quantities by pulling from `pecas` table for matching peca_id or codigo_produto
  const refreshStock = async () => {
    try {
      success('Atualizando estoque...');
      if (!items || items.length === 0) {
        await fetch();
        return;
      }
      const ops: Promise<any>[] = [];
      for (const it of items) {
        let pecaPromise: Promise<any> | null = null;
        // try several matching strategies: peca_id, exact codigo_produto, codigo_fabricante, then ilike
        if (it.peca_id) {
          pecaPromise = supabase.from('pecas').select('id,nome,codigo_produto,saldo_estoque,quantidade').eq('id', it.peca_id).limit(1).maybeSingle();
        } else {
          // derive a candidate code from codigo_produto or from leading digits in nome
          const codeRaw = (it.codigo_produto || '').toString().trim();
          let codeCandidate = codeRaw;
          if (!codeCandidate && it.nome) {
            const m = String(it.nome).match(/^\s*([0-9]{3,})/);
            if (m) codeCandidate = m[1];
          }
          if (codeCandidate) {
            // try exact match on codigo_produto
            pecaPromise = supabase.from('pecas').select('id,nome,codigo_produto,saldo_estoque,quantidade').eq('codigo_produto', codeCandidate).limit(1).maybeSingle();
            // if not found, try codigo_fabricante
            pecaPromise = pecaPromise.then(async (res: any) => {
              const found = res && (res.data || res) ? (res.data || res) : null;
              if (found) return res;
              return supabase.from('pecas').select('id,nome,codigo_produto,saldo_estoque,quantidade').eq('codigo_fabricante', codeCandidate).limit(1).maybeSingle();
            });
            // fallback to ilike on codigo_produto
            pecaPromise = pecaPromise.then(async (res: any) => {
              const found = res && (res.data || res) ? (res.data || res) : null;
              if (found) return res;
              return supabase.from('pecas').select('id,nome,codigo_produto,saldo_estoque,quantidade').ilike('codigo_produto', `%${codeCandidate}%`).limit(1).maybeSingle();
            });
          } else if (it.nome) {
            // fallback: try matching by product name
            const nameQ = String(it.nome).slice(0, 60);
            // try both `nome` and `produto` columns (some schemas use `produto`)
            const orName = `nome.ilike.%${nameQ}%,produto.ilike.%${nameQ}%`;
            pecaPromise = supabase.from('pecas').select('id,nome,codigo_produto,saldo_estoque,quantidade').or(orName).limit(1).maybeSingle();
          }
        }
        if (!pecaPromise) continue;
        const op = pecaPromise.then(async (res: any) => {
          // normalize various supabase return shapes: { data } or raw row
          let peca = (res && (res.data ?? res)) || null;
          if (!peca) {
            console.info('[refreshStock] no match for suprimento', { suprimentoId: it.id, nome: it.nome, codigo: it.codigo_produto, raw: res });
            return null;
          }
          // normalize field names: prefer saldo_estoque, then saldo, then quantidade
          let rawSaldo = peca.saldo_estoque ?? peca.saldo ?? peca.quantidade ?? null;
          let newQty = (rawSaldo != null) ? parseNumber(rawSaldo) : null;

          // If we matched a row but it lacks expected saldo fields, try a fresh select for alternative columns
          if (newQty == null && peca && peca.id) {
            try {
              const fresh = await supabase.from('pecas').select('id,produto,nome,codigo_produto,saldo_estoque,saldo,quantidade').eq('id', peca.id).maybeSingle();
              const freshRow = (fresh && (fresh.data ?? fresh)) || null;
              if (freshRow) {
                // prefer freshest values
                rawSaldo = freshRow.saldo_estoque ?? freshRow.saldo ?? freshRow.quantidade ?? null;
                newQty = (rawSaldo != null) ? parseNumber(rawSaldo) : null;
                if (newQty != null) peca = freshRow;
              }
            } catch (e) {
              console.warn('[refreshStock] re-fetch pecas failed', { suprimentoId: it.id, pecasId: peca.id, error: e });
            }
          }

          // If still no numeric saldo, force zero (log clearly) so suprimentos reflects empty stock
          if (newQty == null) {
            console.info('[refreshStock] matched pecas row but saldo missing; forcing quantidade=0', { suprimentoId: it.id, pecasId: peca.id, pecasNome: (peca.nome || peca.produto), pecasCodigo: peca.codigo_produto, rawPeca: peca });
            newQty = 0;
          }
          console.info('[refreshStock] applying update', { suprimentoId: it.id, matchedPecaId: peca.id, matchedPecaNome: peca.nome, matchedCodigo: peca.codigo_produto, newQty });
          // Update only `quantidade` to avoid failing when `saldo_estoque` column is not present in the schema.
          const { error } = await supabase.from('suprimentos').update({ quantidade: newQty }).eq('id', it.id);
          if (error) {
            // If PostgREST reports missing column for saldo_estoque elsewhere, surface a clearer warning.
            if (error.code === 'PGRST204' && /saldo_estoque/.test(String(error.message || ''))) {
              console.warn('[refreshStock] suprimentos table schema missing `saldo_estoque` — updated `quantidade` only', { suprimentoId: it.id, error });
              return null;
            }
            throw error;
          }
          return true;
        }).catch((e) => { console.warn('refreshStock item failed', it.id, e); return null; });
        ops.push(op);
      }
      await Promise.all(ops);
      await fetch();
      success('Estoque atualizado');
    } catch (err) {
      console.error('Erro ao atualizar estoque:', err);
      showError('Erro ao atualizar estoque');
    }
  };

  if (missingTable) {
    return (
      <div className="min-h-screen bg-slate-900">
        <Sidebar isOpen={sidebarOpen} onToggle={toggleSidebar} darkMode />
        <div className={`${sidebarOpen ? 'ml-64' : 'ml-20'} transition-all`}> 
          <TopBar darkMode setDarkMode={() => {}} />
          <main className="p-6">
            <div className="rounded p-6 bg-yellow-800 text-yellow-50">
              <h2 className="text-xl font-bold">Tabela `suprimentos` não encontrada</h2>
              <p className="mt-2">A tabela <code>public.suprimentos</code> ainda não foi criada no seu projeto Supabase. Execute o arquivo <code>sql/00_create_suprimentos_table.sql</code> no SQL Editor do Supabase para criar a tabela.</p>
              <p className="mt-2">Instrução rápida: abra <strong>SQL Editor</strong> no painel do Supabase e cole o conteúdo de <code>sql/00_create_suprimentos_table.sql</code> (ou use o arquivo no repositório) e execute.</p>
              <div className="mt-4">
                <a className="px-4 py-2 bg-indigo-600 rounded text-white" href="https://app.supabase.com/">Abrir Supabase</a>
              </div>
            </div>
          </main>
        </div>
      </div>
    );
  }

  // creation form removed per UI simplification (we keep programmatic sync/create via hooks)

  return (
    <div className="min-h-screen bg-slate-900">
      <Sidebar isOpen={sidebarOpen} onToggle={toggleSidebar} darkMode />
      <div className={`${sidebarOpen ? 'ml-64' : 'ml-20'} transition-all`}> 
        <TopBar darkMode setDarkMode={() => {}} />
        <main className="p-6 text-white">
          {/* RAW items removed — main list shows only filtered items */}
            {/* debug removed — show only filtered items */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-white">Suprimentos</h1>
              <p className="text-gray-400">Gerencie o estoque de suprimentos e métricas de produção</p>
            </div>
            <div className="flex flex-col items-end gap-2">
              <div className="flex items-center gap-4">
                <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Pesquisar" className="px-3 py-2 rounded w-72" />
                {/* filtro por cópias e sincronizados removido da UI */}
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => refreshStock()} className="px-4 py-2 h-10 bg-blue-600 text-white rounded-lg text-sm whitespace-nowrap">Atualizar</button>
                <button onClick={async () => {
                  try {
                    const res = await copyAllFromPecas();
                    if (res && res.inserted) {
                      success(`Suprimentos sincronizados: ${res.inserted}`);
                    } else {
                      success('Nada novo para sincronizar.');
                    }
                  } catch (e) {
                    console.error('sync failed', e);
                    showError('Falha ao sincronizar suprimentos. Veja console.');
                  }
                }} className="px-4 py-2 h-10 bg-emerald-600 text-white rounded-lg text-sm whitespace-nowrap">Sincronizar de Peças</button>
                <button onClick={() => { buildReport(); }} className="px-4 py-2 h-10 bg-amber-600 text-white rounded-lg text-sm whitespace-nowrap">Relatório</button>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto bg-transparent rounded">
            <div className="mb-3 flex items-center justify-between">
              <div className="text-sm text-gray-300">Itens filtrados: <strong className="text-white">{filteredCount}</strong> — chaves únicas: <strong className="text-white">{uniqueKeysCount}</strong></div>
              <div className="flex items-center gap-2">
                <button onClick={() => { /* gerar relatório de todos os suprimentos */ printReport(); }} className="px-3 py-1 bg-gray-800 text-white rounded text-sm">Gerar relatório (todos)</button>
              </div>
            </div>
            <div className="mb-4">
              <table className="min-w-full text-sm bg-transparent">
                <thead className="bg-slate-800 text-gray-100">
                  <tr>
                    <th className="px-4 py-2 text-left">Código</th>
                    <th className="px-4 py-2 text-left">Nome</th>
                    <th className="px-4 py-2 text-right">Quantidade</th>
                    <th className="px-4 py-2 text-right">Estoque Mínimo</th>
                  </tr>
                </thead>
                <tbody>
                  {(filtered || []).map((it: any) => (
                    <tr key={it.id} className="odd:bg-slate-900 even:bg-slate-800">
                      <td className="px-4 py-2">{String(it.codigo_produto || it.codigo || '-')}</td>
                      <td className="px-4 py-2">{String(it.nome || it.produto || '-')}</td>
                      <td className="px-4 py-2 text-right">{getQty(it)}</td>
                      <td className="px-4 py-2 text-right">{it.estoque_minimo != null ? String(it.estoque_minimo) : '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          {showReport && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
              <div className="bg-white text-black rounded-lg w-11/12 md:w-2/3 p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-bold">Relatório de Suprimentos</h3>
                  <div className="flex items-center gap-2">
                    <button onClick={() => { navigator.clipboard.writeText(reportText).then(() => success('Copiado')) .catch(() => showError('Erro ao copiar')); }} className="px-3 py-1 bg-blue-600 text-white rounded text-sm">Copiar</button>
                    <button onClick={() => { printReport(); }} className="px-3 py-1 bg-gray-800 text-white rounded text-sm">Imprimir/PDF</button>
                    <button onClick={() => setShowReport(false)} className="px-3 py-1 bg-red-600 text-white rounded text-sm">Fechar</button>
                  </div>
                </div>
                <textarea readOnly value={reportText} className="w-full h-64 p-2 border rounded text-sm" />
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
