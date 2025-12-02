import React from 'react'

type Props = {
  nome: string
  codigo?: string | null
  vida_util?: number | null
  custo?: number | null
  foto?: string | null
  onClick?: () => void
}

export default function CardPeca({ nome, codigo, vida_util, custo, foto, onClick }: Props) {
  return (
    <div className="border rounded-lg overflow-hidden bg-white cursor-pointer" onClick={onClick}>
      <div className="h-24 bg-gray-50 flex items-center justify-center">
        {foto ? <img src={foto} alt={nome} className="object-cover w-full h-full" /> : <div className="text-gray-400">Sem foto</div>}
      </div>
      <div className="p-3">
        <div className="font-medium">{nome}</div>
        <div className="text-sm text-gray-500">{codigo ?? '—'}</div>
        <div className="text-sm text-gray-500">Vida útil: {vida_util ?? '—'}h</div>
        <div className="text-sm text-gray-500">Custo: {custo ?? '—'}</div>
      </div>
    </div>
  )
}
