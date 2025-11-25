import { useEffect, useState } from 'react';
import { mapaHotspotsAPI } from '../lib/api';
import { useToast } from './useToast';

export interface HotspotItem {
  id: string;
  equipamento_id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  color?: string;
  fontSize?: number;
  icon?: string;
}

export function useMapaHotspots() {
  const [hotspots, setHotspots] = useState<HotspotItem[]>([]);
  const [loading, setLoading] = useState(false);
  const toast = useToast();

  const load = async () => {
    try {
      setLoading(true);
      const data = await mapaHotspotsAPI.getAll();
      const mapped = (data || []).map((item: any) => ({
        id: item.id,
        equipamento_id: item.equipamento_id,
        x: item.x ?? 10,
        y: item.y ?? 10,
        width: item.width ?? 8,
        height: item.height ?? 8,
        color: item.color ?? '#10b981',
        fontSize: item.font_size ?? 14,
        icon: item.icon ?? 'ri-tools-fill',
      }));
      setHotspots(mapped);
    } catch (err: any) {
      console.error('Erro ao carregar hotspots via hook:', err);
      toast.error('Erro ao carregar hotspots');
      setHotspots([]);
    } finally {
      setLoading(false);
    }
  };

  const createHotspot = async (payload: Partial<HotspotItem>) => {
    try {
      const created = await mapaHotspotsAPI.create(payload);
      toast.success('Hotspot criado');
      await load();
      return created;
    } catch (err: any) {
      console.error('Erro ao criar hotspot:', err);
      toast.error('Erro ao criar hotspot');
      throw err;
    }
  };

  const updateHotspot = async (id: string, payload: Partial<HotspotItem>) => {
    try {
      const updated = await mapaHotspotsAPI.update(id, payload);
      toast.success('Hotspot atualizado');
      await load();
      return updated;
    } catch (err: any) {
      console.error('Erro ao atualizar hotspot:', err);
      toast.error('Erro ao atualizar hotspot');
      throw err;
    }
  };

  const deleteHotspot = async (id: string) => {
    try {
      await mapaHotspotsAPI.delete(id);
      toast.success('Hotspot removido');
      await load();
      return true;
    } catch (err: any) {
      console.error('Erro ao deletar hotspot:', err);
      toast.error('Erro ao remover hotspot');
      throw err;
    }
  };

  useEffect(() => {
    load();
  }, []);

  return { hotspots, loading, load, createHotspot, updateHotspot, deleteHotspot };
}

export default useMapaHotspots;
