type Props = {
  nome: string
  foto?: string | null
  codigo?: string | null
  setor?: string | null
  onClick?: () => void
}

export default function CardEquipamento({ nome, foto, codigo, setor, onClick }: Props) {
  return (
    <div className="border rounded-lg shadow-sm overflow-hidden bg-white cursor-pointer" onClick={onClick}>
      <div className="h-40 bg-gray-100 flex items-center justify-center">
        {foto ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={foto} alt={nome} className="object-cover w-full h-full" />
        ) : (
          <div className="text-gray-400">Sem foto</div>
        )}
      </div>
      <div className="p-4">
        <div className="text-lg font-semibold">{nome}</div>
        <div className="text-sm text-gray-500">{codigo ?? '—'}</div>
        <div className="text-sm text-gray-500 mt-2">{setor ?? 'Sem setor'}</div>
      </div>
    </div>
  )
}
