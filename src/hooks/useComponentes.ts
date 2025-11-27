import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'

export function useComponentes(equipamentoId?: string) {
  const [data, setData] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetch = useCallback(async () => {
    setLoading(true)
    let q = supabase.from('componentes').select('*')
    if (equipamentoId) q = q.eq('equipamento_id', equipamentoId)
    const { data: rows, error } = await q
    if (error) setError(error.message)
    else setData(rows || [])
    setLoading(false)
  }, [equipamentoId])

  useEffect(() => { fetch() }, [fetch])

  const create = async (payload: any) => {
    const { data, error } = await supabase.from('componentes').insert(payload)
    if (error) throw error
    const row = (data && data[0]) || payload
    setData((d) => [row, ...d])
    return row
  }

  const update = async (id: string, payload: any) => {
    const { data, error } = await supabase.from('componentes').update(payload).eq('id', id)
    if (error) throw error
    const row = (data && data[0]) || payload
    setData((d) => d.map((x) => x.id === id ? row : x))
    return row
  }

  const remove = async (id: string) => {
    const { error } = await supabase.from('componentes').delete().eq('id', id)
    if (error) throw error
    setData((d) => d.filter((x) => x.id !== id))
  }

  return { data, loading, error, fetch, create, update, remove }
}
