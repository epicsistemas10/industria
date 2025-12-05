import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'

export function usePecas(componenteId?: string) {
  const [data, setData] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetch = useCallback(async () => {
    setLoading(true)
    try {
      // fetch a large range to avoid PostgREST default 1000-row limit
      let q = supabase.from('pecas').select('*').range(0, 19999)
      if (componenteId) q = q.eq('componente_id', componenteId)
      const { data: rows, error } = await q
      if (error) {
        // If the table doesn't exist on the database, PostgREST returns 404.
        // Suppress that specific error to avoid noisy console logs and return an empty list.
        const msg = (error && (error.message || '')).toString();
        if ((error as any).status === 404 || /not found/i.test(msg)) {
          console.warn('usePecas: tabela `pecas` não encontrada no banco (404). Retornando lista vazia.')
          setData([])
          setError(null)
        } else {
          setError(error.message)
        }
      } else {
        setData(rows || [])
      }
    } catch (e: any) {
      console.error('usePecas: erro ao buscar pecas:', e)
      setData([])
      setError(e?.message || String(e))
    } finally {
      setLoading(false)
    }
  }, [componenteId])

  useEffect(() => { fetch() }, [fetch])

  const create = async (payload: any) => {
    const { data, error } = await supabase.from('pecas').insert(payload)
    if (error) {
      // Provide a clearer message if table is missing
      if ((error as any).status === 404) throw new Error('Tabela `pecas` não encontrada no banco. Execute o script SQL em sql/2025-11-25_schema_equip_comp_pecas.sql no Supabase.')
      throw error
    }
    const row = (data && data[0]) || payload
    setData((d) => [row, ...d])
    return row
  }

  const update = async (id: string, payload: any) => {
    const { data, error } = await supabase.from('pecas').update(payload).eq('id', id)
    if (error) {
      if ((error as any).status === 404) throw new Error('Tabela `pecas` não encontrada no banco. Execute o script SQL em sql/2025-11-25_schema_equip_comp_pecas.sql no Supabase.')
      throw error
    }
    const row = (data && data[0]) || payload
    setData((d) => d.map((x) => x.id === id ? row : x))
    return row
  }

  const remove = async (id: string) => {
    const { error } = await supabase.from('pecas').delete().eq('id', id)
    if (error) {
      if ((error as any).status === 404) throw new Error('Tabela `pecas` não encontrada no banco. Execute o script SQL em sql/2025-11-25_schema_equip_comp_pecas.sql no Supabase.')
      throw error
    }
    setData((d) => d.filter((x) => x.id !== id))
  }

  return { data, loading, error, fetch, create, update, remove }
}
