type Props = {
  nome: string
  foto?: string | null
  posicao?: string | null
  onClick?: () => void
}

export default function CardComponente({ nome, foto, posicao, onClick }: Props) {
  return (
    <div className="border rounded-lg shadow-sm overflow-hidden bg-white cursor-pointer" onClick={onClick}>
      <div className="h-28 bg-gray-50 flex items-center justify-center">
        {foto ? <img src={foto} alt={nome} className="object-cover w-full h-full" /> : <div className="text-gray-400">Sem foto</div>}
      </div>
      <div className="p-3">
        <div className="font-medium">{nome}</div>
        <div className="text-sm text-gray-500">{posicao ?? '—'}</div>
      </div>
    </div>
  )
}
