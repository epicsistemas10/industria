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
      setData(rows || []);
      return rows || [];
      setMissingTable(false);
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
    return updated;
  };

  const remove = async (id: string) => {
    const { error } = await supabase.from('suprimentos').delete().eq('id', id);
    if (error) throw error;
    await fetch();
  };

  const copyFromPeca = async (pecaId: string) => {
    // fetch peça
    const { data: peca, error: pErr } = await supabase.from('pecas').select('*').eq('id', pecaId).single();
    if (pErr) throw pErr;

    const payload = {
      peca_id: String(peca.id),
      nome: peca.nome || peca.produto || null,
      codigo_produto: peca.codigo_produto || peca.codigo_fabricante || null,
      unidade_medida: peca.unidade_medida || peca.unidade || null,
      quantidade: peca.saldo_estoque != null ? Number(peca.saldo_estoque) : (peca.quantidade != null ? Number(peca.quantidade) : null),
      estoque_minimo: peca.estoque_minimo != null ? Number(peca.estoque_minimo) : null,
      tipo: null,
      meta: null
    };

    // upsert: if exists by peca_id then update, else insert
    try {
      if (payload.peca_id) {
        const { data: existing, error: exErr } = await supabase.from('suprimentos').select('id').eq('peca_id', payload.peca_id).limit(1);
        if (exErr) throw exErr;
        if (Array.isArray(existing) && existing.length > 0) {
          const id = existing[0].id;
          await supabase.from('suprimentos').update(payload).eq('id', id);
          await fetch();
          try { document.dispatchEvent(new CustomEvent('suprimentos:changed', { detail: { id, action: 'update' } })); } catch (e) {}
          return { updated: true };
        }
      }

      const { data: ins, error: insErr } = await supabase.from('suprimentos').insert(payload).select().single();
      if (insErr) throw insErr;
      await fetch();
      try { document.dispatchEvent(new CustomEvent('suprimentos:changed', { detail: { id: ins?.id, action: 'insert' } })); } catch (e) {}
      return { inserted: true, id: ins?.id };
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
          quantidade: p.saldo_estoque != null ? Number(p.saldo_estoque) : (p.quantidade != null ? Number(p.quantidade) : 0),
          estoque_minimo: p.estoque_minimo != null ? Number(p.estoque_minimo) : null,
          meta: p.meta || null,
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
