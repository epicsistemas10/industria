import { useEffect, useState } from 'react';
import { mapaHotspotsAPI, grupoEquipamentosAPI } from '../lib/api';
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
      // load equipment-level hotspots (defensive)
      let equipmentHotspots: any[] = [];
      try {
        const data = await mapaHotspotsAPI.getAll();
        equipmentHotspots = (data || []).map((item: any) => ({
          id: item.id,
          equipamento_id: item.equipamento_id,
          x: Number(item.x) ?? 10,
          y: Number(item.y) ?? 10,
          width: Number(item.width) ?? 8,
          height: Number(item.height) ?? 8,
          color: item.color ?? '#10b981',
          fontSize: item.font_size ?? 14,
          icon: item.icon ?? 'ri-tools-fill',
        }));
      } catch (err) {
        console.error('[useMapaHotspots] failed to load equipment hotspots:', err);
        // keep equipmentHotspots empty and proceed to try loading groups
      }

      // load group-level hotspots and merge (defensive)
      let groupHotspots: any[] = [];
      try {
        const groups = await grupoEquipamentosAPI.getAll();
        groupHotspots = await Promise.all((groups || []).map(async (g: any) => {
          let members: string[] = [];
          try {
            members = await grupoEquipamentosAPI.getMembers(g.id).catch(() => []);
          } catch (e) {
            members = [];
          }
          return {
            id: `grp-${g.id}`,
            isGroup: true,
            group: g,
            members,
            x: Number(g.x) ?? 10,
            y: Number(g.y) ?? 10,
            width: Number(g.width) ?? 8,
            height: Number(g.height) ?? 8,
            color: g.color ?? '#10b981',
            fontSize: g.font_size ?? 14,
            icon: g.icon ?? 'ri-tools-fill',
          };
        }));
      } catch (err) {
        console.error('[useMapaHotspots] failed to load group hotspots:', err);
        groupHotspots = [];
      }

      // debug: log loaded hotspots if any
      try {
        // eslint-disable-next-line no-console
        console.log('[useMapaHotspots] loaded', { equipmentHotspots, groupHotspots });
      } catch (e) {}

      // If both loads failed (no data retrieved), do not clear existing hotspots
      const hasNewData = (groupHotspots && groupHotspots.length > 0) || (equipmentHotspots && equipmentHotspots.length > 0);
      if (hasNewData) {
        // set groups first so groups overlay members
        setHotspots([...groupHotspots, ...equipmentHotspots]);
      } else {
        // preserve current hotspots to avoid flashes when backend temporarily fails
        console.warn('[useMapaHotspots] no hotspot data retrieved — preserving existing hotspots');
      }
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
