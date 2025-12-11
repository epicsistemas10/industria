import React, { useEffect, useState } from 'react';
import { componenteTerceirizadoAPI } from '../../lib/api';
import ComponenteRetornoModal from '../../components/modals/ComponenteRetornoModal';

export default function TerceirizadosList({ equipamentoId }: { equipamentoId: string }) {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<any | null>(null);
  const [showReturnModal, setShowReturnModal] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const data = await componenteTerceirizadoAPI.listByEquipment(equipamentoId);
      setItems(data || []);
    } catch (e) {
      console.error('Erro ao carregar terceirizados', e);
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { if (equipamentoId) load(); }, [equipamentoId]);

  const handleMarkReturned = (item: any) => {
    setSelected(item);
    setShowReturnModal(true);
  };

  return (
    <div>
      {loading && <div className="text-gray-400">Carregando...</div>}
      {!loading && items.length === 0 && <div className="text-gray-300">Nenhum componente em terceirização para este equipamento.</div>}
      <div className="space-y-3">
        {items.map(i => (
          <div key={i.id} className="bg-gray-800 p-4 rounded flex items-center justify-between">
            <div>
              <div className="font-medium text-white">{i.componente_nome || i.componente_id}</div>
              <div className="text-sm text-gray-400">Status: {i.status} • Enviado: {i.data_envio ? new Date(i.data_envio).toLocaleDateString() : '-'}</div>
              {i.data_retorno && <div className="text-sm text-gray-400">Retorno: {new Date(i.data_retorno).toLocaleDateString()}</div>}
            </div>
            <div className="flex gap-2">
              {i.status !== 'retornou' && (
                <button onClick={() => handleMarkReturned(i)} className="px-3 py-2 rounded bg-green-600 text-white">Marcar como retornou</button>
              )}
            </div>
          </div>
        ))}
      </div>

      <ComponenteRetornoModal
        isOpen={showReturnModal}
        onClose={() => { setShowReturnModal(false); setSelected(null); }}
        record={selected}
        onUpdated={() => { setShowReturnModal(false); setSelected(null); load(); }}
      />
    </div>
  );
}
