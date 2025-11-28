
import { useState, useEffect, useRef } from 'react';
import { formatEquipamentoName } from '../../utils/format';
import EquipamentoName from '../../components/base/EquipamentoName';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../dashboard/components/Sidebar';
import TopBar from '../dashboard/components/TopBar';
import useSidebar from '../../hooks/useSidebar';
import { supabase } from '../../lib/supabase';
import { grupoEquipamentosAPI } from '../../lib/api';
import { storageAPI } from '../../lib/storage';
import useMapaHotspots from '../../hooks/useMapaHotspots';
import { useToast } from '../../hooks/useToast';
// PanoramaViewer removed from this file (used elsewhere)

interface Equipment {
  id: string;
  nome: string;
  x: number;
  y: number;
  status: 'operacional' | 'manutencao' | 'parado' | 'alerta';
  setor: string;
  progresso?: number;
  criticidade?: string;
  fabricante?: string;
  modelo?: string;
}

interface Hotspot {
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

export default function MapaPage() {
  const navigate = useNavigate();
  const { isOpen: sidebarOpen, toggle: toggleSidebar } = useSidebar();
  const [darkMode, setDarkMode] = useState(true);
  const [equipments, setEquipments] = useState<Equipment[]>([]);
  const [hotspots, setHotspots] = useState<Hotspot[]>([]);
  const [selectedEquipment, setSelectedEquipment] = useState<Equipment | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('todos');
  const [filterSetor, setFilterSetor] = useState<string>('todos');
  const [setores, setSetores] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [mapImage, setMapImage] = useState<string>('');
  const [showImageUpload, setShowImageUpload] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [selectedHotspot, setSelectedHotspot] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const [resizing, setResizing] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [showAddHotspot, setShowAddHotspot] = useState(false);
  const [selectedEquipmentForHotspot, setSelectedEquipmentForHotspot] = useState<string>('');
  const [equipmentDetails, setEquipmentDetails] = useState<any>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [showCustomizePanel, setShowCustomizePanel] = useState(false);
  const [hotspotColor, setHotspotColor] = useState('#10b981');
  const [hotspotFontSize, setHotspotFontSize] = useState(14);
  const [hotspotIcon, setHotspotIcon] = useState('ri-tools-fill');
  const mapRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);
  const [imgRect, setImgRect] = useState<DOMRect | null>(null);
  const [containerRect, setContainerRect] = useState<DOMRect | null>(null);
  const [showServiceModal, setShowServiceModal] = useState(false);
  const [serviceName, setServiceName] = useState('');
  const [serviceDesc, setServiceDesc] = useState('');
  const [selectedEquipmentsForService, setSelectedEquipmentsForService] = useState<string[]>([]);
  // Group modal states
  const [showGroupModal, setShowGroupModal] = useState(false);
  const [editingGroup, setEditingGroup] = useState<any | null>(null);
  const [groupForm, setGroupForm] = useState<any>({ nome: '', linha: '', x: 10, y: 10, width: 8, height: 8, color: '#10b981', font_size: 14, icon: 'ri-map-pin-fill', members: [] });
  const [groupSearch, setGroupSearch] = useState<string>('');
  const [currentGroup, setCurrentGroup] = useState<any | null>(null);
  const [currentGroupMembers, setCurrentGroupMembers] = useState<string[]>([]);

  const mapa = useMapaHotspots();
  const toast = useToast();

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  useEffect(() => {
    loadEquipments();
    loadSetores();
    // hotspots will be loaded by hook
    mapa.load();

    // First try localStorage (uploader browser). If not present, try public storage URL at a fixed path
    const init = async () => {
      const savedImage = (() => {
        try { return localStorage.getItem('map_image'); } catch (e) { return null; }
      })();
      if (savedImage) {
        setMapImage(savedImage);
        return;
      }

      try {
        // Construct public URL via Supabase helper
        const { data } = supabase.storage.from('mapas').getPublicUrl('mapa.jpg');
        if (data && data.publicUrl) {
          // do a quick HEAD/fetch to see if exists
          try {
            const resp = await fetch(data.publicUrl, { method: 'HEAD' });
            if (resp.ok) {
              setMapImage(data.publicUrl);
              return;
            }
          } catch (e) {
            // ignore fetch errors
          }
        }
      } catch (e) {
        // ignore storage errors
      }
    };
    init();

    const interval = setInterval(() => {
      loadEquipments();
      mapa.load();
    }, 5 * 60 * 1000); // every 5 minutes

    const updateRects = () => {
      if (mapRef.current) setContainerRect(mapRef.current.getBoundingClientRect());
      if (imageRef.current) setImgRect(imageRef.current.getBoundingClientRect());
    };
    updateRects();

    // ResizeObserver to watch image and container size changes (covers fullscreen and layout transitions)
    let ro: ResizeObserver | null = null;
    try {
      ro = new ResizeObserver(() => {
        setTimeout(updateRects, 40);
      });
      if (mapRef.current) ro.observe(mapRef.current);
      if (imageRef.current) ro.observe(imageRef.current!);
    } catch (err) {
      // ResizeObserver may not be available in some environments; fallback to window resize
      window.addEventListener('resize', updateRects);
    }

    return () => {
      clearInterval(interval);
      if (ro) {
        try { ro.disconnect(); } catch (e) {}
      } else {
        window.removeEventListener('resize', updateRects);
      }
    };
  }, []);

  // Recompute image/container rects when layout changes (sidebar, panels, image changes)
  useEffect(() => {
    const updateRects = () => {
      if (mapRef.current) setContainerRect(mapRef.current.getBoundingClientRect());
      if (imageRef.current) setImgRect(imageRef.current.getBoundingClientRect());
    };

    // small timeout to allow layout transition to finish
    const t = setTimeout(updateRects, 120);
    return () => clearTimeout(t);
  }, [sidebarOpen, selectedEquipment, mapImage, editMode, showAddHotspot]);

  useEffect(() => {
    // keep local hotspots in sync with hook
    setHotspots(mapa.hotspots);
  }, [mapa.hotspots]);

  const loadSetores = async () => {
    try {
      const { data, error } = await supabase
        .from('setores')
        .select('nome')
        .order('nome');

      if (error) throw error;
      if (data) {
        setSetores(data.map(s => s.nome));
      }
    } catch (err) {
      console.error('Erro ao carregar setores:', err);
    }
  };

  const loadEquipments = async () => {
    try {
      setLoading(true);
      
      const { data: eqData, error: eqError } = await supabase
        .from('equipamentos')
        .select('*, setores(nome)');

      if (!eqError && eqData && eqData.length > 0) {
        const mapped = eqData.map((item) => ({
          id: item.id,
          nome: item.nome || 'Sem nome',
          codigo_interno: item.codigo_interno || '',
          x: 0,
          y: 0,
          status: (item.status_revisao >= 100 ? 'operacional' : 
                 item.status_revisao >= 50 ? 'manutencao' : 
                 item.status_revisao > 0 ? 'alerta' : 'parado') as Equipment['status'],
          setor: item.setores?.nome || 'Sem setor',
          progresso: item.status_revisao || 0,
          criticidade: item.criticidade,
          fabricante: item.fabricante,
          modelo: item.modelo,
        }));
        setEquipments(mapped as Equipment[]);
      } else {
        setEquipments([]);
      }
    } catch (err) {
      console.error('Erro ao carregar equipamentos:', err);
      setEquipments([]);
    } finally {
      setLoading(false);
    }
  };

  // hotspots are handled by `useMapaHotspots` hook

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Compress large images client-side before uploading (to satisfy 5MB limit)
      (async () => {
        try {
          let fileToUpload: File = file;

          const MAX_BYTES = 5 * 1024 * 1024; // 5MB
          const compressFile = (inputFile: File, maxBytes = MAX_BYTES): Promise<File> => {
            return new Promise((resolve, reject) => {
              const reader = new FileReader();
              reader.onload = () => {
                const img = new Image();
                img.onload = async () => {
                  const canvas = document.createElement('canvas');
                  let { width, height } = img;
                  const maxWidth = 1920;
                  if (width > maxWidth) {
                    const ratio = maxWidth / width;
                    width = maxWidth;
                    height = Math.round(height * ratio);
                  }
                  canvas.width = width;
                  canvas.height = height;
                  const ctx = canvas.getContext('2d');
                  if (!ctx) return reject(new Error('Canvas not supported'));
                  ctx.drawImage(img, 0, 0, width, height);

                  let quality = 0.9;
                  const attempt = async (): Promise<void> => {
                    return new Promise((resAttempt, rejAttempt) => {
                      canvas.toBlob(async (blob) => {
                        if (!blob) return rejAttempt(new Error('Falha ao gerar blob'));
                        if (blob.size <= maxBytes || quality <= 0.5) {
                          const f = new File([blob], inputFile.name.replace(/\.[^.]+$/, '.jpg'), { type: 'image/jpeg' });
                          fileToUpload = f;
                          return resAttempt();
                        }
                        // reduce quality and retry
                        quality -= 0.1;
                        // draw not necessary again as canvas already has pixels
                        await attempt();
                        resAttempt();
                      }, 'image/jpeg', quality);
                    });
                  };

                  try {
                    await attempt();
                    resolve(fileToUpload);
                  } catch (err) {
                    reject(err);
                  }
                };
                img.onerror = (e) => reject(e);
                img.src = reader.result as string;
              };
              reader.onerror = (e) => reject(e);
              reader.readAsDataURL(inputFile);
            });
          };

          if (file.size > MAX_BYTES) {
            toast.info('Imagem grande — comprimindo antes do upload...');
            try {
              fileToUpload = await compressFile(file, MAX_BYTES);
              toast.success('Compressão concluída — iniciando upload');
            } catch (err) {
              console.warn('Falha na compressão:', err);
              // ask user to fallback to localStorage
              const saveLocal = window.confirm('Não foi possível comprimir a imagem automaticamente. Deseja salvar localmente como fallback?');
              if (!saveLocal) {
                setShowImageUpload(false);
                return;
              }
              // proceed to local fallback below
            }
          }

          // Try upload
          try {
            // upload to a fixed filename so all users can load the same map
            const publicUrl = await storageAPI.uploadImage(fileToUpload, 'mapas', undefined, 'mapa.jpg');
            setMapImage(publicUrl);
            try { localStorage.setItem('map_image', publicUrl); } catch (e) { /* ignore */ }
            toast.success('Mapa enviado e salvo no Storage (bucket mapas)');
            setShowImageUpload(false);
            return;
          } catch (err: any) {
            const msg = (err?.message || '').toString().toLowerCase();
            if (msg.includes('bucket') && msg.includes('not found')) {
              toast.error(`Bucket 'mapas' não encontrado no Supabase. Crie o bucket 'mapas' com acesso público no painel do Supabase para que a imagem seja compartilhada entre dispositivos.`);
              const saveLocal = window.confirm('Deseja salvar o mapa localmente neste navegador como fallback? (Só ficará disponível neste dispositivo).');
              if (!saveLocal) {
                setShowImageUpload(false);
                return;
              }
            } else {
              console.warn('Upload falhou, perguntando ao usuário se deseja fallback local:', err);
              const saveLocal = window.confirm('Upload para o Storage falhou. Deseja salvar o mapa localmente neste navegador como fallback?');
              if (!saveLocal) {
                setShowImageUpload(false);
                return;
              }
            }
          }

          // Fallback: save in localStorage (visible only on this browser)
          const reader = new FileReader();
          reader.onloadend = async () => {
            let result = reader.result as string;

            const trySave = async (dataUrl: string) => {
              try {
                localStorage.setItem('map_image', dataUrl);
                return true;
              } catch (err) {
                return false;
              }
            };

            const compressDataUrl = (dataUrl: string, maxWidth = 1920, quality = 0.8): Promise<string> => {
              return new Promise((resolve, reject) => {
                const img = new Image();
                img.onload = () => {
                  const canvas = document.createElement('canvas');
                  let { width, height } = img;
                  if (width > maxWidth) {
                    const ratio = maxWidth / width;
                    width = maxWidth;
                    height = height * ratio;
                  }
                  canvas.width = width;
                  canvas.height = height;
                  const ctx = canvas.getContext('2d');
                  if (!ctx) return reject(new Error('Canvas not supported'));
                  ctx.drawImage(img, 0, 0, width, height);
                  const compressed = canvas.toDataURL('image/jpeg', quality);
                  resolve(compressed);
                };
                img.onerror = (e) => reject(e);
                img.src = dataUrl;
              });
            };

            let saved = await trySave(result);
            if (!saved) {
              try {
                const compressed1 = await compressDataUrl(result, 1920, 0.8);
                saved = await trySave(compressed1);
                result = compressed1;
              } catch (err) {
                console.warn('Compressão inicial falhou', err);
              }
            }

            if (!saved) {
              try {
                const compressed2 = await compressDataUrl(result, 1280, 0.7);
                saved = await trySave(compressed2);
                result = compressed2;
              } catch (err) {
                console.warn('Segunda tentativa de compressão falhou', err);
              }
            }

            if (!saved) {
              toast.error('Não foi possível salvar o mapa localmente (tamanho excede o limite do navegador). Reduza a resolução da imagem e tente novamente.');
              setShowImageUpload(false);
              return;
            }

            setMapImage(result);
            setShowImageUpload(false);
          };
          reader.readAsDataURL(file);
        } catch (err) {
          console.error('Erro no upload/compressão:', err);
          toast.error('Erro ao processar a imagem. Veja o console para detalhes.');
          setShowImageUpload(false);
        }
      })();
    }
  };

  const handleAddHotspot = async () => {
    if (!selectedEquipmentForHotspot) return;

    try {
      // Verificar se já existe hotspot para este equipamento
      // check existing via hook data
      const exists = mapa.hotspots.find(h => h.equipamento_id === selectedEquipmentForHotspot);
      if (exists) {
        toast.warning('Este equipamento já possui um hotspot no mapa.');
        return;
      }

      await mapa.createHotspot({
        equipamento_id: selectedEquipmentForHotspot,
        x: 20,
        y: 20,
        width: 8,
        height: 8,
      });

      setShowAddHotspot(false);
      setSelectedEquipmentForHotspot('');
    } catch (err: any) {
      console.error('Erro ao adicionar hotspot:', err);
      toast.error(`Erro ao adicionar hotspot: ${err.message || 'Erro desconhecido'}`);
    }
  };

  const handleMouseDown = (e: React.MouseEvent, hotspotId: string, isResize: boolean = false) => {
    if (!editMode) return;
    
    e.stopPropagation();
    setSelectedHotspot(hotspotId);
    
    if (isResize) {
      setResizing(true);
    } else {
      setDragging(true);
    }
    
    setDragStart({ x: e.clientX, y: e.clientY });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!editMode || !selectedHotspot || (!dragging && !resizing)) return;

    const hotspot = hotspots.find(h => h.id === selectedHotspot);
    if (!hotspot || !mapRef.current) return;

    // Use the displayed image rect for percent calculations so hotspots keep relative position
    // when the image is letterboxed or scaled inside the container
    const imgDisplayedRect = imageRef.current?.getBoundingClientRect() || mapRef.current.getBoundingClientRect();
    const deltaX = ((e.clientX - dragStart.x) / imgDisplayedRect.width) * 100;
    const deltaY = ((e.clientY - dragStart.y) / imgDisplayedRect.height) * 100;

    const updatedHotspots = hotspots.map(h => {
      if (h.id === selectedHotspot) {
        if (dragging) {
          return {
            ...h,
            x: Math.max(0, Math.min(100 - h.width, h.x + deltaX)),
            y: Math.max(0, Math.min(100 - h.height, h.y + deltaY)),
          };
        } else if (resizing) {
          return {
            ...h,
            width: Math.max(5, Math.min(50, h.width + deltaX)),
            height: Math.max(5, Math.min(50, h.height + deltaY)),
          };
        }
      }
      return h;
    });

    setHotspots(updatedHotspots);
    setDragStart({ x: e.clientX, y: e.clientY });
  };

  const handleMouseUp = async () => {
    if (selectedHotspot && (dragging || resizing)) {
      const hotspot = hotspots.find(h => h.id === selectedHotspot);
      if (hotspot) {
        try {
          if ((hotspot as any).isGroup || String(hotspot.id).startsWith('grp-')) {
            const gid = String(hotspot.id).replace(/^grp-/, '');
            const updated = await grupoEquipamentosAPI.update(gid, {
              x: hotspot.x,
              y: hotspot.y,
              width: hotspot.width,
              height: hotspot.height,
              color: hotspot.color,
              font_size: hotspot.fontSize,
              icon: hotspot.icon,
            });
            if (!updated) {
              // No row returned — likely RLS or migration not applied
              console.warn('grupoEquipamentosAPI.update returned no rows for id', gid);
              toast.error('Não foi possível salvar o grupo: verifique migrações/permissões no Supabase (RLS).');
            }
          } else {
            await mapa.updateHotspot(hotspot.id, {
              x: hotspot.x,
              y: hotspot.y,
              width: hotspot.width,
              height: hotspot.height,
              color: hotspot.color,
              fontSize: hotspot.fontSize,
              icon: hotspot.icon,
            });
          }
          // success toast handled by hook
        } catch (err) {
          console.error('Erro ao salvar posição:', err);
          // Provide clearer guidance for common DB/API issues
          const msg = (err as any)?.message || String(err);
          if (msg && msg.toString().includes('PGRST116')) {
            toast.error('Erro ao salvar: o servidor não retornou o registro atualizado (PGRST116). Verifique se a tabela `grupo_equipamentos` existe e as políticas RLS permitem atualização.');
          } else {
            toast.error('Erro ao salvar posição do hotspot');
          }
        }
      }
    }
    
    setDragging(false);
    setResizing(false);
  };

  const handleDeleteHotspot = async (hotspotId: string) => {
    if (!window.confirm('Deseja remover este hotspot?')) return;
    try {
      if (String(hotspotId).startsWith('grp-')) {
        const gid = String(hotspotId).replace(/^grp-/, '');
        await grupoEquipamentosAPI.delete(gid);
      } else {
        await mapa.deleteHotspot(hotspotId);
      }
      setSelectedHotspot(null);
    } catch (err) {
      console.error('Erro ao deletar hotspot:', err);
      toast.error('Erro ao remover hotspot');
    }
  };

  const loadEquipmentDetails = async (equipmentId: string) => {
    setLoadingDetails(true);
    try {
      // Buscar dados do equipamento
      const { data: eqData } = await supabase
        .from('equipamentos')
        .select('*, setores(nome)')
        .eq('id', equipmentId)
        .single();

      // Buscar componentes
      const { data: compData } = await supabase
        .from('equipamentos_componentes')
        .select('*, componentes(*)')
        .eq('equipamento_id', equipmentId);

      // Buscar histórico de manutenção
      const { data: histData } = await supabase
        .from('historico_revisoes')
        .select('*')
        .eq('equipamento_id', equipmentId)
        .order('data_revisao', { ascending: false })
        .limit(5);

      // Buscar OS
      const { data: osData } = await supabase
        .from('ordens_servico')
        .select('*')
        .eq('equipamento_id', equipmentId)
        .order('created_at', { ascending: false })
        .limit(5);

      // Buscar custos
      const { data: custosData } = await supabase
        .from('custos')
        .select('*')
        .eq('equipamento_id', equipmentId);

      const totalCustos = custosData?.reduce((sum, c) => sum + (c.valor || 0), 0) || 0;

      setEquipmentDetails({
        ...eqData,
        componentes: compData || [],
        historico: histData || [],
        ordens_servico: osData || [],
        custo_total: totalCustos,
      });
    } catch (err) {
      console.error('Erro ao carregar detalhes:', err);
    } finally {
      setLoadingDetails(false);
    }
  };

  // Service modal actions: allow creating a service and assigning it to multiple equipments
  const openServiceModalForSelected = () => {
    if (selectedEquipment) {
      setSelectedEquipmentsForService([selectedEquipment.id]);
    } else {
      setSelectedEquipmentsForService([]);
    }
    setServiceName('');
    setServiceDesc('');
    setShowServiceModal(true);
  };

  const handleSubmitService = async () => {
    if (!serviceName || selectedEquipmentsForService.length === 0) {
      alert('Informe o nome do serviço e selecione pelo menos um equipamento.');
      return;
    }

    try {
      const rows = selectedEquipmentsForService.map((equipId) => ({
        equipamento_id: equipId,
        nome: serviceName,
        descricao: serviceDesc || null,
      }));

      const { error } = await supabase
        .from('equipamento_servicos')
        .insert(rows);

      if (error) {
        console.error('Erro ao criar serviços:', error);
        alert('Erro ao cadastrar serviço. Veja console para detalhes.');
        return;
      }

      alert('Serviço(s) cadastrado(s) com sucesso!');
      setShowServiceModal(false);
      // reload details for the selected equipment
      if (selectedEquipment) await loadEquipmentDetails(selectedEquipment.id);
    } catch (err) {
      console.error('Erro ao cadastrar serviço:', err);
      alert('Erro ao cadastrar serviço.');
    }
  };

  const handleHotspotClick = async (hotspot: Hotspot) => {
    if (editMode) return;
    
    // if this is a group hotspot, load group details
    // hotspot coming from hook may carry `isGroup` and `group`/`members`
    if ((hotspot as any).isGroup) {
      await loadGroupDetails(hotspot as any);
      return;
    }

    const equipment = equipments.find(eq => eq.id === hotspot.equipamento_id);
    if (equipment) {
      setSelectedEquipment(equipment);
      await loadEquipmentDetails(hotspot.equipamento_id);
    }
  };

  const loadGroupDetails = async (hotspot: any) => {
    setLoadingDetails(true);
    try {
      const group = hotspot.group || {};
      const members: string[] = hotspot.members || [];
      setCurrentGroup(group);
      setCurrentGroupMembers(members || []);

      // fetch member equipment details
      let memberData: any[] = [];
      if (members.length > 0) {
        const { data: eqRows } = await supabase
          .from('equipamentos')
          .select('*, setores(nome)')
          .in('id', members);
        memberData = eqRows || [];
      }

      // synthesize a selectedEquipment object for UI (so right panel can render)
      const avgProg = memberData.length ? Math.round(memberData.reduce((s: any, e: any) => s + (e.status_revisao || 0), 0) / memberData.length) : 0;
      const synth = {
        id: `grp-${group.id}`,
        nome: group.nome || `Grupo ${group.id}`,
        setor: group.linha || 'Grupo',
        progresso: avgProg,
        status: avgProg >= 100 ? 'operacional' : avgProg >= 50 ? 'manutencao' : avgProg > 0 ? 'alerta' : 'parado',
      } as Equipment;

      setSelectedEquipment(synth);

      // prepare equipmentDetails similar shape used by loadEquipmentDetails
      const equipmentDetailsObj: any = {
        componentes: [],
        historico: [],
        ordens_servico: [],
        custo_total: 0,
        members: memberData.map((m: any) => ({
          id: m.id,
          nome: m.nome,
          progresso: m.status_revisao || 0,
          setor: m.setores?.nome || 'Sem setor',
        })),
      };

      setEquipmentDetails(equipmentDetailsObj);
    } catch (err) {
      console.error('Erro ao carregar detalhes do grupo:', err);
    } finally {
      setLoadingDetails(false);
    }
  };

  const openCreateGroupModal = () => {
    setEditingGroup(null);
    setGroupForm({ nome: '', linha: '', x: 10, y: 10, width: 8, height: 8, color: '#10b981', font_size: 14, icon: 'ri-map-pin-fill', members: [] });
    setShowGroupModal(true);
  };

  const openEditGroupModal = (group: any, members: string[]) => {
    setEditingGroup(group);
    setGroupForm({ ...group, members: members || [] });
    setShowGroupModal(true);
  };

  const saveGroup = async () => {
    try {
      let saved: any;
      if (editingGroup) {
        saved = await grupoEquipamentosAPI.update(editingGroup.id, {
          nome: groupForm.nome,
          linha: groupForm.linha,
          x: groupForm.x,
          y: groupForm.y,
          width: groupForm.width,
          height: groupForm.height,
          color: groupForm.color,
          font_size: groupForm.font_size,
          icon: groupForm.icon,
        });
        // replace members
        await supabase.from('grupo_equipamentos_members').delete().eq('grupo_id', editingGroup.id);
        if (groupForm.members && groupForm.members.length > 0) {
          const toInsert = groupForm.members.map((m: string) => ({ grupo_id: editingGroup.id, equipamento_id: m }));
          await supabase.from('grupo_equipamentos_members').insert(toInsert);
        }
      } else {
        saved = await grupoEquipamentosAPI.create({
          nome: groupForm.nome,
          linha: groupForm.linha,
          x: groupForm.x,
          y: groupForm.y,
          width: groupForm.width,
          height: groupForm.height,
          color: groupForm.color,
          font_size: groupForm.font_size,
          icon: groupForm.icon,
        });
        if (groupForm.members && groupForm.members.length > 0) {
          const toInsert = groupForm.members.map((m: string) => ({ grupo_id: saved.id, equipamento_id: m }));
          await supabase.from('grupo_equipamentos_members').insert(toInsert);
        }
      }

      toast.success('Grupo salvo');
      setShowGroupModal(false);
      await mapa.load();
    } catch (err) {
      console.error('Erro ao salvar grupo:', err);
      toast.error('Erro ao salvar grupo');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'operacional': return '#10b981';
      case 'manutencao': return '#f59e0b';
      case 'parado': return '#ef4444';
      case 'alerta': return '#eab308';
      default: return '#6b7280';
    }
  };

  const getProgressColor = (prog: number) => {
    if (prog === 100) return '#10b981'; // green
    if (prog === 0) return '#3b82f6'; // blue
    if (prog > 0 && prog <= 50) return '#f59e0b'; // yellow
    if (prog > 50 && prog < 100) return '#f97316'; // orange
    return '#6b7280';
  };

  const getFilteredHotspots = () => {
    return hotspots.filter((hotspot) => {
      // include group hotspots (they have isGroup and group.members)
      if ((hotspot as any).isGroup) {
        const group = (hotspot as any).group || {};
        // setor filtering based on group.linha
        const setorMatch = filterSetor === 'todos' || (group.linha && group.linha === filterSetor);

        // status filtering: compute average progress of members
        let statusMatch = true;
        if (filterStatus !== 'todos') {
          const members: string[] = (hotspot as any).members || [];
          const memberProgs = members.map((id) => equipments.find((e) => e.id === id)?.progresso ?? 0);
          const avgProg = memberProgs.length ? Math.round(memberProgs.reduce((s, v) => s + v, 0) / memberProgs.length) : 0;
          const status = avgProg >= 100 ? 'operacional' : avgProg >= 50 ? 'manutencao' : avgProg > 0 ? 'alerta' : 'parado';
          statusMatch = status === filterStatus;
        }

        return setorMatch && statusMatch;
      }

      const equipment = equipments.find(eq => eq.id === hotspot.equipamento_id);
      if (!equipment) return false;
      
      const statusMatch = filterStatus === 'todos' || equipment.status === filterStatus;
      const setorMatch = filterSetor === 'todos' || equipment.setor === filterSetor;
      return statusMatch && setorMatch;
    });
  };

  const statusLabels: Record<string, string> = {
    operacional: 'Operacional',
    manutencao: 'Manutenção',
    parado: 'Parado',
    alerta: 'Alerta',
  };

  const filteredCount = getFilteredHotspots().length;

  const handleCustomizeHotspot = () => {
    if (!selectedHotspot) return;
    
    const hotspot = hotspots.find(h => h.id === selectedHotspot);
    if (hotspot) {
      setHotspotColor(hotspot.color || '#10b981');
      setHotspotFontSize(hotspot.fontSize || 14);
      setHotspotIcon(hotspot.icon || 'ri-tools-fill');
      setShowCustomizePanel(true);
    }
  };

  const applyCustomization = async () => {
    if (!selectedHotspot) return;

    const hotspot = hotspots.find(h => h.id === selectedHotspot);
    if (!hotspot) return;

    const updatedHotspots = hotspots.map(h => {
      if (h.id === selectedHotspot) {
        return {
          ...h,
          color: hotspotColor,
          fontSize: hotspotFontSize,
          icon: hotspotIcon,
        };
      }
      return h;
    });

    setHotspots(updatedHotspots);

    try {
      const hotspotObj = hotspots.find(h => h.id === selectedHotspot);
      if (hotspotObj && ((hotspotObj as any).isGroup || String(hotspotObj.id).startsWith('grp-'))) {
        const gid = String(hotspotObj.id).replace(/^grp-/, '');
        await grupoEquipamentosAPI.update(gid, {
          color: hotspotColor,
          font_size: hotspotFontSize,
          icon: hotspotIcon,
        });
      } else {
        await mapa.updateHotspot(selectedHotspot, {
          color: hotspotColor,
          fontSize: hotspotFontSize,
          icon: hotspotIcon,
        });
      }
      setShowCustomizePanel(false);
      // hook will reload and sync
    } catch (err) {
      console.error('Erro ao salvar customização:', err);
      toast.error('Erro ao salvar customização');
    }
  };

  const handleSizeChange = async (delta: number) => {
    if (!selectedHotspot) return;

    const hotspot = hotspots.find(h => h.id === selectedHotspot);
    if (!hotspot) return;

    const newWidth = Math.max(3, Math.min(30, hotspot.width + delta));
    const newHeight = Math.max(3, Math.min(30, hotspot.height + delta));

    const updatedHotspots = hotspots.map(h => {
      if (h.id === selectedHotspot) {
        return {
          ...h,
          width: newWidth,
          height: newHeight,
        };
      }
      return h;
    });

    setHotspots(updatedHotspots);

    // Salvar imediatamente
    try {
      const hotspotObj = hotspots.find(h => h.id === selectedHotspot);
      if (hotspotObj && ((hotspotObj as any).isGroup || String(hotspotObj.id).startsWith('grp-'))) {
        const gid = String(hotspotObj.id).replace(/^grp-/, '');
        await grupoEquipamentosAPI.update(gid, {
          width: newWidth,
          height: newHeight,
        });
      } else {
        await mapa.updateHotspot(selectedHotspot, {
          width: newWidth,
          height: newHeight,
        });
      }
      // success toast from hook
    } catch (err) {
      console.error('Erro ao salvar tamanho:', err);
      toast.error('Erro ao salvar tamanho');
    }
  };

  const handleCircleSizeChange = async (delta: number) => {
    if (!selectedHotspot) return;

    const hotspot = hotspots.find(h => h.id === selectedHotspot);
    if (!hotspot) return;

    const newFontSize = Math.max(8, Math.min(20, (hotspot.fontSize || 14) + delta));

    const updatedHotspots = hotspots.map(h => {
      if (h.id === selectedHotspot) {
        return {
          ...h,
          fontSize: newFontSize,
        };
      }
      return h;
    });

    setHotspots(updatedHotspots);

    // Salvar imediatamente
    try {
      const hotspotObj = hotspots.find(h => h.id === selectedHotspot);
      if (hotspotObj && ((hotspotObj as any).isGroup || String(hotspotObj.id).startsWith('grp-'))) {
        const gid = String(hotspotObj.id).replace(/^grp-/, '');
        await grupoEquipamentosAPI.update(gid, {
          font_size: newFontSize,
        });
      } else {
        await mapa.updateHotspot(selectedHotspot, {
          fontSize: newFontSize,
        });
      }
      // success toast from hook
    } catch (err) {
      console.error('Erro ao salvar tamanho da fonte:', err);
      toast.error('Erro ao salvar tamanho da fonte');
    }
  };

  const handleSaveAndExit = async () => {
    // Salvar todos os hotspots antes de sair do modo edição
    try {
      const savePromises = hotspots.map(async (hotspot) => {
        if ((hotspot as any).isGroup || String(hotspot.id).startsWith('grp-')) {
          const gid = String(hotspot.id).replace(/^grp-/, '');
          await grupoEquipamentosAPI.update(gid, {
            x: hotspot.x,
            y: hotspot.y,
            width: hotspot.width,
            height: hotspot.height,
            color: hotspot.color,
            font_size: hotspot.fontSize,
            icon: hotspot.icon,
          });
        } else {
          await mapa.updateHotspot(hotspot.id, {
            x: hotspot.x,
            y: hotspot.y,
            width: hotspot.width,
            height: hotspot.height,
            color: hotspot.color,
            fontSize: hotspot.fontSize,
            icon: hotspot.icon,
          });
        }
      });

      await Promise.all(savePromises);

      // hook will reload and sync
      setEditMode(false);
      setSelectedHotspot(null);
      toast.success('Alterações salvas com sucesso!');
    } catch (err) {
      console.error('Erro ao salvar hotspots:', err);
      toast.error('Erro ao salvar as alterações. Tente novamente.');
    }
  };

  const downloadMapImage = async () => {
    try {
      let url = mapImage;
      // try localStorage if mapImage empty
      if (!url) {
        try { url = localStorage.getItem('map_image') || ''; } catch (e) { url = ''; }
      }

      if (!url) {
        toast.error('Nenhuma imagem do mapa disponível para download');
        return;
      }

      if (url.startsWith('data:')) {
        const a = document.createElement('a');
        a.href = url;
        a.download = 'mapa.jpg';
        document.body.appendChild(a);
        a.click();
        a.remove();
        toast.success('Download iniciado');
        return;
      }

      // remote URL: fetch blob and download
      const resp = await fetch(url);
      if (!resp.ok) {
        toast.error('Falha ao baixar a imagem remota');
        return;
      }
      const blob = await resp.blob();
      const objUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = objUrl;
      a.download = 'mapa.jpg';
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(objUrl);
      toast.success('Download iniciado');
    } catch (err) {
      console.error('Erro ao baixar imagem:', err);
      toast.error('Erro ao baixar a imagem do mapa');
    }
  };

  return (
    <div className={`min-h-screen ${darkMode ? 'bg-slate-900' : 'bg-gray-100'} transition-colors duration-300`}>
      <Sidebar isOpen={sidebarOpen} onToggle={toggleSidebar} darkMode={darkMode} />

      <div className={`transition-all duration-300 ${sidebarOpen ? 'ml-64' : 'ml-20'}`}>
        <TopBar darkMode={darkMode} setDarkMode={setDarkMode} />

        <main className="p-6">
          {/* Header with controls (title left, controls right) */}
          <div className="mb-4 flex items-start justify-between gap-4">
            <div>
              <h1 className={`text-3xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                Mapa Industrial Interativo
              </h1>
              <p className={`mt-1 text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                Visualização em tempo real dos equipamentos • {filteredCount} equipamentos exibidos
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={editMode ? handleSaveAndExit : () => setEditMode(true)}
                title={editMode ? 'Salvar e Sair' : 'Modo Edição'}
                aria-label={editMode ? 'Salvar e Sair' : 'Modo Edição'}
                className={`w-10 h-10 flex items-center justify-center rounded-md transition-all cursor-pointer text-white ${
                  editMode ? 'bg-red-600 hover:bg-red-700' : 'bg-blue-600 hover:bg-blue-700'
                }`}
              >
                <i className={`${editMode ? 'ri-save-line' : 'ri-edit-line'} text-lg`}></i>
              </button>

              {editMode && (
                <>
                  <button
                    onClick={() => setShowAddHotspot(true)}
                    title="Adicionar Hotspot"
                    aria-label="Adicionar Hotspot"
                    className="w-10 h-10 flex items-center justify-center bg-green-600 text-white rounded-md hover:bg-green-700 transition-all"
                  >
                    <i className="ri-add-line"></i>
                  </button>

                  {selectedHotspot && (
                    <>
                      <button
                        onClick={handleCustomizeHotspot}
                        title="Personalizar Hotspot"
                        aria-label="Personalizar Hotspot"
                        className="w-10 h-10 flex items-center justify-center bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-all"
                      >
                        <i className="ri-palette-line"></i>
                      </button>

                      <div className="flex items-center gap-1 bg-slate-800 rounded-md px-2 py-1">
                        <button
                          onClick={() => handleSizeChange(-1)}
                          className="w-8 h-8 flex items-center justify-center bg-slate-700 text-white rounded hover:bg-slate-600 cursor-pointer"
                          title="Diminuir área"
                        >
                          <i className="ri-subtract-line"></i>
                        </button>
                        <button
                          onClick={() => handleSizeChange(1)}
                          className="w-8 h-8 flex items-center justify-center bg-slate-700 text-white rounded hover:bg-slate-600 cursor-pointer"
                          title="Aumentar área"
                        >
                          <i className="ri-add-line"></i>
                        </button>
                      </div>

                      <div className="flex items-center gap-1 bg-slate-800 rounded-md px-2 py-1">
                        <button
                          onClick={() => handleCircleSizeChange(-2)}
                          className="w-8 h-8 flex items-center justify-center bg-slate-700 text-white rounded hover:bg-slate-600 cursor-pointer"
                          title="Diminuir círculo"
                        >
                          <i className="ri-subtract-line"></i>
                        </button>
                        <button
                          onClick={() => handleCircleSizeChange(2)}
                          className="w-8 h-8 flex items-center justify-center bg-slate-700 text-white rounded hover:bg-slate-600 cursor-pointer"
                          title="Aumentar círculo"
                        >
                          <i className="ri-add-line"></i>
                        </button>
                      </div>
                    </>
                  )}
                </>
              )}

              <button
                onClick={() => setShowImageUpload(true)}
                title="Alterar Imagem"
                aria-label="Alterar Imagem"
                className="w-10 h-10 flex items-center justify-center bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-all"
              >
                <i className="ri-image-add-line"></i>
              </button>

              {/* Download map (if image saved locally or remote) */}
              <button
                onClick={downloadMapImage}
                title="Baixar Imagem do Mapa"
                aria-label="Baixar Imagem do Mapa"
                className="w-10 h-10 flex items-center justify-center bg-emerald-600 text-white rounded-md hover:bg-emerald-700 transition-all"
              >
                <i className="ri-download-line"></i>
              </button>

              <button
                onClick={openCreateGroupModal}
                title="Novo Grupo"
                aria-label="Novo Grupo"
                className="w-10 h-10 flex items-center justify-center bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-all"
              >
                <i className="ri-group-line"></i>
              </button>

              <button
                onClick={async () => {
                  if (!confirm('Recalibrar posições de todos os hotspots para a imagem atual? Isso atualizará os valores no banco.')) return;
                  if (!imageRef.current || !mapRef.current) {
                    toast.error('Imagem ou área do mapa não disponíveis para recalibragem');
                    return;
                  }
                  try {
                    toast.info('Recalibrando hotspots...');
                    const imgR = imageRef.current.getBoundingClientRect();
                    const containerR = mapRef.current.getBoundingClientRect();
                    const imgOffsetX = imgR.left - containerR.left;
                    const imgOffsetY = imgR.top - containerR.top;

                    const promises = hotspots.map(async (h: any) => {
                      const el = document.querySelector(`[data-hotspot-id="${h.id}"]`) as HTMLElement | null;
                      if (!el) return null;
                      const r = el.getBoundingClientRect();
                      const centerX = r.left - containerR.left + r.width / 2;
                      const centerY = r.top - containerR.top + r.height / 2;
                      const newX = ((centerX - imgOffsetX) / imgR.width) * 100;
                      const newY = ((centerY - imgOffsetY) / imgR.height) * 100;
                      const newW = (r.width / imgR.width) * 100;
                      const newH = (r.height / imgR.height) * 100;

                      // clamp
                      const clamped = {
                        x: Math.max(0, Math.min(100, newX)),
                        y: Math.max(0, Math.min(100, newY)),
                        width: Math.max(1, Math.min(100, newW)),
                        height: Math.max(1, Math.min(100, newH)),
                      };

                      try {
                        await mapa.updateHotspot(h.id, {
                          x: clamped.x,
                          y: clamped.y,
                          width: clamped.width,
                          height: clamped.height,
                        });
                        return { id: h.id, ...clamped };
                      } catch (err) {
                        console.error('Erro ao recalibrar hotspot', h.id, err);
                        return null;
                      }
                    });

                    const results = await Promise.all(promises);
                    const updated = hotspots.map((h) => {
                      const res = results.find(r => r && r.id === h.id);
                      return res ? { ...h, x: res.x, y: res.y, width: res.width, height: res.height } : h;
                    });
                    setHotspots(updated as Hotspot[]);
                    toast.success('Recalibração concluída');
                  } catch (err) {
                    console.error('Erro na recalibração:', err);
                    toast.error('Falha ao recalibrar hotspots');
                  }
                }}
                title="Recalibrar Hotspots"
                aria-label="Recalibrar Hotspots"
                className="w-10 h-10 flex items-center justify-center bg-yellow-600 text-white rounded-md hover:bg-yellow-700 transition-all"
              >
                <i className="ri-refresh-line"></i>
              </button>

              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className={`text-sm px-2 py-1 pr-6 rounded-md border ${
                  darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-gray-300 text-gray-900'
                } focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer`}
              >
                <option value="todos">Todos os Status</option>
                <option value="operacional">Operacional</option>
                <option value="manutencao">Manutenção</option>
                <option value="parado">Parado</option>
                <option value="alerta">Alerta</option>
              </select>

              <select
                value={filterSetor}
                onChange={(e) => setFilterSetor(e.target.value)}
                className={`text-sm px-2 py-1 pr-6 rounded-md border ${
                  darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-gray-300 text-gray-900'
                } focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer`}
              >
                <option value="todos">Todos os Setores</option>
                {setores.map((setor) => (
                  <option key={setor} value={setor}>{setor}</option>
                ))}
              </select>
            </div>
          </div>

          {/* empty spacer removed - header is integrated with controls above */}

          {/* Legend removed as requested */}

          {/* Loading */}
          {loading && (
            <div className="-mx-6">
              <div className={`rounded-xl overflow-hidden ${darkMode ? 'bg-slate-800' : 'bg-white'} shadow-xl flex items-center justify-center`} style={{ height: 'calc(100vh - 100px)' }}>
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
                  <p className={darkMode ? 'text-gray-400' : 'text-gray-600'}>Carregando mapa...</p>
                </div>
              </div>
            </div>
          )}

          {/* Mapa Interativo - TELA CHEIA */}
          {!loading && (
            <div className="-mx-6">
              <div 
                ref={mapRef}
                className={`rounded-xl overflow-hidden ${darkMode ? 'bg-slate-800' : 'bg-white'} shadow-xl relative ${editMode ? 'cursor-crosshair' : 'cursor-default'}`} 
                style={{ height: 'calc(100vh - 100px)' }}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
              >
                {mapImage ? (
                <>
                <img 
                  ref={imageRef}
                  onLoad={() => {
                    if (mapRef.current && imageRef.current) {
                      setContainerRect(mapRef.current.getBoundingClientRect());
                      setImgRect(imageRef.current.getBoundingClientRect());
                    }
                  }}
                  src={mapImage} 
                  alt="Mapa Industrial" 
                  className="w-full h-full object-contain pointer-events-none"
                />
                {/* Overlay positioned exactly over the displayed image area. Hotspots rendered inside as percentages. */}
                {imgRect && containerRect && (
                  <div
                    className="absolute"
                    style={{
                      left: `${imgRect.left - containerRect.left}px`,
                      top: `${imgRect.top - containerRect.top}px`,
                      width: `${imgRect.width}px`,
                      height: `${imgRect.height}px`,
                      pointerEvents: 'none'
                    }}
                  >
                    {/* Hotspots rendered relative to overlay using percentages */}
                    {getFilteredHotspots().map((hotspot: any) => {
                      const isGroup = !!hotspot.isGroup;
                      let equipment: any = null;
                      if (!isGroup) equipment = equipments.find((eq) => eq.id === hotspot.equipamento_id);

                      if (isGroup) {
                        const group = hotspot.group || {};
                        const members: string[] = hotspot.members || [];
                        const memberProgs = members.map((id) => equipments.find((e) => e.id === id)?.progresso ?? 0);
                        const avgProg = memberProgs.length ? Math.round(memberProgs.reduce((s, v) => s + v, 0) / memberProgs.length) : 0;
                        equipment = {
                          nome: group.nome || `Grupo ${group.id}`,
                          setor: group.linha || 'Grupo',
                          progresso: avgProg,
                          criticidade: null,
                        };
                      }

                      if (!equipment) return null;

                      const prog = equipment.progresso ?? 0;
                      const hotspotColor = getProgressColor(prog);
                      const fontSize = hotspot.fontSize || 14;
                      const iconClass = hotspot.icon || 'ri-tools-fill';
                      const circleSize = fontSize * 4;

                      // Use percent positions relative to overlay container
                      const stylePos: any = {
                        left: `${hotspot.x}%`,
                        top: `${hotspot.y}%`,
                        width: `${hotspot.width}%`,
                        height: `${hotspot.height}%`,
                        pointerEvents: editMode ? 'auto' : 'auto'
                      };

                      return (
                        <div
                          key={hotspot.id}
                          data-hotspot-id={hotspot.id}
                          className={`absolute group ${editMode ? 'cursor-move' : 'cursor-pointer'} ${
                            selectedHotspot === hotspot.id ? 'ring-4 ring-blue-500' : ''
                          }`}
                          style={{
                            ...stylePos
                          }}
                          onMouseDown={(e) => handleMouseDown(e, hotspot.id)}
                          onClick={() => !editMode && handleHotspotClick(hotspot)}
                        >
                          <div
                            className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 rounded-full flex flex-col items-center justify-center shadow-lg transition-transform group-hover:scale-125"
                            style={{
                              backgroundColor: hotspotColor,
                              width: `${circleSize}px`,
                              height: `${circleSize}px`,
                              pointerEvents: 'none'
                            }}
                          >
                            <i className={`${iconClass} text-white mb-1`} style={{ fontSize: `${fontSize + 4}px` }}></i>
                            <span className="text-white font-bold" style={{ fontSize: `${fontSize - 2}px` }}>
                              {equipment.progresso}%
                            </span>
                          </div>

                          {!editMode && (
                            <div
                              className={`absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 rounded-lg shadow-xl opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10 ${
                                darkMode ? 'bg-slate-900 text-white' : 'bg-white text-gray-900'
                              } border ${darkMode ? 'border-slate-700' : 'border-gray-200'}`}
                            >
                              <div className="font-bold"><EquipamentoName equipamento={equipment} numberClassName="text-amber-300" /></div>
                              <div className="text-sm">{equipment.setor}</div>
                              <div className="text-xs">Revisão: {equipment.progresso}%</div>
                            </div>
                          )}

                          {(equipment.criticidade?.toLowerCase() === 'critica' || equipment.criticidade?.toLowerCase() === 'crítica') && (
                            <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center">
                              <i className="ri-alert-fill text-white text-xs"></i>
                            </div>
                          )}

                          {editMode && selectedHotspot === hotspot.id && (
                            <>
                              <div
                                className="absolute bottom-0 right-0 w-4 h-4 bg-blue-500 cursor-se-resize"
                                onMouseDown={(e) => handleMouseDown(e, hotspot.id, true)}
                              ></div>

                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteHotspot(hotspot.id);
                                }}
                                className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 cursor-pointer"
                              >
                                <i className="ri-close-line text-xs"></i>
                              </button>
                            </>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
                </>
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-slate-700/30">
                  <div className="text-center">
                    <i className="ri-map-pin-line text-5xl text-gray-400 mb-3"></i>
                    <p className="text-gray-300">Nenhuma imagem do mapa. Faça upload em "Alterar Imagem".</p>
                  </div>
                </div>
              )}
              
              {/* Hotspots Overlay */}
              {getFilteredHotspots().map((hotspot: any) => {
                const isGroup = !!hotspot.isGroup;
                let equipment: any = null;
                if (!isGroup) equipment = equipments.find((eq) => eq.id === hotspot.equipamento_id);

                // for group hotspots, synthesize equipment-like data using group info and members
                if (isGroup) {
                  const group = hotspot.group || {};
                  const members: string[] = hotspot.members || [];
                  const memberProgs = members.map((id) => equipments.find((e) => e.id === id)?.progresso ?? 0);
                  const avgProg = memberProgs.length ? Math.round(memberProgs.reduce((s, v) => s + v, 0) / memberProgs.length) : 0;
                  equipment = {
                    nome: group.nome || `Grupo ${group.id}`,
                    setor: group.linha || 'Grupo',
                    progresso: avgProg,
                    criticidade: null,
                  };
                }

                if (!equipment) return null;

                // Color must follow progress rules: 0% blue, started yellow, >50% orange, 100% green
                const prog = equipment.progresso ?? 0;
                const hotspotColor = getProgressColor(prog);
                const fontSize = hotspot.fontSize || 14;
                const iconClass = hotspot.icon || 'ri-tools-fill';
                const circleSize = fontSize * 4;

                // compute absolute positions relative to displayed image area to avoid drift when container resizes
                const stylePos: any = {};
                if (imgRect && containerRect) {
                  const imgOffsetX = imgRect.left - containerRect.left;
                  const imgOffsetY = imgRect.top - containerRect.top;
                  const widthPx = (hotspot.width / 100) * imgRect.width;
                  const heightPx = (hotspot.height / 100) * imgRect.height;
                  // position by center so the hotspot anchor remains centered on the intended point
                  const centerX = imgOffsetX + (hotspot.x / 100) * imgRect.width;
                  const centerY = imgOffsetY + (hotspot.y / 100) * imgRect.height;
                  const leftPx = centerX - widthPx / 2;
                  const topPx = centerY - heightPx / 2;
                  stylePos.left = `${leftPx}px`;
                  stylePos.top = `${topPx}px`;
                  stylePos.width = `${widthPx}px`;
                  stylePos.height = `${heightPx}px`;
                } else {
                  stylePos.left = `${hotspot.x}%`;
                  stylePos.top = `${hotspot.y}%`;
                  stylePos.width = `${hotspot.width}%`;
                  stylePos.height = `${hotspot.height}%`;
                }

                return (
                  <div
                    key={hotspot.id}
                    data-hotspot-id={hotspot.id}
                    className={`absolute group ${editMode ? 'cursor-move' : 'cursor-pointer'} ${
                      selectedHotspot === hotspot.id ? 'ring-4 ring-blue-500' : ''
                    }`}
                    style={{
                      ...stylePos,
                      backgroundColor: editMode ? 'rgba(59, 130, 246, 0.3)' : 'transparent',
                      border: editMode ? '2px dashed #3b82f6' : 'none',
                    }}
                    onMouseDown={(e) => handleMouseDown(e, hotspot.id)}
                    onClick={() => !editMode && handleHotspotClick(hotspot)}
                  >
                    {/* Indicador de Status com Ícone */}
                    <div
                      className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 rounded-full flex flex-col items-center justify-center shadow-lg transition-transform group-hover:scale-125"
                      style={{
                        backgroundColor: hotspotColor,
                        width: `${circleSize}px`,
                        height: `${circleSize}px`,
                      }}
                    >
                      <i className={`${iconClass} text-white mb-1`} style={{ fontSize: `${fontSize + 4}px` }}></i>
                      <span className="text-white font-bold" style={{ fontSize: `${fontSize - 2}px` }}>
                        {equipment.progresso}%
                      </span>
                    </div>

                    {/* Tooltip ao passar o mouse */}
                    {!editMode && (
                      <div
                        className={`absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 rounded-lg shadow-xl opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10 ${
                          darkMode ? 'bg-slate-900 text-white' : 'bg-white text-gray-900'
                        } border ${darkMode ? 'border-slate-700' : 'border-gray-200'}`}
                      >
                        <div className="font-bold"><EquipamentoName equipamento={equipment} numberClassName="text-amber-300" /></div>
                        <div className="text-sm">{equipment.setor}</div>
                        <div className="text-xs">Revisão: {equipment.progresso}%</div>
                      </div>
                    )}

                    {/* Ícone de criticidade */}
                    {(equipment.criticidade?.toLowerCase() === 'critica' || equipment.criticidade?.toLowerCase() === 'crítica') && (
                      <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center">
                        <i className="ri-alert-fill text-white text-xs"></i>
                      </div>
                    )}

                    {/* Controles de edição */}
                    {editMode && selectedHotspot === hotspot.id && (
                      <>
                        {/* Resize handle */}
                        <div
                          className="absolute bottom-0 right-0 w-4 h-4 bg-blue-500 cursor-se-resize"
                          onMouseDown={(e) => handleMouseDown(e, hotspot.id, true)}
                        ></div>

                        {/* Delete button */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteHotspot(hotspot.id);
                          }}
                          className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 cursor-pointer"
                        >
                          <i className="ri-close-line text-xs"></i>
                        </button>
                      </>
                    )}
                  </div>
                );
              })}
              </div>
            </div>
          )}

            {/* Group Edit/Create Modal */}
            {showGroupModal && (
              <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowGroupModal(false)}>
                <div className={`${darkMode ? 'bg-slate-800' : 'bg-white'} rounded-xl p-6 w-full max-w-2xl`} onClick={(e) => e.stopPropagation()}>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{editingGroup ? 'Editar Grupo' : 'Criar Grupo'}</h3>
                    <button onClick={() => setShowGroupModal(false)} className={`w-8 h-8 rounded flex items-center justify-center ${darkMode ? 'hover:bg-slate-700' : 'hover:bg-gray-100'}`}>
                      <i className={`ri-close-line ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}></i>
                    </button>
                  </div>

                  <div className="space-y-4 max-h-[70vh] overflow-y-auto">
                    <div>
                      <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Nome</label>
                      <input type="text" value={groupForm.nome} onChange={(e) => setGroupForm((s: any) => ({ ...s, nome: e.target.value }))} className={`w-full px-4 py-2 rounded-lg border ${darkMode ? 'bg-slate-700 border-slate-600 text-white' : 'bg-white border-gray-300 text-gray-900'}`} />
                    </div>

                    <div>
                      <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Linha</label>
                      <input type="text" value={groupForm.linha} onChange={(e) => setGroupForm((s: any) => ({ ...s, linha: e.target.value }))} className={`w-full px-4 py-2 rounded-lg border ${darkMode ? 'bg-slate-700 border-slate-600 text-white' : 'bg-white border-gray-300 text-gray-900'}`} />
                    </div>

                    <div className="grid grid-cols-4 gap-2">
                      <div>
                        <label className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>X (%)</label>
                        <input type="number" value={groupForm.x} onChange={(e) => setGroupForm((s: any) => ({ ...s, x: Number(e.target.value) }))} className="w-full px-3 py-2 rounded-lg" />
                      </div>
                      <div>
                        <label className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Y (%)</label>
                        <input type="number" value={groupForm.y} onChange={(e) => setGroupForm((s: any) => ({ ...s, y: Number(e.target.value) }))} className="w-full px-3 py-2 rounded-lg" />
                      </div>
                      <div>
                        <label className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>W (%)</label>
                        <input type="number" value={groupForm.width} onChange={(e) => setGroupForm((s: any) => ({ ...s, width: Number(e.target.value) }))} className="w-full px-3 py-2 rounded-lg" />
                      </div>
                      <div>
                        <label className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>H (%)</label>
                        <input type="number" value={groupForm.height} onChange={(e) => setGroupForm((s: any) => ({ ...s, height: Number(e.target.value) }))} className="w-full px-3 py-2 rounded-lg" />
                      </div>
                    </div>

                    <div>
                      <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Cor</label>
                      <input type="color" value={groupForm.color} onChange={(e) => setGroupForm((s: any) => ({ ...s, color: e.target.value }))} className="w-16 h-10 p-0" />
                      <p className={`text-xs mt-2 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                        X/Y/W/H são porcentagens relativas à largura/altura da imagem do mapa (0-100%). Cor define a cor do indicador do hotspot.
                      </p>
                    </div>

                    <div>
                      <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Membros (equipamentos)</label>
                      <div className="flex gap-2 mb-2">
                        <input
                          type="text"
                          placeholder="Pesquisar por nome ou IND (codigo_interno)"
                          value={groupSearch}
                          onChange={(e) => setGroupSearch(e.target.value)}
                          className={`flex-1 px-3 py-2 rounded-lg border ${darkMode ? 'bg-slate-700 border-slate-600 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
                        />
                        <select
                          value={groupForm.linha}
                          onChange={(e) => setGroupForm((s: any) => ({ ...s, linha: e.target.value }))}
                          className={`w-40 px-3 py-2 rounded-lg border ${darkMode ? 'bg-slate-700 border-slate-600 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
                        >
                          <option value="">Todas as Linhas</option>
                          {Array.from(new Set(equipments.map(eq => eq.setor))).map((ln) => (
                            <option key={ln} value={ln}>{ln}</option>
                          ))}
                        </select>
                      </div>

                      <div className="mt-2 max-h-48 overflow-y-auto p-2 rounded border">
                        {equipments
                          .filter((eq) => {
                            // filter by selected linha (using eq.setor as linha field)
                            if (groupForm.linha && eq.setor !== groupForm.linha) return false;
                            // filter by search term (name or codigo_interno)
                            if (!groupSearch) return true;
                            const term = groupSearch.toLowerCase();
                            return (eq.nome || '').toLowerCase().includes(term) || (eq.codigo_interno || '').toLowerCase().includes(term);
                          })
                          .map((eq) => (
                          <label key={eq.id} className={`flex items-center gap-2 cursor-pointer p-1 rounded ${darkMode ? 'hover:bg-slate-700' : 'hover:bg-gray-50'}`}>
                            <input type="checkbox" checked={groupForm.members?.includes(eq.id)} onChange={(e) => {
                              if (e.target.checked) setGroupForm((s: any) => ({ ...s, members: [...(s.members||[]), eq.id] }));
                              else setGroupForm((s: any) => ({ ...s, members: (s.members||[]).filter((id: string) => id !== eq.id) }));
                            }} />
                            <div>
                              <div className={`${darkMode ? 'text-gray-200' : 'text-gray-900'} font-medium`}><EquipamentoName equipamento={eq} numberClassName="text-amber-300" /></div>
                              <div className="text-xs text-gray-400">IND: {eq.codigo_interno || eq.id.slice(0,8)} • {eq.setor}</div>
                            </div>
                          </label>
                        ))}
                        {equipments.length === 0 && <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Nenhum equipamento disponível</p>}
                      </div>
                    </div>

                    <div className="flex gap-3 pt-4">
                      <button onClick={() => setShowGroupModal(false)} className={`flex-1 px-4 py-2 rounded-lg ${darkMode ? 'bg-slate-700 text-white hover:bg-slate-600' : 'bg-gray-200 text-gray-900 hover:bg-gray-300'}`}>Cancelar</button>
                      <button onClick={saveGroup} className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Salvar</button>
                    </div>
                  </div>
                </div>
              </div>
            )}

          {/* Modal de Upload de Imagem */}
          {showImageUpload && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowImageUpload(false)}>
              <div className={`${darkMode ? 'bg-slate-800' : 'bg-white'} rounded-xl p-6 w-full max-w-md`} onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center justify-between mb-6">
                  <h3 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                    Alterar Imagem do Mapa
                  </h3>
                  <button
                    onClick={() => setShowImageUpload(false)}
                    className={`w-8 h-8 flex items-center justify-center rounded-lg cursor-pointer ${
                      darkMode ? 'hover:bg-slate-700' : 'hover:bg-gray-100'
                    }`}
                  >
                    <i className={`ri-close-line ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}></i>
                  </button>
                </div>

                <div className="space-y-4">
                  <div className="border-2 border-dashed rounded-lg p-8 text-center" style={{ borderColor: darkMode ? '#475569' : '#d1d5db' }}>
                    <i className={`ri-image-add-line text-5xl mb-4 ${darkMode ? 'text-gray-400' : 'text-gray-300'}`}></i>
                    <p className={`mb-4 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      Faça upload da imagem do seu mapa industrial
                    </p>
                    <label className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 cursor-pointer inline-block whitespace-nowrap">
                      <i className="ri-upload-2-line mr-2"></i>
                      Selecionar Imagem
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="hidden"
                      />
                    </label>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Modal Adicionar Hotspot */}
          {showAddHotspot && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowAddHotspot(false)}>
              <div className={`${darkMode ? 'bg-slate-800' : 'bg-white'} rounded-xl p-6 w-full max-w-md`} onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center justify-between mb-6">
                  <h3 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                    Adicionar Hotspot
                  </h3>
                  <button
                    onClick={() => setShowAddHotspot(false)}
                    className={`w-8 h-8 flex items-center justify-center rounded-lg cursor-pointer ${
                      darkMode ? 'hover:bg-slate-700' : 'hover:bg-gray-100'
                    }`}
                  >
                    <i className={`ri-close-line ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}></i>
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      Selecione o Equipamento
                    </label>
                    <select
                      value={selectedEquipmentForHotspot}
                      onChange={(e) => setSelectedEquipmentForHotspot(e.target.value)}
                      className={`w-full px-4 py-2 pr-8 rounded-lg border ${
                        darkMode 
                          ? 'bg-slate-700 border-slate-600 text-white' 
                          : 'bg-white border-gray-300 text-gray-900'
                      } focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer`}
                    >
                      <option value="">Selecione...</option>
                      {equipments.map((eq) => (
                        <option key={eq.id} value={eq.id}>
                          {formatEquipamentoName(eq)} - {eq.setor}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={() => setShowAddHotspot(false)}
                      className={`flex-1 px-4 py-2 rounded-lg border whitespace-nowrap cursor-pointer ${
                        darkMode 
                          ? 'border-slate-600 text-gray-300 hover:bg-slate-700' 
                          : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={handleAddHotspot}
                      disabled={!selectedEquipmentForHotspot}
                      className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap cursor-pointer"
                    >
                      Adicionar
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Modal de Personalização */}
          {showCustomizePanel && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowCustomizePanel(false)}>
              <div className={`${darkMode ? 'bg-slate-800' : 'bg-white'} rounded-xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto`} onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center justify-between mb-6">
                  <h3 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                    Personalizar Hotspot
                  </h3>
                  <button
                    onClick={() => setShowCustomizePanel(false)}
                    className={`w-8 h-8 flex items-center justify-center rounded-lg cursor-pointer ${
                      darkMode ? 'hover:bg-slate-700' : 'hover:bg-gray-100'
                    }`}
                  >
                    <i className={`ri-close-line ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}></i>
                  </button>
                </div>

                <div className="space-y-6">
                  {/* Ícone */}
                  <div>
                    <label className={`block text-sm font-medium mb-3 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      Ícone do Equipamento
                    </label>
                    <div className="grid grid-cols-5 gap-3">
                      {[
                        { icon: 'ri-tools-fill', label: 'Ferramentas' },
                        { icon: 'ri-settings-5-fill', label: 'Engrenagem' },
                        { icon: 'ri-cpu-fill', label: 'CPU' },
                        { icon: 'ri-flashlight-fill', label: 'Energia' },
                        { icon: 'ri-fire-fill', label: 'Fogo' },
                        { icon: 'ri-water-flash-fill', label: 'Água' },
                        { icon: 'ri-temp-hot-fill', label: 'Temperatura' },
                        { icon: 'ri-oil-fill', label: 'Óleo' },
                        { icon: 'ri-arrow-right-circle-fill', label: 'Seta' },
                        { icon: 'ri-map-pin-fill', label: 'Pin' },
                        { icon: 'ri-focus-3-fill', label: 'Alvo' },
                        { icon: 'ri-radar-fill', label: 'Radar' },
                        { icon: 'ri-dashboard-fill', label: 'Dashboard' },
                        { icon: 'ri-speed-fill', label: 'Velocidade' },
                        { icon: 'ri-plug-fill', label: 'Plug' },
                      ].map((item) => (
                        <button
                          key={item.icon}
                          onClick={() => setHotspotIcon(item.icon)}
                          className={`w-12 h-12 rounded-lg flex items-center justify-center cursor-pointer transition-all ${
                            hotspotIcon === item.icon 
                              ? 'bg-blue-600 text-white ring-4 ring-blue-500 scale-110' 
                              : darkMode 
                                ? 'bg-slate-700 text-gray-300 hover:bg-slate-600' 
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }`}
                          title={item.label}
                        >
                          <i className={`${item.icon} text-xl`}></i>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Cor */}
                  <div>
                    <label className={`block text-sm font-medium mb-3 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      Cor do Indicador
                    </label>
                    <div className="grid grid-cols-5 gap-3">
                      {['#10b981', '#3b82f6', '#8b5cf6', '#f59e0b', '#ef4444', '#ec4899', '#14b8a6', '#f97316', '#6366f1', '#84cc16'].map((color) => (
                        <button
                          key={color}
                          onClick={() => setHotspotColor(color)}
                          className={`w-12 h-12 rounded-lg cursor-pointer transition-all ${
                            hotspotColor === color ? 'ring-4 ring-blue-500 scale-110' : 'hover:scale-105'
                          }`}
                          style={{ backgroundColor: color }}
                        />
                      ))}
                    </div>
                    <div className="mt-3 flex items-center gap-2">
                      <input
                        type="color"
                        value={hotspotColor}
                        onChange={(e) => setHotspotColor(e.target.value)}
                        className="w-12 h-12 rounded-lg cursor-pointer"
                      />
                      <input
                        type="text"
                        value={hotspotColor}
                        onChange={(e) => setHotspotColor(e.target.value)}
                        className={`flex-1 px-3 py-2 rounded-lg border ${
                          darkMode 
                            ? 'bg-slate-700 border-slate-600 text-white' 
                            : 'bg-white border-gray-300 text-gray-900'
                        } focus:outline-none focus:ring-2 focus:ring-blue-500`}
                      />
                    </div>
                  </div>

                  {/* Tamanho da Fonte */}
                  <div>
                    <label className={`block text-sm font-medium mb-3 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      Tamanho da Fonte: {hotspotFontSize}px
                    </label>
                    <input
                      type="range"
                      min="10"
                      max="24"
                      value={hotspotFontSize}
                      onChange={(e) => setHotspotFontSize(Number(e.target.value))}
                      className="w-full cursor-pointer"
                    />
                    <div className="flex justify-between text-xs mt-1">
                      <span className={darkMode ? 'text-gray-400' : 'text-gray-600'}>10px</span>
                      <span className={darkMode ? 'text-gray-400' : 'text-gray-600'}>24px</span>
                    </div>
                  </div>

                  {/* Preview */}
                  <div>
                    <label className={`block text-sm font-medium mb-3 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      Pré-visualização
                    </label>
                    <div className="flex items-center justify-center p-6 bg-slate-700 rounded-lg">
                      <div 
                        className="rounded-full flex flex-col items-center justify-center shadow-lg"
                        style={{ 
                          backgroundColor: hotspotColor,
                          width: '64px',
                          height: '64px',
                        }}
                      >
                        <i className={`${hotspotIcon} text-white mb-1`} style={{ fontSize: `${hotspotFontSize + 4}px` }}></i>
                        <span className="text-white font-bold text-xs">
                          85%
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Botões */}
                  <div className="flex gap-3">
                    <button
                      onClick={() => setShowCustomizePanel(false)}
                      className={`flex-1 px-4 py-2 rounded-lg border whitespace-nowrap cursor-pointer ${
                        darkMode 
                          ? 'border-slate-600 text-gray-300 hover:bg-slate-700' 
                          : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={applyCustomization}
                      className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 whitespace-nowrap cursor-pointer"
                    >
                      Aplicar
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Equipment Details Panel */}
          {selectedEquipment && !editMode && (
            <div className={`fixed right-6 top-24 w-96 rounded-xl shadow-2xl ${
              darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'
            } border p-6 z-50 max-h-[calc(100vh-120px)] overflow-y-auto`}>
              <div className="flex items-center justify-between mb-4">
                <h3 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  Detalhes do Equipamento
                </h3>
                <div className="flex items-center gap-2">
                  {selectedEquipment.id?.toString().startsWith('grp-') ? (
                    <>
                      <button
                        onClick={() => openEditGroupModal(currentGroup, currentGroupMembers)}
                        className="px-3 py-1 rounded-md bg-indigo-600 text-white hover:bg-indigo-700 text-sm"
                      >
                        Editar Grupo
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={openServiceModalForSelected}
                      className="px-3 py-1 rounded-md bg-emerald-600 text-white hover:bg-emerald-700 text-sm"
                    >
                      Cadastrar Serviço Padrão
                    </button>
                  )}
                  <button
                    onClick={() => {
                      setSelectedEquipment(null);
                      setEquipmentDetails(null);
                      setCurrentGroup(null);
                      setCurrentGroupMembers([]);
                    }}
                    className={`w-8 h-8 rounded-lg flex items-center justify-center cursor-pointer ${
                      darkMode ? 'hover:bg-slate-700' : 'hover:bg-gray-100'
                    }`}
                  >
                    <i className={`ri-close-line ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}></i>
                  </button>
                </div>
              </div>

              {loadingDetails ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
                  <p className={darkMode ? 'text-gray-400' : 'text-gray-600'}>Carregando...</p>
                </div>
              ) : equipmentDetails ? (
                <div className="space-y-4">
                  <div>
                    <label className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Nome</label>
                    <p className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                      {formatEquipamentoName(selectedEquipment)}
                    </p>
                  </div>

                  <div>
                    <label className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Setor</label>
                    <p className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                      {selectedEquipment.setor}
                    </p>
                  </div>

                  <div>
                    <label className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Status</label>
                    <div className="flex items-center gap-2 mt-1">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: getStatusColor(selectedEquipment.status) }}
                      ></div>
                      <span className={`font-medium capitalize ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                        {statusLabels[selectedEquipment.status] || selectedEquipment.status}
                      </span>
                    </div>
                  </div>

                  <div>
                    <label className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Progresso da Revisão</label>
                    <div className="mt-2">
                      <div className="flex items-center justify-between mb-1">
                        <span className={`text-sm font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                          {selectedEquipment.progresso}%
                        </span>
                      </div>
                      <div className={`w-full h-2 rounded-full ${darkMode ? 'bg-slate-700' : 'bg-gray-200'}`}>
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-blue-600 to-purple-600"
                          style={{ width: `${selectedEquipment.progresso}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Custo Acumulado</label>
                    <p className={`font-bold text-lg ${darkMode ? 'text-green-400' : 'text-green-600'}`}>
                      R$ {equipmentDetails.custo_total?.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) || '0,00'}
                    </p>
                  </div>

                  <div>
                    <label className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      {selectedEquipment.id?.toString().startsWith('grp-') ? 'Membros do Grupo' : `Componentes (${equipmentDetails.componentes?.length || 0})`}
                    </label>
                    <div className="mt-2 space-y-2 max-h-40 overflow-y-auto">
                      {selectedEquipment.id?.toString().startsWith('grp-') ? (
                        (equipmentDetails.members || []).map((m: any) => (
                          <div key={m.id} className={`p-2 rounded-lg ${darkMode ? 'bg-slate-700' : 'bg-gray-100'}`}>
                            <p className={`text-sm font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>{m.nome}</p>
                            <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Progresso: {m.progresso}% - {m.setor}</p>
                          </div>
                        ))
                      ) : (
                        (equipmentDetails.componentes || []).map((comp: any) => (
                          <div key={comp.id} className={`p-2 rounded-lg ${darkMode ? 'bg-slate-700' : 'bg-gray-100'}`}>
                            <p className={`text-sm font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>{comp.componentes?.nome || 'Sem nome'}</p>
                            <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Qtd: {comp.quantidade || 0}</p>
                          </div>
                        ))
                      )}
                      {(!selectedEquipment.id?.toString().startsWith('grp-') && (!equipmentDetails.componentes || equipmentDetails.componentes.length === 0)) && (
                        <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                          Nenhum componente vinculado
                        </p>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      Ordens de Serviço Recentes
                    </label>
                    <div className="mt-2 space-y-2 max-h-40 overflow-y-auto">
                      {equipmentDetails.ordens_servico?.map((os: any) => (
                        <div key={os.id} className={`p-2 rounded-lg ${darkMode ? 'bg-slate-700' : 'bg-gray-100'}`}>
                          <div className="flex items-center justify-between">
                            <p className={`text-sm font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                              OS #{os.numero_os || os.id.slice(0, 8)}
                            </p>
                            <span className={`text-xs px-2 py-1 rounded ${
                              os.status === 'concluida' ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'
                            }`}>
                              {os.status}
                            </span>
                          </div>
                          <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                            {new Date(os.created_at).toLocaleDateString('pt-BR')}
                          </p>
                        </div>
                      ))}
                      {(!equipmentDetails.ordens_servico || equipmentDetails.ordens_servico.length === 0) && (
                        <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                          Nenhuma OS registrada
                        </p>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      Histórico de Manutenção
                    </label>
                    <div className="mt-2 space-y-2 max-h-40 overflow-y-auto">
                      {equipmentDetails.historico?.map((hist: any) => (
                        <div key={hist.id} className={`p-2 rounded-lg ${darkMode ? 'bg-slate-700' : 'bg-gray-100'}`}>
                          <p className={`text-sm font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                            {hist.tipo_revisao || 'Manutenção'}
                          </p>
                          <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                            {new Date(hist.data_revisao).toLocaleDateString('pt-BR')}
                          </p>
                        </div>
                      ))}
                      {(!equipmentDetails.historico || equipmentDetails.historico.length === 0) && (
                        <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                          Nenhum histórico registrado
                        </p>
                      )}
                    </div>
                  </div>

                  <button
                    onClick={() => navigate(`/equipamento-detalhes?id=${selectedEquipment.id}`)}
                    className="w-full px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all whitespace-nowrap cursor-pointer"
                  >
                    Ver Detalhes Completos
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <label className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Nome</label>
                    <p className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                      {formatEquipamentoName(selectedEquipment)}
                    </p>
                  </div>

                  <div>
                    <label className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Setor</label>
                    <p className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                      {selectedEquipment.setor}
                    </p>
                  </div>

                  <button
                    onClick={() => navigate(`/equipamento-detalhes?id=${selectedEquipment.id}`)}
                    className="w-full px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all whitespace-nowrap cursor-pointer"
                  >
                    Ver Detalhes Completos
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Service modal for adding padrão services to one or many equipments */}
          {showServiceModal && (
            <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
              <div className={`${darkMode ? 'bg-slate-800' : 'bg-white'} rounded-xl w-full max-w-2xl p-6`}> 
                <div className="flex items-center justify-between mb-4">
                  <h4 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Cadastrar Serviço Padrão</h4>
                  <button onClick={() => setShowServiceModal(false)} className={`w-8 h-8 rounded flex items-center justify-center ${darkMode ? 'hover:bg-slate-700' : 'hover:bg-gray-100'}`}>
                    <i className={`ri-close-line ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}></i>
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Nome do Serviço</label>
                    <input type="text" value={serviceName} onChange={(e) => setServiceName(e.target.value)} className={`w-full px-4 py-2 rounded-lg border ${darkMode ? 'bg-slate-700 border-slate-600 text-white' : 'bg-white border-gray-300 text-gray-900'}`} placeholder="Ex: Troca de correia" />
                  </div>

                  <div>
                    <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Descrição (opcional)</label>
                    <textarea value={serviceDesc} onChange={(e) => setServiceDesc(e.target.value)} className={`w-full px-4 py-2 rounded-lg border ${darkMode ? 'bg-slate-700 border-slate-600 text-white' : 'bg-white border-gray-300 text-gray-900'}`} rows={3} />
                  </div>

                  <div>
                    <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Selecionar Equipamentos</label>
                    <div className="mt-2 max-h-48 overflow-y-auto space-y-2 p-2 rounded border">
                      {equipments.map((eq) => (
                        <label key={eq.id} className={`flex items-center gap-2 cursor-pointer p-1 rounded ${darkMode ? 'hover:bg-slate-700' : 'hover:bg-gray-50'}`}>
                          <input type="checkbox" checked={selectedEquipmentsForService.includes(eq.id)} onChange={(e) => {
                            if (e.target.checked) setSelectedEquipmentsForService(prev => [...prev, eq.id]);
                            else setSelectedEquipmentsForService(prev => prev.filter(id => id !== eq.id));
                          }} />
                          <span className={`${darkMode ? 'text-gray-200' : 'text-gray-900'}`}>{formatEquipamentoName(eq)}</span>
                        </label>
                      ))}
                      {equipments.length === 0 && (
                        <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Nenhum equipamento disponível</p>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-3 pt-4">
                    <button onClick={() => setShowServiceModal(false)} className={`flex-1 px-4 py-2 rounded-lg ${darkMode ? 'bg-slate-700 text-white hover:bg-slate-600' : 'bg-gray-200 text-gray-900 hover:bg-gray-300'}`}>Cancelar</button>
                    <button onClick={handleSubmitService} className="flex-1 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700">Cadastrar</button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
