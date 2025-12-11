import { useEffect, useState } from 'react';
import { mapaHotspotsAPI, grupoEquipamentosAPI, servicosEquipamentosAPI, servicosEquipamentosBatchAPI } from '../lib/api';
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
        // enrich equipment hotspots with computed percent using a single batch query
        if (equipmentHotspots.length > 0) {
          const equipIds = Array.from(new Set(equipmentHotspots.map((eh: any) => String(eh.equipamento_id)).filter(Boolean)));
          try {
            const sums = await servicosEquipamentosBatchAPI.getCompletedPercentSums(equipIds);
            equipmentHotspots.forEach((eh: any) => {
              const val = Number(sums[String(eh.equipamento_id)] || 0);
              eh.percent = Number(val.toFixed(2));
              if (eh.percent >= 66) eh.color = eh.color || '#10b981';
              else if (eh.percent >= 33) eh.color = eh.color || '#f59e0b';
              else eh.color = eh.color || '#ef4444';
            });
          } catch (e) {
            equipmentHotspots.forEach((eh: any) => { eh.percent = 0; });
          }
        }
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
          // compute group percent as average of member equipment percents
          let groupPercent = 0;
          try {
            if (members && members.length > 0) {
              const sums = await Promise.all(members.map(async (mid: string) => {
                try { return await servicosEquipamentosAPI.getCompletedPercentSum(mid); } catch (e) { return 0; }
              }));
              const total = sums.reduce((a: number, b: number) => a + (Number(b) || 0), 0);
              groupPercent = Number((total / (sums.length || 1)).toFixed(2));
            }
          } catch (e) {
            groupPercent = 0;
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
            percent: groupPercent,
            // derive color from percent if group has no explicit color
            ...(g.color ? {} : (groupPercent >= 66 ? { color: '#10b981' } : (groupPercent >= 33 ? { color: '#f59e0b' } : { color: '#ef4444' })))
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
      // After both equipment and groups are loaded, compute group percents in batch as well
      try {
        const memberIds = Array.from(new Set((groupHotspots || []).flatMap((g: any) => (g.members || []))));
        if (memberIds.length > 0) {
          const memberSums = await servicosEquipamentosBatchAPI.getCompletedPercentSums(memberIds);
          groupHotspots.forEach((g: any) => {
            const members = (g.members || []).map((m: any) => String(m));
            const sums = members.map((mid: string) => Number(memberSums[mid] || 0));
            const total = sums.reduce((a: number, b: number) => a + (Number(b) || 0), 0);
            g.percent = members.length ? Number((total / members.length).toFixed(2)) : 0;
            if (!g.color) {
              if (g.percent >= 66) g.color = '#10b981';
              else if (g.percent >= 33) g.color = '#f59e0b';
              else g.color = '#ef4444';
            }
          });
        } else {
          groupHotspots.forEach((g: any) => { g.percent = 0; });
        }
      } catch (e) {
        groupHotspots.forEach((g: any) => { g.percent = 0; });
      }

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
