import React from 'react'
import { useParams } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { useEffect, useState } from 'react'
import CardPeca from '@/components/maintenance/CardPeca'
import { usePecas } from '@/hooks/usePecas'

export default function ComponenteDetail() {
  const { id } = useParams()
  const [comp, setComp] = useState<any | null>(null)
  const { data: pecas, loading } = usePecas(id)

  useEffect(() => {
    if (!id) return
    supabase.from('componentes').select('*').eq('id', id).single().then(({ data }) => setComp(data || null))
  }, [id])

  if (!id) return <div>Componente não especificado</div>

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold mb-4">{comp?.nome ?? 'Componente'}</h1>
      <div className="mb-6">
        <div className="flex gap-4">
          <div className="w-48 h-32 bg-gray-100">
            {comp?.foto ? <img src={comp.foto} alt={comp.nome} className="w-full h-full object-cover" /> : <div className="p-4">Sem foto</div>}
          </div>
          <div>
            <div><strong>Posição:</strong> {comp?.posicao}</div>
            <div className="mt-2 text-sm text-gray-600">{comp?.descricao}</div>
          </div>
        </div>
      </div>

      <h2 className="text-xl font-semibold mb-2">Peças</h2>
      {loading && <div>Carregando peças...</div>}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {pecas.map((p: any) => (
          <CardPeca key={p.id} nome={p.nome} codigo={p.codigo_fabricante} vida_util={p.vida_util_hours} custo={p.custo_medio} foto={p.foto} />
        ))}
      </div>
    </div>
  )
}
