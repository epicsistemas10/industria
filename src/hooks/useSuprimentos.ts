import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';

export function useSuprimentos() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [missingTable, setMissingTable] = useState(false);

  const fetch = useCallback(async () => {
    setLoading(true);
    try {
      const { data: rows, error } = await supabase.from('suprimentos').select('*').order('nome', { ascending: true });
      if (error) throw error;
      setData(rows || []);
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
          return { updated: true };
        }
      }

      await supabase.from('suprimentos').insert(payload);
      await fetch();
      return { inserted: true };
    } catch (err) {
      console.error('Erro ao copiar peça para suprimentos:', err);
      throw err;
    }
  };

  return { data, loading, fetch, create, update, remove, copyFromPeca, missingTable };
}

export default useSuprimentos;
