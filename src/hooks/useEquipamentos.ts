import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'

export function useEquipamentos() {
  const [data, setData] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchAll = useCallback(async () => {
    setLoading(true)
    const { data: rows, error } = await supabase.from('equipamentos').select('*')
    if (error) setError(error.message)
    else setData(rows || [])
    setLoading(false)
  }, [])

  useEffect(() => { fetchAll() }, [fetchAll])

  const create = async (payload: any) => {
    const { data, error } = await supabase.from('equipamentos').insert(payload)
    if (error) throw error
    const row = (data && data[0]) || payload
    setData((d) => [row, ...d])
    return row
  }

  const update = async (id: string, payload: any) => {
    const { data, error } = await supabase.from('equipamentos').update(payload).eq('id', id)
    if (error) throw error
    const row = (data && data[0]) || payload
    setData((d) => d.map((x) => x.id === id ? row : x))
    return row
  }

  const remove = async (id: string) => {
    const { error } = await supabase.from('equipamentos').delete().eq('id', id)
    if (error) throw error
    setData((d) => d.filter((x) => x.id !== id))
  }

  return { data, loading, error, fetchAll, create, update, remove }
}
