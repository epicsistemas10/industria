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
  const { data: items, loading, fetch, create, update, remove, copyFromPeca, missingTable } = useSuprimentos();
  const [defaultsEnsured, setDefaultsEnsured] = useState(false);
  const [search, setSearch] = useState('');
  const { success, error: showError } = useToast();
  const [showReport, setShowReport] = useState(false);
  const [reportText, setReportText] = useState('');

  const filtered = (items || []).filter((i: any) => !search || (i.nome || '').toLowerCase().includes(search.toLowerCase()));

  // default product definitions (idempotent seed)
  const defaultProducts = [
    { nome: 'ARAME BENEFICADO 2.23', unidade_medida: 'KG', quantidade: 40928, meta: { kind: 'arame' } },
    { nome: 'BOBINA PAPEL KRAFT 50KG', unidade_medida: 'UN', quantidade: 41, meta: { kind: 'kraft', min_type: 'malas' } },
    { nome: 'LONA PLÁSTICA TRANSPARENTE 8x105MT 60 micras 53kg', unidade_medida: 'UN', quantidade: 46, meta: { kind: 'lona_transp' } },
    { nome: 'POLYCINTA 19MM ROLO 500MT', unidade_medida: 'UN', quantidade: 183, meta: { kind: 'polycinta' } },
    { nome: '095407 - FITA TENAX 2225CJ C 2040M - RL', codigo_produto: '095407', unidade_medida: 'UN', quantidade: 212, meta: { kind: 'fita' } },
    { nome: 'LONA PLÁSTICA PRETA 6x100 40 micras 24KG', unidade_medida: 'UN', quantidade: 198, meta: { kind: 'lona_preta' } },
  ];

  // Ensure default products exist in the database (idempotent): create if not found by nome or codigo
  const ensureDefaults = async () => {
    if (missingTable || defaultsEnsured) return;
    try {
      // fetch latest items directly to avoid stale closure
      const { data: latest, error: lErr } = await supabase.from('suprimentos').select('id,nome,codigo_produto');
      if (lErr) {
        console.warn('Não foi possível buscar suprimentos existentes antes do seed:', lErr);
      }
      const existingNames = new Set((latest || []).map((it: any) => (it.nome || '').toLowerCase()));
      const existingCodes = new Set((latest || []).map((it: any) => (it.codigo_produto || '').toString()));
      for (const p of defaultProducts) {
        const nameKey = (p.nome || '').toLowerCase();
        const codeKey = (p.codigo_produto || '').toString();
        if (p.codigo_produto && existingCodes.has(codeKey)) continue;
        if (existingNames.has(nameKey)) continue;
        try {
          await create({ nome: p.nome, codigo_produto: p.codigo_produto || null, unidade_medida: p.unidade_medida || null, quantidade: p.quantidade || 0, estoque_minimo: p.estoque_minimo || null, meta: p.meta || null });
        } catch (err) {
          console.warn('Não foi possível criar default suprimento', p.nome, err);
        }
      }
    } finally {
      setDefaultsEnsured(true);
      await fetch();
    }
  };

  // run ensure once when items load
  React.useEffect(() => {
    if (!loading) ensureDefaults();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, missingTable]);

  const buildReport = () => {
    const rows = items || [];
    // dedupe
    const seen = new Set<string>();
    const unique: any[] = [];
    for (const it of rows) {
      const key = (it.codigo_produto || it.nome || '').toString().toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      unique.push(it);
    }

    const lines: string[] = [];
    const now = new Date();
    lines.push('*IBA Santa Luzia - Controle de Suprimentos*');
    lines.push(`Data: ${now.toLocaleString()}`);
    lines.push('');
    for (const it of unique) {
      const nome = it.nome || it.produto || '-';
      const qtd = Number(it.quantidade) || 0;
      const unidade = it.unidade_medida || it.unidade || 'unidades';
      // determine ALERTA using same heuristics as the card
      const upName = (nome || '').toUpperCase();
      const isArame = upName.includes('ARAME');
      const isBobinaKraft = upName.includes('PAPEL KRAFT') || upName.includes('KRAFT');
      const isLonaTransp = upName.includes('LONA PLÁSTICA TRANSPARENTE') || upName.includes('TRANSPARENTE');
      const isPolycinta = upName.includes('POLYCINTA') || upName.includes('POLY');
      const isFita095407 = (it.codigo_produto || '') === '095407' || upName.includes('TENAX');
      const isLonaPreta = upName.includes('LONA PLÁSTICA PRETA') || upName.includes('PRETA');
      const minRaw = (it.estoque_minimo != null) ? Number(it.estoque_minimo) : null;
      const rawMinUnit = (it.meta && (it.meta.min_type || it.meta.min_unit)) || 'unidades';
      const minUnit = rawMinUnit === 'days' ? 'dias' : rawMinUnit;
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
      let atende = '-';
      const up = (nome || '').toUpperCase();
      if (up.includes('ARAME')) {
        const totalFios = qtd * 5;
        const totalFardos = totalFios / 8;
        atende = `${Math.round(totalFardos).toLocaleString('pt-BR')} fardos`;
      } else if (up.includes('PAPEL KRAFT')) {
        const totalMalas = qtd * 300;
        atende = `${totalMalas.toLocaleString('pt-BR')} malas`;
      } else if (up.includes('LONA PLÁSTICA TRANSPARENTE')) {
        const totalBlocos = qtd * 4;
        atende = `${totalBlocos.toLocaleString('pt-BR')} blocos`;
      } else if (up.includes('POLYCINTA')) {
        const totalBlocos = qtd * 40;
        atende = `${totalBlocos.toLocaleString('pt-BR')} blocos`;
      } else if ((it.codigo_produto || '') === '095407' || up.includes('TENAX')) {
        const totalFardos = qtd * 150;
        atende = `${totalFardos.toLocaleString('pt-BR')} fardos`;
      } else if (up.includes('LONA PLÁSTICA PRETA')) {
        // Lona preta: conversion is division (units per carreta)
        const totalCarretas = qtd / 4;
        atende = `${Math.round(totalCarretas).toLocaleString('pt-BR')} carretas`;
      } else {
        atende = `${qtd.toLocaleString('pt-BR')} ${unidade}`;
      }

      const minimo = it.estoque_minimo != null ? Number(it.estoque_minimo).toLocaleString('pt-BR') : '-';

      // build a block per product with separators and WhatsApp-friendly bold (*)
      lines.push('----------------------------------------');
      if (isAlert) lines.push('⚠️ *ABAIXO DO MÍNIMO*');
      lines.push(`*${nome}*`);
      lines.push(`Estoque atual: *${qtd.toLocaleString('pt-BR')}* ${unidade}`);
      lines.push(`Atende: ${atende}`);
      if (isAlert) lines.push(`*Mínimo programado: ${minimo}* (${minUnit})`);
      else lines.push(`Mínimo programado: *${minimo}* (${minUnit})`);
      lines.push('');
    }

    lines.push('----------------------------------------');
    const text = lines.join('\n');
    setReportText(text);
    setShowReport(true);
  };

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
    // dedupe items for print as well (don't print duplicates)
    const allRows = items || [];
    const seenPdf = new Set<string>();
    const uniqueRows: any[] = [];
    for (const it of allRows) {
      const key = ((it.codigo_produto || it.nome) || '').toString().trim().toLowerCase();
      if (seenPdf.has(key)) continue;
      seenPdf.add(key);
      uniqueRows.push(it);
    }

    const escape = (s: any) => (s == null ? '' : String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;'));

    const cardsHtml = uniqueRows.map((it) => {
      const nome = escape(it.nome || it.produto || '-');
      const qtd = Number(it.quantidade) || 0;
      const unidade = escape(it.unidade_medida || it.unidade || 'unidades');
      const minimo = it.estoque_minimo != null ? escape(Number(it.estoque_minimo).toLocaleString('pt-BR')) : '-';
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
      if (up.includes('ARAME')) {
        const totalFios = qtd * 5;
        const totalFardos = totalFios / 8;
        atende = `${Math.round(totalFardos).toLocaleString('pt-BR')} fardos`;
      } else if (up.includes('PAPEL KRAFT')) {
        const totalMalas = qtd * 300;
        atende = `${totalMalas.toLocaleString('pt-BR')} malas`;
      } else if (up.includes('LONA PLÁSTICA TRANSPARENTE')) {
        const totalBlocos = qtd * 4;
        atende = `${totalBlocos.toLocaleString('pt-BR')} blocos`;
      } else if (up.includes('POLYCINTA')) {
        const totalBlocos = qtd * 40;
        atende = `${totalBlocos.toLocaleString('pt-BR')} blocos`;
      } else if ((it.codigo_produto || '') === '095407' || up.includes('TENAX')) {
        const totalFardos = qtd * 150;
        atende = `${totalFardos.toLocaleString('pt-BR')} fardos`;
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
          pecaPromise = supabase.from('pecas').select('id,saldo_estoque,quantidade').eq('id', it.peca_id).limit(1).maybeSingle();
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
            pecaPromise = supabase.from('pecas').select('id,saldo_estoque,quantidade').eq('codigo_produto', codeCandidate).limit(1).maybeSingle();
            // if not found, try codigo_fabricante
            pecaPromise = pecaPromise.then(async (res: any) => {
              const found = res && (res.data || res) ? (res.data || res) : null;
              if (found) return res;
              return supabase.from('pecas').select('id,saldo_estoque,quantidade').eq('codigo_fabricante', codeCandidate).limit(1).maybeSingle();
            });
            // fallback to ilike on codigo_produto
            pecaPromise = pecaPromise.then(async (res: any) => {
              const found = res && (res.data || res) ? (res.data || res) : null;
              if (found) return res;
              return supabase.from('pecas').select('id,saldo_estoque,quantidade').ilike('codigo_produto', `%${codeCandidate}%`).limit(1).maybeSingle();
            });
          } else if (it.nome) {
            // fallback: try matching by product name
            const nameQ = String(it.nome).slice(0, 60);
            pecaPromise = supabase.from('pecas').select('id,saldo_estoque,quantidade').ilike('produto', `%${nameQ}%`).limit(1).maybeSingle();
          }
        }
        if (!pecaPromise) continue;
        const op = pecaPromise.then(async (res: any) => {
          const peca = (res && (res.data || res)) || null;
          if (!peca) return null;
          const newQty = (peca.saldo_estoque != null) ? Number(peca.saldo_estoque) : (peca.quantidade != null ? Number(peca.quantidade) : null);
          if (newQty == null) return null;
          const { error } = await supabase.from('suprimentos').update({ quantidade: newQty }).eq('id', it.id);
          if (error) throw error;
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

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const form = e.target as any;
    const nome = form.nome.value?.trim();
    if (!nome) return showError('Nome obrigatório');
    try {
      await create({ nome, unidade_medida: form.unidade.value || null, quantidade: Number(form.quantidade.value) || 0, estoque_minimo: form.estoque_minimo.value ? Number(form.estoque_minimo.value) : null });
      success('Suprimento criado');
      form.reset();
    } catch (err) {
      console.error(err);
      showError('Erro ao criar suprimento');
    }
  };

  return (
    <div className="min-h-screen bg-slate-900">
      <Sidebar isOpen={sidebarOpen} onToggle={toggleSidebar} darkMode />
      <div className={`${sidebarOpen ? 'ml-64' : 'ml-20'} transition-all`}> 
        <TopBar darkMode setDarkMode={() => {}} />
        <main className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-white">Suprimentos</h1>
              <p className="text-gray-400">Gerencie o estoque de suprimentos e métricas de produção</p>
            </div>
            <div>
              <form onSubmit={handleCreate} className="flex items-center gap-2">
                <input name="nome" placeholder="Nome do item" className="px-3 py-2 rounded" />
                <input name="unidade" placeholder="Unidade" className="px-3 py-2 rounded w-28" />
                <input name="quantidade" type="number" placeholder="Qtd" className="px-3 py-2 rounded w-20" />
                <input name="estoque_minimo" type="number" placeholder="Mínimo" className="px-3 py-2 rounded w-24" />
                <button type="submit" className="px-4 py-2 bg-green-600 text-white rounded">Adicionar</button>
              </form>
            </div>
          </div>

          <div className="mb-4 flex items-center gap-2">
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Pesquisar" className="px-3 py-2 rounded w-96" />
            <button onClick={() => refreshStock()} className="px-3 py-2 bg-blue-600 text-white rounded">Atualizar</button>
            <button onClick={() => { buildReport(); }} className="px-3 py-2 bg-amber-600 text-white rounded">Relatório</button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {(() => {
              // compute duplicate counts by codigo_produto or nome (case-insensitive)
              const counts = new Map<string, number>();
              for (const it of filtered) {
                const key = ((it.codigo_produto || it.nome) || '').toString().trim().toLowerCase();
                counts.set(key, (counts.get(key) || 0) + 1);
              }
              const seen = new Set<string>();
              const elements: JSX.Element[] = [];
              for (const it of filtered) {
                const key = ((it.codigo_produto || it.nome) || '').toString().trim().toLowerCase();
                // skip subsequent duplicates entirely (do not render watermark)
                if (seen.has(key)) continue;
                seen.add(key);
                elements.push(<SuprimentosCard key={it.id} item={it} onUpdate={update} onDelete={remove} />);
              }
              return elements;
            })()}
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
