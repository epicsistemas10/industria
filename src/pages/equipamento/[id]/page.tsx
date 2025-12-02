import React from 'react'
import { useParams } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { useEffect, useState } from 'react'
import CardComponente from '@/components/maintenance/CardComponente'
import { useComponentes } from '@/hooks/useComponentes'

export default function EquipamentoDetail() {
  const { id } = useParams()
  const [equip, setEquip] = useState<any | null>(null)
  const { data: componentes, loading } = useComponentes(id)

  useEffect(() => {
    if (!id) return
    supabase.from('equipamentos').select('*').eq('id', id).single().then(({ data }) => setEquip(data || null))
  }, [id])

  if (!id) return <div>Equipamento não especificado</div>

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold mb-4">{equip?.nome ?? 'Equipamento'}</h1>
      <div className="mb-6">
        <div className="flex gap-4">
          <div className="w-60 h-40 bg-gray-100">
            {equip?.foto ? <img src={equip.foto} alt={equip.nome} className="w-full h-full object-cover" /> : <div className="p-4">Sem foto</div>}
          </div>
          <div>
            <div><strong>Código:</strong> {equip?.codigo_interno}</div>
            <div><strong>Setor:</strong> {equip?.setor}</div>
            <div><strong>Status:</strong> {equip?.status}</div>
            <div className="mt-2 text-sm text-gray-600">{equip?.descricao}</div>
          </div>
        </div>
      </div>

      <h2 className="text-xl font-semibold mb-2">Componentes</h2>
      {loading && <div>Carregando componentes...</div>}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {componentes.map((c: any) => (
          <CardComponente key={c.id} nome={c.nome} foto={c.foto} posicao={c.posicao} />
        ))}
      </div>
    </div>
  )
}
