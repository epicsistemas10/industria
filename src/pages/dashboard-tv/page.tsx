import React, { useEffect, useRef, useState } from 'react';
import useMapaHotspots from '../../hooks/useMapaHotspots';

type Equipment = { id: string; nome?: string; progresso?: number; setor?: string; imagem_url?: string; codigo_interno?: string };
type Hotspot = { id: string; equipamento_id?: string; x: number; y: number; width: number; height: number; color?: string; fontSize?: number; icon?: string };

export default function DashboardTVPage(): JSX.Element {
  // TV dashboard with hotspots (percentual), reduced sidebars and auto-rotate (40s)
  const [mapImage, setMapImage] = useState<string>('');
  const [equipments, setEquipments] = useState<Equipment[]>([]);
  const [hotspots, setHotspots] = useState<Hotspot[]>([]);
  const [tvView, setTvView] = useState<'map' | 'plan'>('map');
  const [currentTime, setCurrentTime] = useState(new Date());

  const imageRefTV = useRef<HTMLImageElement | null>(null);
  const overlayRefTV = useRef<HTMLDivElement | null>(null);
  const footerRef = useRef<HTMLDivElement | null>(null);
  const [imgRectTV, setImgRectTV] = useState<DOMRect | null>(null);
  const [overlayRectTV, setOverlayRectTV] = useState<DOMRect | null>(null);

  // hook that loads equipment and group hotspots
  const mapa = useMapaHotspots();

  const recomputeImgRectTV = () => {
    try {
      const imgR = imageRefTV.current ? imageRefTV.current.getBoundingClientRect() : null;
      const overR = overlayRefTV.current ? overlayRefTV.current.getBoundingClientRect() : null;
      if (imgR) setImgRectTV(imgR);
      if (overR) setOverlayRectTV(overR);
      if (imgR || overR) console.debug('[TV] recomputeImgRectTV', { imgRect: imgR, overlayRect: overR });
    } catch (e) {}
  };

  // Reconcile small pixel drift for TV: align DOM elements to expected centers calculated
  // from percentage coordinates and the current image rect. This mirrors the logic
  // used in the main `mapa` page and helps keep hotspots visually stable after
  // fullscreen or layout changes.
  const reconcileHotspotsTV = () => {
    try {
      const imgR = (imageRefTV.current ? imageRefTV.current.getBoundingClientRect() : null) || imgRectTV;
      const overlayR = (overlayRefTV.current ? overlayRefTV.current.getBoundingClientRect() : null) || overlayRectTV;
      if (!imgR || !overlayR) return;

      hotspots.forEach((h: any) => {
        try {
          const el = document.querySelector(`[data-hotspot-id="${h.id}"]`) as HTMLElement | null;
          if (!el) return;
          const r = el.getBoundingClientRect();
          const expectedCenterX = imgR.left + (Number(h.x) / 100) * imgR.width;
          const expectedCenterY = imgR.top + (Number(h.y) / 100) * imgR.height;
          const actualCenterX = r.left + r.width / 2;
          const actualCenterY = r.top + r.height / 2;
          const deltaX = Math.round(expectedCenterX - actualCenterX);
          const deltaY = Math.round(expectedCenterY - actualCenterY);

          if (Math.abs(deltaX) > 2 || Math.abs(deltaY) > 2) {
            el.style.transform = `translate(calc(-50% + ${deltaX}px), calc(-50% + ${deltaY}px))`;
            el.dataset.reconciled = '1';
          } else {
            if (el.dataset.reconciled) {
              el.style.transform = 'translate(-50%, -50%)';
              delete el.dataset.reconciled;
            }
          }
        } catch (e) {
          // ignore per-hotspot errors
        }
      });
    } catch (e) {
      // ignore
    }
  };

  // responsive grid columns: use JS to choose layout so we can target TVs and small screens
  // keep responsive behavior: stack on small screens, row on larger

  const getProgressColor = (prog = 0) => {
    if (prog >= 100) return '#10b981';
    if (prog === 0) return '#3b82f6';
    if (prog > 0 && prog <= 50) return '#f59e0b';
    if (prog > 50 && prog < 100) return '#f97316';
    return '#6b7280';
  };

  const formatLinhaLabel = (setor?: string) => {
    if (!setor) return 'Sem Setor';
    const s = String(setor).trim();
    if (/^linha\s*/i.test(s)) return s;
    if (/^\d+$/.test(s)) return `Linha ${s}`;
    return s;
  };

  // Simple inline component to fetch open orders when planning view is active
  const OpenOrdersList = () => {
    const [orders, setOrders] = useState<any[]>([]);
    useEffect(() => {
      let mounted = true;
      (async () => {
        try {
          const mod = await import('../../lib/supabase');
          const supabase = (mod as any).supabase;
          if (!supabase) return;
          const { data } = await supabase.from('ordens_servico').select('id,titulo,equipamento_id,status').order('created_at', { ascending: false }).limit(10);
          if (mounted && data) setOrders(data as any[]);
        } catch (e) {
          // ignore
        }
      })();
      return () => { mounted = false; };
    }, []);

    if (!orders || orders.length === 0) return <div className="text-sm text-gray-400">Nenhuma OS aberta</div>;

    return (
      <div className="space-y-2">
        {orders.map(o => (
          <div key={o.id} className="flex flex-col bg-white/3 p-2 rounded text-sm">
            <div className="font-medium text-white truncate">{o.titulo || 'OS sem título'}</div>
            <div className="text-xs text-gray-300 mt-1">{o.status || ''}</div>
          </div>
        ))}
      </div>
    );
  };

  useEffect(() => {
    // load cached map image (legacy localStorage)
    try {
      const savedMap = typeof window !== 'undefined' ? localStorage.getItem('map_image') : null;
      if (savedMap) {
        setMapImage(savedMap);
      }
    } catch (e) {
      // ignore
    }

    // hotspots saved as JSON in localStorage under 'hotspots' (initial fallback)
      try {
        const saved = typeof window !== 'undefined' ? localStorage.getItem('hotspots') : null;
        if (saved) {
          const parsed = JSON.parse(saved) as Hotspot[];
          setHotspots(parsed || []);
        }
      } catch (e) {
        console.warn('Não foi possível ler hotspots do localStorage', e);
      }

    

    // equipments fallback from localStorage
    try {
      const eqSaved = typeof window !== 'undefined' ? localStorage.getItem('equipments') : null;
      if (eqSaved) setEquipments(JSON.parse(eqSaved) as Equipment[]);
    } catch (e) {
      console.warn('Falha ao ler equipments do localStorage', e);
    }

    // Try to fetch from Supabase if lib is available (best-effort, do not fail if blocked)
    (async () => {
      try {
        const mod = await import('../../lib/supabase');
        const supabase = (mod as any).supabase;
        if (supabase) {
          const { data: hs } = await supabase.from('equipamento_mapa').select('*');
          if (hs) {
            const hotspotsData = hs.map((item: any) => ({
              id: item.id,
              equipamento_id: item.equipamento_id,
              x: item.x ?? 10,
              y: item.y ?? 10,
              width: item.width ?? 6,
              height: item.height ?? 6,
              color: item.color,
              fontSize: item.font_size,
              icon: item.icon,
            }));
            setHotspots(hotspotsData);
            try { localStorage.setItem('hotspots', JSON.stringify(hotspotsData)); } catch (e) {}
          }

          const { data: eqData } = await supabase.from('equipamentos').select('id,nome,status_revisao,imagem_url,codigo_interno,setor,linha_setor');
          if (eqData) {
            const mapped = eqData.map((i: any) => ({ id: i.id, nome: i.nome, progresso: i.status_revisao || 0, imagem_url: i.imagem_url, codigo_interno: i.codigo_interno, setor: i.linha_setor ?? i.setor ?? '', linha_setor: i.linha_setor ?? i.setor ?? '' }));
            setEquipments(mapped);
            try { localStorage.setItem('equipments', JSON.stringify(mapped)); } catch (e) {}
          }
        }
      } catch (e) {
        // ignore; we have localStorage fallback
      }
    })();

    // Resize observer for image and overlay
    const obs = new ResizeObserver(() => setTimeout(recomputeImgRectTV, 60));
    try { if (imageRefTV.current) obs.observe(imageRefTV.current); } catch (e) {}
    try { if (overlayRefTV.current) obs.observe(overlayRefTV.current); } catch (e) {}

    // MutationObserver to detect layout changes inside overlayRefTV (sidebar toggles, paddings)
    let mo: MutationObserver | null = null;
    try {
      if (overlayRefTV.current) {
        mo = new MutationObserver(() => {
          setTimeout(recomputeImgRectTV, 40);
          setTimeout(recomputeImgRectTV, 200);
        });
        mo.observe(overlayRefTV.current, { attributes: true, childList: true, subtree: true });
      }
    } catch (e) {}

    // fullscreen & resize handler: emulate mapa's multi-pass recompute to handle browser reflows
    const onFullScreenChange = () => {
      try {
        recomputeImgRectTV();
        setTimeout(recomputeImgRectTV, 80);
        setTimeout(recomputeImgRectTV, 300);
        setTimeout(recomputeImgRectTV, 800);
      } catch (e) {}
    };
    try {
      document.addEventListener('fullscreenchange', onFullScreenChange);
      document.addEventListener('webkitfullscreenchange', onFullScreenChange as any);
      document.addEventListener('mozfullscreenchange', onFullScreenChange as any);
      document.addEventListener('MSFullscreenChange', onFullScreenChange as any);
      window.addEventListener('resize', onFullScreenChange);
    } catch (e) {}

    // devicePixelRatio changes (zoom) — poll for changes
    let lastDpr = window.devicePixelRatio;
    const dprInterval = setInterval(() => {
      if (window.devicePixelRatio !== lastDpr) {
        lastDpr = window.devicePixelRatio;
        recomputeImgRectTV();
      }
    }, 300);

    // time and rotation intervals
    const timeI = setInterval(() => setCurrentTime(new Date()), 1000);
    const rotI = setInterval(() => setTvView(prev => (prev === 'map' ? 'plan' : 'map')), 40000);

    // periodic refresh to pick up new hotspots/equipments added elsewhere
    let refreshI: number | null = null;
    const reloadData = async () => {
      try {
        const mod = await import('../../lib/supabase');
        const supabase = (mod as any).supabase;
        if (!supabase) return;

        const { data: hs } = await supabase.from('equipamento_mapa').select('*');
        if (hs) {
          const hotspotsData = hs.map((item: any) => ({
            id: item.id,
            equipamento_id: item.equipamento_id,
            x: item.x ?? 10,
            y: item.y ?? 10,
            width: item.width ?? 6,
            height: item.height ?? 6,
            color: item.color,
            fontSize: item.font_size,
            icon: item.icon,
          }));
          setHotspots(hotspotsData);
          try { localStorage.setItem('hotspots', JSON.stringify(hotspotsData)); } catch (e) {}
        }

        const { data: eqData } = await supabase.from('equipamentos').select('id,nome,status,codigo_interno,setor,linha_setor,imagem_url');
        if (eqData) {
          const mapped = eqData.map((i: any) => ({ id: i.id, nome: i.nome, progresso: i.status_revisao || 0, imagem_url: i.imagem_url, codigo_interno: i.codigo_interno, setor: i.linha_setor ?? i.setor ?? '', linha_setor: i.linha_setor ?? i.setor ?? '' }));
          setEquipments(mapped);
          try { localStorage.setItem('equipments', JSON.stringify(mapped)); } catch (e) {}
        }
      } catch (e) {
        // ignore
      }
    };
    refreshI = window.setInterval(() => reloadData(), 10_000);

    // storage listener to react to local changes (e.g., adding hotspot saved to localStorage)
    const onStorage = (ev: StorageEvent) => {
      try {
        if (ev.key === 'hotspots' && ev.newValue) {
          const parsed = JSON.parse(ev.newValue) as Hotspot[];
          setHotspots(parsed || []);
        }
        if (ev.key === 'equipments' && ev.newValue) {
          const parsed = JSON.parse(ev.newValue) as Equipment[];
          setEquipments(parsed || []);
        }
      } catch (e) {}
    };
    try { window.addEventListener('storage', onStorage); } catch (e) {}

    return () => {
      try { obs.disconnect(); } catch (e) {}
      if (mo) {
        try { mo.disconnect(); } catch (e) {}
      }
      clearInterval(dprInterval);
      clearInterval(timeI);
      clearInterval(rotI);
      if (refreshI) clearInterval(refreshI);
      try { window.removeEventListener('storage', onStorage); } catch (e) {}
      try {
        document.removeEventListener('fullscreenchange', onFullScreenChange);
        document.removeEventListener('webkitfullscreenchange', onFullScreenChange as any);
        document.removeEventListener('mozfullscreenchange', onFullScreenChange as any);
        document.removeEventListener('MSFullscreenChange', onFullScreenChange as any);
        window.removeEventListener('resize', onFullScreenChange);
      } catch (e) {}
    };
  }, []);

  // when hotspots change, ensure rects are recomputed (helps keep alignment after dynamic updates)
  useEffect(() => {
    try { recomputeImgRectTV(); } catch (e) {}
  }, [hotspots]);

  // Schedule reconciliation after layout changes and when hotspots update
  useEffect(() => {
    try {
      setTimeout(reconcileHotspotsTV, 60);
      setTimeout(reconcileHotspotsTV, 200);
      setTimeout(reconcileHotspotsTV, 600);
    } catch (e) {}
  }, [hotspots, imgRectTV, overlayRectTV]);

  // Observe overlay area to trigger reconcile on resizes/mutations
  useEffect(() => {
    try {
      if (!overlayRefTV.current) return;
      const obs = new ResizeObserver(() => {
        setTimeout(reconcileHotspotsTV, 40);
        setTimeout(reconcileHotspotsTV, 200);
      });
      obs.observe(overlayRefTV.current);
      return () => { try { obs.disconnect(); } catch (e) {} };
    } catch (e) {}
  }, []);

  useEffect(() => { recomputeImgRectTV(); }, [mapImage]);

  // sync hotspots from hook (includes groups + equipment-level hotspots)
  useEffect(() => {
    try {
      if (mapa.hotspots && mapa.hotspots.length > 0) {
        setHotspots(mapa.hotspots as any);
        try { localStorage.setItem('hotspots', JSON.stringify(mapa.hotspots)); } catch (e) {}
      }
    } catch (e) {}
  }, [mapa.hotspots]);

  // Render
  // prepare grouped equipment for right panel (list all equipments, highlight hotspots)
  const hotspotEqIds = new Set<string>();
  hotspots.forEach((h: any) => {
    if (!h) return;
    if ((h as any).isGroup && Array.isArray((h as any).members)) {
      (h as any).members.forEach((m: any) => hotspotEqIds.add(String(m)));
    }
    if (h.equipamento_id) hotspotEqIds.add(String(h.equipamento_id));
  });
  const allEquipments = equipments || [];
  // Only include equipments that have hotspots when in TV map view.
  const equipmentsForPanel = tvView === 'map' ? allEquipments.filter(eq => hotspotEqIds.has(String(eq.id))) : allEquipments;

  const groupsAll: Record<string, Equipment[]> = equipmentsForPanel.reduce((acc, eq) => {
    const key = eq.linha_setor ?? eq.setor ?? 'Sem Setor';
    if (!acc[key]) acc[key] = [];
    acc[key].push(eq);
    return acc;
  }, {} as Record<string, Equipment[]>);
  const groupKeys = Object.keys(groupsAll).sort();
  // Prepare overlays: show 'Linha 1' (left-top) and 'Linha 2' (right-top) over the image;
  // remaining groups are omitted from the right panel per user's request.
  const leftGroupItems: Equipment[] = (groupsAll['Linha 1'] || []) as Equipment[];
  const rightOverlayItems: Equipment[] = (groupsAll['Linha 2'] || []) as Equipment[];
  const rightGroupKeys: string[] = groupKeys.filter(k => k !== 'Linha 1' && k !== 'Linha 2');

  // Compute inner image box (live rects preferred) so hotspots render even when
  // stored `imgRectTV`/`overlayRectTV` are stale or null.
  const innerBox = (() => {
    try {
      const img = imageRefTV.current?.getBoundingClientRect() || null;
      const over = overlayRefTV.current?.getBoundingClientRect() || null;
      if (img && over) return { left: img.left - over.left, top: img.top - over.top, width: img.width, height: img.height };
      if (imgRectTV && overlayRectTV) return { left: imgRectTV.left - overlayRectTV.left, top: imgRectTV.top - overlayRectTV.top, width: imgRectTV.width, height: imgRectTV.height };
      return null;
    } catch (e) {
      return null;
    }
  })();

  // If there are hotspots but we couldn't compute innerBox, schedule a recompute
  useEffect(() => {
    try {
      if (hotspots.length > 0 && !innerBox) {
        setTimeout(recomputeImgRectTV, 60);
        setTimeout(recomputeImgRectTV, 200);
      }
    } catch (e) {}
  }, [hotspots.length, mapImage, innerBox]);
  return (
    <div className="min-h-screen w-full bg-[#090F1A] p-4">
      <div className="flex flex-col h-screen gap-4">
        <header className="flex items-center justify-between px-4 h-20" style={{ background: 'linear-gradient(90deg,#0A1120,#0F172A)', borderRadius: 12, border: '1px solid rgba(255,255,255,0.06)' }}>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded flex items-center justify-center overflow-hidden">
              <img
                src={((import.meta as any).env?.VITE_COMPANY_LOGO_URL) || (typeof window !== 'undefined' ? localStorage.getItem('company_logo') : null) || '/favicon.svg'}
                alt="logo"
                className="w-10 h-10 object-contain"
              />
            </div>
            <div>
              <div className="text-white font-semibold">IBA Santa Luzia</div>
              <div className="text-xs text-blue-200">Centro de Comando</div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-36 h-14 rounded-lg bg-white/5 shadow-lg flex flex-col items-center justify-center text-sm">
              <div className="text-sm font-semibold" style={{ color: '#10B981' }}>Produção</div>
              <div className="text-xs text-white/70">—</div>
            </div>
            <div className="w-36 h-14 rounded-lg bg-white/5 shadow-lg flex flex-col items-center justify-center text-sm">
              <div className="text-sm font-semibold" style={{ color: '#10B981' }}>Eficiência</div>
              <div className="text-xs text-white/70">—</div>
            </div>
            <div className="w-36 h-14 rounded-lg bg-white/5 shadow-lg flex flex-col items-center justify-center text-sm">
              <div className="text-sm font-semibold" style={{ color: '#10B981' }}>OS</div>
              <div className="text-xs text-white/70">—</div>
            </div>
            <div className="w-36 h-14 rounded-lg bg-white/5 shadow-lg flex flex-col items-center justify-center text-sm">
              <div className="text-sm font-semibold" style={{ color: '#10B981' }}>Alertas</div>
              <div className="text-xs text-white/70">—</div>
            </div>
            <div className="w-36 h-14 rounded-lg bg-white/5 shadow-lg flex flex-col items-center justify-center text-sm">
              <div className="text-sm font-semibold" style={{ color: '#10B981' }}>Equipamentos</div>
              <div className="text-xs text-white/70">—</div>
            </div>
            <div className="w-36 h-14 rounded-lg bg-white/5 shadow-lg flex flex-col items-center justify-center text-sm">
              <div className="text-sm font-semibold" style={{ color: '#10B981' }}>Status Geral</div>
              <div className="text-xs text-white/70">—</div>
            </div>
          </div>
        </header>

        <div className="flex-1 flex flex-col md:flex-row gap-4">
          {/* Left: main image (90%) */}
          <div className="md:flex-1 md:basis-[90%] w-full">
            <div className="w-full h-full rounded-xl overflow-hidden shadow-xl bg-[#0E1525] p-0">
              {tvView === 'map' ? (
                mapImage ? (
                  <div ref={overlayRefTV} className="relative w-full h-full">
                    <div className="w-full h-full rounded-xl overflow-hidden bg-[#0D1322]">
                      <img
                        ref={imageRefTV}
                        src={mapImage}
                        alt="Mapa Industrial"
                        className="block w-full h-full object-contain pointer-events-none"
                        onLoad={() => { recomputeImgRectTV(); setTimeout(recomputeImgRectTV, 80); }}
                        style={{ display: mapImage ? 'block' : 'none', aspectRatio: '16/9' }}
                      />

                        {/* Compact overlays: Linha 1 (left-top) and Linha 2 (right-top) */}
                        {leftGroupItems.length > 0 && (
                          <div className="absolute left-4 top-4 z-30 pointer-events-none">
                            <div className="bg-emerald-700/10 border border-emerald-600/10 backdrop-blur-sm rounded-lg p-2 w-44">
                              <div className="text-[10px] text-gray-300 uppercase font-semibold mb-1">Linha 1</div>
                              <div className="space-y-1">
                                {leftGroupItems.map((eq) => (
                                  <div key={eq.id} className="flex items-center justify-between text-xs text-white px-1 py-0.5">
                                    <div className="truncate text-xs">{eq.nome}</div>
                                    <div className="font-bold text-xs">{(eq.progresso ?? 0)}%</div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        )}

                        {rightOverlayItems.length > 0 && (
                          <div className="absolute right-4 top-4 z-30 pointer-events-none">
                            <div className="bg-emerald-700/10 border border-emerald-600/10 backdrop-blur-sm rounded-lg p-2 w-44">
                              <div className="text-[10px] text-gray-300 uppercase font-semibold mb-1">Linha 2</div>
                              <div className="space-y-1">
                                {rightOverlayItems.map((eq) => (
                                  <div key={eq.id} className="flex items-center justify-between text-xs text-white px-1 py-0.5">
                                    <div className="truncate text-xs">{eq.nome}</div>
                                    <div className="font-bold text-xs">{(eq.progresso ?? 0)}%</div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        )}

                      {/* Hotspots overlay: render inside a pixel-sized box matching the actual rendered image rect so
                          positions (percent x/y) map consistently between Mapa and Dashboard TV */}
                      {hotspots.length > 0 && innerBox && (
                        <div className="absolute inset-0 pointer-events-none">
                          {/* inner box positioned over the image in pixels */}
                          <div
                            style={{
                              position: 'absolute',
                              left: `${innerBox.left}px`,
                              top: `${innerBox.top}px`,
                              width: `${innerBox.width}px`,
                              height: `${innerBox.height}px`,
                              pointerEvents: 'none'
                            }}
                          >
                            {hotspots.map(h => {
                              const equipment = equipments.find(e => e.id === h.equipamento_id);
                              const fontSize = h.fontSize || 12;
                              const circleSize = Math.max(28, (fontSize + 8));

                              // Use percentage positioning inside the image-box so behavior matches `mapa`
                              const leftPercent = (h.x ?? 0);
                              const topPercent = (h.y ?? 0);

                              return (
                                <div key={h.id} data-hotspot-id={h.id} className="absolute" style={{ left: `${leftPercent}%`, top: `${topPercent}%`, transform: 'translate(-50%, -50%)', width: `${h.width}%`, height: `${h.height}%`, display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'auto' }}>
                                  <div className="rounded-full relative flex flex-col items-center justify-center shadow-2xl overflow-hidden" style={{ background: getProgressColor(equipment?.progresso ?? 0), width: `${circleSize}px`, height: `${circleSize}px`, boxShadow: '0 0 10px rgba(0,229,255,0.35)' }}>
                                          {/* percentage centered inside the circle (icon removed) */}
                                          <span className="flex items-center justify-center text-white font-bold" style={{ fontSize: `${Math.max(10, Math.floor(circleSize * 0.42))}px`, lineHeight: 1, zIndex: 1 }}>{(equipment?.progresso ?? 0)}%</span>
                                        </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="text-center text-gray-400 p-6">Mapa não encontrado. Faça upload na página Mapa Industrial.</div>
                )
              ) : (
                <div className="w-full h-full overflow-auto p-4 text-white">
                  <h3 className="text-xl mb-2">Planejamento Semanal</h3>
                  <div className="grid grid-cols-1 md:grid-cols-6 gap-3">
                    <div className="bg-white/5 rounded p-3">Segunda</div>
                    <div className="bg-white/5 rounded p-3">Terça</div>
                    <div className="bg-white/5 rounded p-3">Quarta</div>
                    <div className="bg-white/5 rounded p-3">Quinta</div>
                    <div className="bg-white/5 rounded p-3">Sexta</div>
                    <div className="bg-white/5 rounded p-3">Sábado</div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right equipment panel removed per user request (Linha 1 and Linha 2 shown as overlays) */}
          <></>
        </div>
      </div>
    </div>
  );
}
