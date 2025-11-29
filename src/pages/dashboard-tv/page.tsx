import React, { useEffect, useRef, useState } from 'react';

type Equipment = { id: string; nome?: string; progresso?: number; setor?: string; imagem_url?: string };
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
  const [imgRectTV, setImgRectTV] = useState<DOMRect | null>(null);

  const recomputeImgRectTV = () => {
    try {
      if (imageRefTV.current) setImgRectTV(imageRefTV.current.getBoundingClientRect());
    } catch (e) {}
  };

  // responsive grid columns: use JS to choose layout so we can target TVs and small screens
  const [gridCols, setGridCols] = useState<string>(() => {
    try {
      return window.innerWidth < 1024 ? '1fr' : '5% 90% 5%';
    } catch (e) {
      return '5% 90% 5%';
    }
  });

  useEffect(() => {
    const onResize = () => {
      try {
        setGridCols(window.innerWidth < 1024 ? '1fr' : '5% 90% 5%');
      } catch (e) {}
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const getProgressColor = (prog = 0) => {
    if (prog >= 100) return '#10b981';
    if (prog === 0) return '#3b82f6';
    if (prog > 0 && prog <= 50) return '#f59e0b';
    if (prog > 50 && prog < 100) return '#f97316';
    return '#6b7280';
  };

  // Load data from localStorage first; attempt Supabase if available (non-blocking)
  useEffect(() => {
    (async () => {
      // 1) explicit env override `VITE_MAP_IMAGE_URL`
      try {
        const envUrl = (import.meta as any).env?.VITE_MAP_IMAGE_URL || null;
        if (envUrl) {
          try {
            const h = await fetch(envUrl, { method: 'HEAD' });
            if (h.ok) {
              setMapImage(envUrl);
              return;
            }
          } catch (e) {}
        }

        // 2) Use Supabase SDK to derive public URL for 'mapa.jpg' (no HEAD check)
        try {
          const mod = await import('../../lib/supabase');
          const supabase = (mod as any).supabase;
          if (supabase) {
            const { data } = supabase.storage.from('mapas').getPublicUrl('mapa.jpg');
            const publicUrl = data?.publicUrl || null;
            if (publicUrl) {
              setMapImage(publicUrl);
              return;
            }
          }
        } catch (e) {
          // ignore
        }

        // 3) fallback to localStorage (legacy)
        const savedMap = typeof window !== 'undefined' ? localStorage.getItem('map_image') : null;
        if (savedMap) {
          setMapImage(savedMap);
          return;
        }
      } catch (e) {
        // ignore and show upload modal below
      }
    })();

    // hotspots saved as JSON in localStorage under 'hotspots'
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

          const { data: eqData } = await supabase.from('equipamentos').select('id,nome,status_revisao,imagem_url');
          if (eqData) {
            const mapped = eqData.map((i: any) => ({ id: i.id, nome: i.nome, progresso: i.status_revisao || 0, imagem_url: i.imagem_url }));
            setEquipments(mapped);
            try { localStorage.setItem('equipments', JSON.stringify(mapped)); } catch (e) {}
          }
        }
      } catch (e) {
        // ignore; we have localStorage fallback
      }
    })();

    // Resize observer for image
    const obs = new ResizeObserver(() => setTimeout(recomputeImgRectTV, 60));
    try { if (imageRefTV.current) obs.observe(imageRefTV.current); } catch (e) {}

    // time and rotation intervals
    const timeI = setInterval(() => setCurrentTime(new Date()), 1000);
    const rotI = setInterval(() => setTvView(prev => (prev === 'map' ? 'plan' : 'map')), 40000);

    return () => {
      try { obs.disconnect(); } catch (e) {}
      clearInterval(timeI);
      clearInterval(rotI);
    };
  }, []);

  useEffect(() => { recomputeImgRectTV(); }, [mapImage]);

  // Render
  return (
    <div className="min-h-screen w-full bg-[#090F1A] p-2">
      <div className="grid" style={{ gridTemplateColumns: gridCols, gridTemplateRows: '80px 1fr 100px', height: '100vh', gap: '12px', paddingLeft: 8, paddingRight: 8 }}>
        <header className="col-span-3 flex items-center justify-between px-4 h-[80px]" style={{ background: 'linear-gradient(90deg,#0A1120,#0F172A)', borderRadius: 8, border: '1px solid rgba(255,255,255,0.08)' }}>
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-blue-600 rounded flex items-center justify-center"><i className="ri-plant-line text-white" /></div>
            <div>
              <div className="text-white font-semibold">ALGODOEIRA IBA SANTA LUZIA</div>
              <div className="text-xs text-blue-200">Centro de Comando</div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-36 h-14 rounded-lg bg-white/5 shadow-lg flex items-center justify-center text-sm">Produção</div>
            <div className="w-36 h-14 rounded-lg bg-white/5 shadow-lg flex items-center justify-center text-sm">Eficiência</div>
            <div className="w-36 h-14 rounded-lg bg-white/5 shadow-lg flex items-center justify-center text-sm">OS</div>
          </div>
        </header>

        {/* Left Sidebar */}
        {/* Left column - collapses under central on small screens; hidden for planning view */}
        {tvView === 'map' && (
          <aside className="col-start-1 col-end-2 row-start-2 row-end-3 px-2">
          <div className="space-y-3">
            <div className="w-full rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm p-4 shadow-md min-h-[160px]">
              <div className="text-sm uppercase tracking-wide text-white/60">Equipamentos</div>
            </div>
            <div className="w-full rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm p-4 shadow-md min-h-[160px]">
              <div className="text-sm uppercase tracking-wide text-white/60">Status Geral</div>
            </div>
          </div>
          </aside>
        )}

        {/* Center - Map / Planning */}
        <main className="col-start-2 col-end-3 row-start-2 row-end-3 flex items-center justify-center px-2">
          <div className="w-full h-full rounded-xl overflow-hidden border border-white/10 shadow-xl bg-[#0E1525] p-0 flex items-center justify-center">
            {tvView === 'map' ? (
              mapImage ? (
                <div ref={overlayRefTV} className="w-full h-full flex items-center justify-center relative">
                  <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'stretch', justifyContent: 'center' }} className="rounded-xl overflow-hidden bg-[#0D1322]">
                    <img
                      ref={imageRefTV}
                      src={mapImage}
                      alt="Mapa Industrial"
                      className="w-full h-full object-cover rounded-none"
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      onLoad={() => recomputeImgRectTV()}
                    />
                  </div>
                  {/* Hotspots (percentual) */}
                  {hotspots.length > 0 && (
                    <div className="absolute inset-0 pointer-events-none">
                      {hotspots.map(h => {
                        const equipment = equipments.find(e => e.id === h.equipamento_id);
                        const prog = equipment?.progresso ?? 0;
                        const color = getProgressColor(prog);
                        const fontSize = h.fontSize || 12;
                        const circleSize = Math.max(28, (fontSize + 8));

                        const leftPercent = (h.x ?? 0) - ((h.width ?? 0) / 2);
                        const topPercent = (h.y ?? 0) - ((h.height ?? 0) / 2);

                        return (
                          <div key={h.id} className="absolute" style={{ left: `${leftPercent}%`, top: `${topPercent}%`, width: `${h.width}%`, height: `${h.height}%`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <div className="rounded-full flex flex-col items-center justify-center shadow-lg" style={{ background: color, width: `${circleSize}px`, height: `${circleSize}px` }}>
                              <i className={`${h.icon || 'ri-tools-fill'} text-white`} style={{ fontSize: `${fontSize + 4}px` }} />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center text-gray-400">Mapa não encontrado. Faça upload na página Mapa Industrial.</div>
              )
            ) : (
              // Planning view (simplified)
              <div className="w-full h-full overflow-auto p-4 text-white">
                <h3 className="text-xl mb-2">Planejamento Semanal</h3>
                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-white/5 rounded p-3">Segunda</div>
                  <div className="bg-white/5 rounded p-3">Terça</div>
                  <div className="bg-white/5 rounded p-3">Quarta</div>
                </div>
              </div>
            )}
          </div>
        </main>

        {/* Right Sidebar - hidden in planning view */}
        {tvView === 'map' && (
          <aside className="col-start-3 col-end-4 row-start-2 row-end-3 px-2">
            <div className="space-y-3">
              <div className="w-full rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm p-4 shadow-md min-h-[160px]">
                <div className="text-sm uppercase tracking-wide text-white/60">OS Abertas</div>
              </div>
              <div className="w-full rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm p-4 shadow-md min-h-[160px]">
                <div className="text-sm uppercase tracking-wide text-white/60">Alertas / Críticos</div>
              </div>
            </div>
          </aside>
        )}

        <footer className="col-span-3 row-start-3 row-end-4 px-4 py-4" style={{ background: 'linear-gradient(90deg,#0A1120,#0F172A)', borderRadius: 8, border: '1px solid rgba(255,255,255,0.08)' }}>
          <div className="flex items-center justify-between">
            <div className="flex gap-3">
              <div className="w-40 h-16 rounded-md bg-white/5 border flex flex-col justify-center px-3" style={{ borderColor: 'rgba(255,255,255,0.08)' }}>
                <div className="text-xs text-gray-300">Temperatura</div>
                <div className="text-sm font-bold text-white">—</div>
              </div>
              <div className="w-40 h-16 rounded-md bg-white/5 border flex flex-col justify-center px-3" style={{ borderColor: 'rgba(255,255,255,0.08)' }}>
                <div className="text-xs text-gray-300">Consumo</div>
                <div className="text-sm font-bold text-white">—</div>
              </div>
            </div>
            <div className="text-sm text-gray-300">% Eficiência: <span className="text-[#00FFB0] font-bold">—</span></div>
          </div>
        </footer>
      </div>
    </div>
  );
}
