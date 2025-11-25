import React from 'react'
import { useParams } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { useEffect, useState } from 'react'
import CardPeca from '@/components/maintenance/CardPeca'
import { usePecas } from '@/hooks/usePecas'
import PecaModal from '@/components/modals/PecaModal'

export default function ComponenteDetail() {
  const { id } = useParams()
  const [comp, setComp] = useState<any | null>(null)
  const { data: pecas, loading, fetch, create, update, remove } = usePecas(id)
  const [showPecaModal, setShowPecaModal] = useState(false)
  const [selectedPecaId, setSelectedPecaId] = useState<string | undefined>()

  useEffect(() => {
    if (!id) return
    supabase.from('componentes').select('*').eq('id', id).single().then(({ data }) => setComp(data || null))
  }, [id])

  if (!id) return <div>Componente não especificado</div>

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-semibold">{comp?.nome ?? 'Componente'}</h1>
        <div>
          <button onClick={() => { setSelectedPecaId(undefined); setShowPecaModal(true); }} className="px-4 py-2 bg-indigo-600 text-white rounded-lg">Nova Peça</button>
        </div>
      </div>
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
          <div key={p.id} className="relative">
            <CardPeca
              nome={p.nome}
              codigo={p.codigo_fabricante}
              vida_util={p.vida_util_hours}
              custo={p.custo_medio}
              foto={p.foto}
              onClick={() => { setSelectedPecaId(p.id); setShowPecaModal(true); }}
            />
            <div className="absolute top-2 right-2 flex gap-2">
              <button onClick={(e) => { e.stopPropagation(); setSelectedPecaId(p.id); setShowPecaModal(true); }} className="w-8 h-8 bg-blue-600 text-white rounded flex items-center justify-center">
                <i className="ri-edit-line"></i>
              </button>
              <button onClick={async (e) => { e.stopPropagation(); if (!confirm('Remover peça?')) return; try { await remove(p.id); await fetch(); } catch (err) { console.error(err); alert('Erro ao remover peça'); } }} className="w-8 h-8 bg-red-600 text-white rounded flex items-center justify-center">
                <i className="ri-delete-bin-line"></i>
              </button>
            </div>
          </div>
        ))}
      </div>

      <PecaModal isOpen={showPecaModal} onClose={() => setShowPecaModal(false)} onSuccess={async () => { await fetch(); setShowPecaModal(false); }} pecaId={selectedPecaId} />
    </div>
  )
}
