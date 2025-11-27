import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'

export function usePecas(componenteId?: string) {
  const [data, setData] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetch = useCallback(async () => {
    setLoading(true)
    let q = supabase.from('pecas').select('*')
    if (componenteId) q = q.eq('componente_id', componenteId)
    const { data: rows, error } = await q
    if (error) setError(error.message)
    else setData(rows || [])
    setLoading(false)
  }, [componenteId])

  useEffect(() => { fetch() }, [fetch])

  const create = async (payload: any) => {
    const { data, error } = await supabase.from('pecas').insert(payload)
    if (error) throw error
    const row = (data && data[0]) || payload
    setData((d) => [row, ...d])
    return row
  }

  const update = async (id: string, payload: any) => {
    const { data, error } = await supabase.from('pecas').update(payload).eq('id', id)
    if (error) throw error
    const row = (data && data[0]) || payload
    setData((d) => d.map((x) => x.id === id ? row : x))
    return row
  }

  const remove = async (id: string) => {
    const { error } = await supabase.from('pecas').delete().eq('id', id)
    if (error) throw error
    setData((d) => d.filter((x) => x.id !== id))
  }

  return { data, loading, error, fetch, create, update, remove }
}
