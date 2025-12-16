import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';

export function useSuprimentos() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [missingTable, setMissingTable] = useState(false);

  const fetch = useCallback(async () => {
    setLoading(true);
    try {
      const { data: rows, error } = await supabase.from('suprimentos').select('*').neq('is_archived', true).order('nome', { ascending: true });
      if (error) throw error;
      // normalize numeric fields to JS numbers to avoid UI inconsistencies
      const coerceNumber = (v: any) => {
        if (v == null) return null;
        if (typeof v === 'number') return v;
        const s = String(v).trim();
        if (s === '') return null;
        let t = s.replace(/\u00A0/g, '').replace(/\./g, '').replace(/,/g, '.');
        t = t.replace(/[^0-9.-]/g, '');
        const n = parseFloat(t);
        return Number.isFinite(n) ? n : null;
      };

      const normalized = (rows || []).map((r: any) => ({
        ...r,
        quantidade: coerceNumber(r.quantidade),
        estoque_minimo: coerceNumber(r.estoque_minimo),
        saldo_estoque: coerceNumber(r.saldo_estoque),
      }));

      // Do NOT auto-link suprimentos rows without `peca_id` — only show explicit user-added links.
      setMissingTable(false);
      setData(normalized || []);
      return normalized || [];
    } catch (err) {
      // Handle case where table does not exist in Supabase schema cache
      try {
        const code = err && (err.code || (err.error && err.error.code));
        const msg = err && (err.message || '');
        if (code === 'PGRST205' || /Could not find the table/i.test(msg) || /Could not find the relation/i.test(msg)) {
          console.warn('Tabela `suprimentos` não encontrada no banco (schema).');
          setMissingTable(true);
          setData([]);
          return;
        }
      } catch (e) {
        // ignore
      }
      console.error('Erro ao buscar suprimentos:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  // listen for global changes to suprimentos so multiple hook instances stay in sync
  useEffect(() => {
    const onChange = () => { fetch().catch((e) => console.warn('Failed refresh after suprimentos change', e)); };
    try {
      document.addEventListener('suprimentos:changed', onChange as EventListener);
    } catch (e) {
      // ignore if not available
    }
    return () => {
      try { document.removeEventListener('suprimentos:changed', onChange as EventListener); } catch (e) {}
    };
  }, [fetch]);

  const create = async (payload: any) => {
    const { data: d, error } = await supabase.from('suprimentos').insert(payload).select().single();
    if (error) throw error; 
    await fetch();
    return d;
  };

  const update = async (id: string, payload: any) => {
    // perform update and return the updated row; update local cache optimistically
    const { data: updated, error } = await supabase.from('suprimentos').update(payload).eq('id', id).select().single();
    if (error) throw error;
    // update local state immediately so UI reflects change without waiting for a full refetch
    setData((prev) => (prev || []).map((it) => (it.id === id ? updated : it)));
    // refresh in background to keep canonical state in sync (non-blocking)
    fetch().catch((e) => console.warn('Background refresh failed', e));
    try { document.dispatchEvent(new CustomEvent('suprimentos:changed', { detail: { id, action: 'update' } })); } catch (e) {}
    return updated;
  };

  const remove = async (id: string) => {
    const { error } = await supabase.from('suprimentos').delete().eq('id', id);
    if (error) throw error;
    await fetch();
    try { document.dispatchEvent(new CustomEvent('suprimentos:changed', { detail: { id, action: 'delete' } })); } catch (e) {}
  };

  const copyFromPeca = async (pecaId: string) => {
    // fetch peça
    const { data: peca, error: pErr } = await supabase.from('pecas').select('*').eq('id', pecaId).single();
    if (pErr) throw pErr;

    // helper: robust number parsing (handles '12,00', '1.234', '1.234,50')
    const parseNumber = (v: any) => {
      if (v == null) return null;
      if (typeof v === 'number') return v;
      let s = String(v).trim();
      if (s === '') return null;
      // remove non-breaking spaces
      s = s.replace(/\u00A0/g, '');
      // if contains comma as decimal separator and dot as thousand, normalize
      if (s.indexOf(',') > -1 && s.indexOf('.') > -1) s = s.replace(/\./g, '').replace(/,/g, '.');
      else s = s.replace(/,/g, '.');
      s = s.replace(/[^0-9.-]/g, '');
      const n = parseFloat(s);
      return Number.isFinite(n) ? n : null;
    };

    const payload = {
      peca_id: String(peca.id),
      nome: peca.nome || peca.produto || null,
      codigo_produto: peca.codigo_produto || peca.codigo_fabricante || null,
      unidade_medida: peca.unidade_medida || peca.unidade || null,
      quantidade: parseNumber(peca.saldo_estoque != null ? peca.saldo_estoque : (peca.quantidade != null ? peca.quantidade : 0)) || 0,
      estoque_minimo: parseNumber(peca.estoque_minimo != null ? peca.estoque_minimo : null),
      tipo: null,
      meta: null
    };

    // upsert: if exists by peca_id then update, else insert
    try {
      if (payload.peca_id) {
        const { data: existing, error: exErr } = await supabase.from('suprimentos').select('*').eq('peca_id', payload.peca_id).limit(10);
        if (exErr) throw exErr;
        if (Array.isArray(existing) && existing.length > 0) {
          // Prefer updating an existing manual copy if present.
          const existingFrom = existing.find((r: any) => r.meta && r.meta.from_pecas);
          if (existingFrom) {
            const id = existingFrom.id;
            await supabase.from('suprimentos').update({ ...payload, meta: { ...(payload.meta || {}), from_pecas: true } }).eq('id', id);
            await fetch();
            try { document.dispatchEvent(new CustomEvent('suprimentos:changed', { detail: { id, action: 'update' } })); } catch (e) {}
            return { updated: true };
          }
          // If only an auto_synced row exists, do NOT overwrite it; insert a separate manual row instead.
          const existingAuto = existing.find((r: any) => r.meta && r.meta.auto_synced);
          if (existingAuto) {
            const { data: ins, error: insErr } = await supabase.from('suprimentos').insert({ ...payload, meta: { ...(payload.meta || {}), from_pecas: true } }).select().single();
            if (insErr) throw insErr;
            await fetch();
            try { document.dispatchEvent(new CustomEvent('suprimentos:changed', { detail: { id: ins?.id, action: 'insert' } })); } catch (e) {}
            return { inserted: true, id: ins?.id };
          }
          // Otherwise update the first matching record (no special flags present)
          const id = existing[0].id;
          await supabase.from('suprimentos').update({ ...payload, meta: { ...(payload.meta || {}), from_pecas: true } }).eq('id', id);
          await fetch();
          try { document.dispatchEvent(new CustomEvent('suprimentos:changed', { detail: { id, action: 'update' } })); } catch (e) {}
          return { updated: true };
        }
      }

      try {
        const { data: ins, error: insErr } = await supabase.from('suprimentos').insert({ ...payload, meta: { ...(payload.meta || {}), from_pecas: true } }).select().single();
        if (insErr) throw insErr;
        await fetch();
        try { document.dispatchEvent(new CustomEvent('suprimentos:changed', { detail: { id: ins?.id, action: 'insert' } })); } catch (e) {}
        return { inserted: true, id: ins?.id };
      } catch (insertErr: any) {
        // Handle unique constraint race where another client inserted the same peca_id concurrently
        if (insertErr && (insertErr.code === '23505' || (insertErr.error && insertErr.error.code === '23505'))) {
          try {
            const { data: upd, error: updErr } = await supabase.from('suprimentos').update({ ...payload, meta: { ...(payload.meta || {}), from_pecas: true } }).eq('peca_id', payload.peca_id).select().limit(1).maybeSingle();
            if (updErr) throw updErr;
            await fetch();
            try { document.dispatchEvent(new CustomEvent('suprimentos:changed', { detail: { id: upd?.id, action: 'update' } })); } catch (e) {}
            return { updated: true };
          } catch (uErr) {
            console.error('Erro ao recuperar/atualizar suprimento após conflito de insert:', uErr);
            throw uErr;
          }
        }
        throw insertErr;
      }
    } catch (err) {
      console.error('Erro ao copiar peça para suprimentos:', err);
      throw err;
    }
  };

  const copyAllFromPecas = async () => {
    try {
      // fetch pecas that have estoque_minimo defined (>0)
      const { data: pecas, error: pErr } = await supabase.from('pecas').select('*').gt('estoque_minimo', 0).range(0, 19999);
      if (pErr) throw pErr;
      if (!Array.isArray(pecas) || pecas.length === 0) return { inserted: 0 };
      // fetch existing suprimentos to avoid duplicates
      const { data: existingSup, error: sErr } = await supabase.from('suprimentos').select('id,peca_id,codigo_produto,nome').neq('is_archived', true);
      if (sErr) throw sErr;
      // helper: normalize names similar to importer
      const normalizeName = (s: any) => {
        if (s === null || s === undefined) return '';
        try {
          let t = String(s).trim();
          t = t.normalize('NFD').replace(/\p{Diacritic}/gu, '');
          t = t.replace(/[^\p{L}\p{N} ]+/gu, ' ');
          t = t.replace(/\s+/g, ' ').trim().toUpperCase();
          return t;
        } catch (e) { return String(s).trim().toUpperCase(); }
      };

      const existingMap = new Map<string, boolean>();
      (existingSup || []).forEach((s: any) => {
        if (s.peca_id != null) existingMap.set(`peca:${String(s.peca_id)}`, true);
        if (s.codigo_produto) existingMap.set(`code:${String(s.codigo_produto)}`, true);
        if (s.nome) existingMap.set(`name:${normalizeName(s.nome)}`, true);
      });
      const parseNumber = (v: any) => {
        if (v == null) return 0;
        if (typeof v === 'number') return v;
        let s = String(v).trim();
        if (s === '') return 0;
        if (s.indexOf(',') > -1 && s.indexOf('.') > -1) s = s.replace(/\./g, '').replace(/,/g, '.');
        else s = s.replace(/,/g, '.');
        s = s.replace(/[^0-9.-]/g, '');
        const n = parseFloat(s);
        return Number.isFinite(n) ? n : 0;
      };

      const toInsert: any[] = [];
      for (const p of pecas) {
        const keyByPeca = p.id ? `peca:${String(p.id)}` : null;
        const keyByCode = p.codigo_produto ? `code:${String(p.codigo_produto)}` : null;
        const keyByName = p.nome ? `name:${normalizeName(p.nome)}` : null;
        if ((keyByPeca && existingMap.has(keyByPeca)) || (keyByCode && existingMap.has(keyByCode)) || (keyByName && existingMap.has(keyByName))) continue;
        toInsert.push({
          peca_id: p.id ? String(p.id) : null,
          nome: p.nome || p.produto || null,
          codigo_produto: p.codigo_produto || p.codigo_fabricante || null,
          unidade_medida: p.unidade_medida || p.unidade || null,
          quantidade: parseNumber(p.saldo_estoque != null ? p.saldo_estoque : (p.quantidade != null ? p.quantidade : 0)),
          estoque_minimo: parseNumber(p.estoque_minimo != null ? p.estoque_minimo : null) || null,
          meta: { ...(p.meta || {}), auto_synced: true },
        });
        // also mark keys to avoid duplicates inside this run (prevent same-name multiple inserts)
        if (keyByPeca) existingMap.set(keyByPeca, true);
        if (keyByCode) existingMap.set(keyByCode, true);
        if (keyByName) existingMap.set(keyByName, true);
      }
      if (toInsert.length === 0) return { inserted: 0 };
      const { data: ins, error: insErr } = await supabase.from('suprimentos').insert(toInsert);
      if (insErr) throw insErr;
      await fetch();
      return { inserted: Array.isArray(ins) ? ins.length : 1 };
    } catch (err) {
      console.error('Erro ao copiar todas pecas para suprimentos:', err);
      throw err;
    }
  };

  return { data, loading, fetch, create, update, remove, copyFromPeca, copyAllFromPecas, missingTable };
}

export default useSuprimentos;
