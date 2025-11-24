import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../dashboard/components/Sidebar';
import TopBar from '../dashboard/components/TopBar';
import { supabase } from '../../lib/supabase';

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
  const [sidebarOpen, setSidebarOpen] = useState(true);
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
  const [showServiceModal, setShowServiceModal] = useState(false);
  const [serviceName, setServiceName] = useState('');
  const [serviceDesc, setServiceDesc] = useState('');
  const [selectedEquipmentsForService, setSelectedEquipmentsForService] = useState<string[]>([]);

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
    loadHotspots();
    
    const savedImage = localStorage.getItem('map_image');
    if (savedImage) setMapImage(savedImage);
    
    const interval = setInterval(() => {
      loadEquipments();
      loadHotspots();
    }, 30000);
    return () => clearInterval(interval);
  }, []);

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
          x: 0,
          y: 0,
          status: item.status_revisao >= 100 ? 'operacional' : 
                 item.status_revisao >= 50 ? 'manutencao' : 
                 item.status_revisao > 0 ? 'alerta' : 'parado',
          setor: item.setores?.nome || 'Sem setor',
          progresso: item.status_revisao || 0,
          criticidade: item.criticidade,
          fabricante: item.fabricante,
          modelo: item.modelo,
        }));
        setEquipments(mapped);
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

  const loadHotspots = async () => {
    try {
      const { data, error } = await supabase
        .from('equipamento_mapa')
        .select('*');

      if (!error && data) {
        const hotspotsData = data.map(item => ({
          id: item.id,
          equipamento_id: item.equipamento_id,
          x: item.x || 10,
          y: item.y || 10,
          width: item.width || 8,
          height: item.height || 8,
          color: item.color || '#10b981',
          fontSize: item.font_size || 14,
          icon: item.icon || 'ri-tools-fill',
        }));
        setHotspots(hotspotsData);
      }
    } catch (err) {
      console.error('Erro ao carregar hotspots:', err);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        setMapImage(result);
        localStorage.setItem('map_image', result);
        setShowImageUpload(false);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAddHotspot = async () => {
    if (!selectedEquipmentForHotspot) return;

    try {
      // Verificar se já existe hotspot para este equipamento
      const { data: existingHotspot } = await supabase
        .from('equipamento_mapa')
        .select('id')
        .eq('equipamento_id', selectedEquipmentForHotspot)
        .single();

      if (existingHotspot) {
        alert('Este equipamento já possui um hotspot no mapa!');
        return;
      }

      // Inserir novo hotspot
      const { error } = await supabase
        .from('equipamento_mapa')
        .insert({
          equipamento_id: selectedEquipmentForHotspot,
          x: 20,
          y: 20,
          width: 8,
          height: 8,
        });

      if (error) {
        console.error('Erro ao inserir hotspot:', error);
        throw error;
      }

      // Recarregar hotspots
      await loadHotspots();
      setShowAddHotspot(false);
      setSelectedEquipmentForHotspot('');
      
      // Mostrar mensagem de sucesso
      alert('Hotspot adicionado com sucesso! Agora você pode arrastá-lo para a posição correta.');
    } catch (err: any) {
      console.error('Erro ao adicionar hotspot:', err);
      alert(`Erro ao adicionar hotspot: ${err.message || 'Erro desconhecido'}`);
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

    const rect = mapRef.current.getBoundingClientRect();
    const deltaX = ((e.clientX - dragStart.x) / rect.width) * 100;
    const deltaY = ((e.clientY - dragStart.y) / rect.height) * 100;

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
          const { error } = await supabase
            .from('equipamento_mapa')
            .update({
              x: hotspot.x,
              y: hotspot.y,
              width: hotspot.width,
              height: hotspot.height,
              color: hotspot.color,
              font_size: hotspot.fontSize,
              icon: hotspot.icon,
            })
            .eq('id', hotspot.id);
          
          if (error) {
            console.error('Erro ao salvar posição:', error);
            alert('Erro ao salvar posição do hotspot');
          } else {
            console.log('Hotspot salvo com sucesso:', hotspot);
          }
        } catch (err) {
          console.error('Erro ao salvar posição:', err);
          alert('Erro ao salvar posição do hotspot');
        }
      }
    }
    
    setDragging(false);
    setResizing(false);
  };

  const handleDeleteHotspot = async (hotspotId: string) => {
    if (!confirm('Deseja remover este hotspot?')) return;

    try {
      await supabase
        .from('equipamento_mapa')
        .delete()
        .eq('id', hotspotId);

      await loadHotspots();
      setSelectedHotspot(null);
    } catch (err) {
      console.error('Erro ao deletar hotspot:', err);
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

      const { data, error } = await supabase
        .from('equipamento_servicos')
        .insert(rows)
        .select();

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
    
    const equipment = equipments.find(eq => eq.id === hotspot.equipamento_id);
    if (equipment) {
      setSelectedEquipment(equipment);
      await loadEquipmentDetails(hotspot.equipamento_id);
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

  const getFilteredHotspots = () => {
    return hotspots.filter((hotspot) => {
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
      const { error } = await supabase
        .from('equipamento_mapa')
        .update({
          color: hotspotColor,
          font_size: hotspotFontSize,
          icon: hotspotIcon,
        })
        .eq('id', selectedHotspot);
      
      if (error) {
        console.error('Erro ao salvar customização:', error);
        alert('Erro ao salvar customização');
      } else {
        console.log('Customização salva com sucesso');
        setShowCustomizePanel(false);
        // Recarregar hotspots para garantir sincronização
        await loadHotspots();
      }
    } catch (err) {
      console.error('Erro ao salvar customização:', err);
      alert('Erro ao salvar customização');
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
      const { error } = await supabase
        .from('equipamento_mapa')
        .update({
          width: newWidth,
          height: newHeight,
        })
        .eq('id', selectedHotspot);
      
      if (error) {
        console.error('Erro ao salvar tamanho:', error);
        alert('Erro ao salvar tamanho');
      } else {
        console.log('Tamanho salvo com sucesso');
      }
    } catch (err) {
      console.error('Erro ao salvar tamanho:', err);
      alert('Erro ao salvar tamanho');
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
      const { error } = await supabase
        .from('equipamento_mapa')
        .update({
          font_size: newFontSize,
        })
        .eq('id', selectedHotspot);
      
      if (error) {
        console.error('Erro ao salvar tamanho da fonte:', error);
        alert('Erro ao salvar tamanho da fonte');
      } else {
        console.log('Tamanho da fonte salvo com sucesso');
      }
    } catch (err) {
      console.error('Erro ao salvar tamanho da fonte:', err);
      alert('Erro ao salvar tamanho da fonte');
    }
  };

  const handleSaveAndExit = async () => {
    // Salvar todos os hotspots antes de sair do modo edição
    try {
      const savePromises = hotspots.map(async (hotspot) => {
        const { error } = await supabase
          .from('equipamento_mapa')
          .update({
            x: hotspot.x,
            y: hotspot.y,
            width: hotspot.width,
            height: hotspot.height,
            color: hotspot.color,
            font_size: hotspot.fontSize,
            icon: hotspot.icon,
          })
          .eq('id', hotspot.id);
        
        if (error) {
          console.error('Erro ao salvar hotspot:', hotspot.id, error);
          throw error;
        }
        return true;
      });

      await Promise.all(savePromises);
      
      console.log('Todos os hotspots salvos com sucesso');
      
      // Recarregar hotspots para garantir sincronização
      await loadHotspots();
      
      setEditMode(false);
      setSelectedHotspot(null);
      
      alert('Alterações salvas com sucesso!');
    } catch (err) {
      console.error('Erro ao salvar hotspots:', err);
      alert('Erro ao salvar as alterações. Tente novamente.');
    }
  };

  return (
    <div className={`min-h-screen ${darkMode ? 'bg-slate-900' : 'bg-gray-100'} transition-colors duration-300`}>
      <Sidebar isOpen={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} darkMode={darkMode} />

      <div className={`transition-all duration-300 ${sidebarOpen ? 'ml-64' : 'ml-20'}`}>
        <TopBar darkMode={darkMode} setDarkMode={setDarkMode} />

        <main className="p-6">
          {/* Header */}
          <div className="mb-6 flex items-center justify-between flex-wrap gap-4">
            <div>
              <h1 className={`text-3xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                Mapa Industrial Interativo
              </h1>
              <p className={`mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                Visualização em tempo real dos equipamentos • {filteredCount} equipamentos exibidos
              </p>
            </div>

            <div className="flex items-center gap-3 flex-wrap">
              <button
                onClick={editMode ? handleSaveAndExit : () => setEditMode(true)}
                className={`px-4 py-2 rounded-lg transition-all whitespace-nowrap cursor-pointer ${
                  editMode 
                    ? 'bg-red-600 text-white hover:bg-red-700' 
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
              >
                <i className={`${editMode ? 'ri-save-line' : 'ri-edit-line'} mr-2`}></i>
                {editMode ? 'Salvar e Sair' : 'Modo Edição'}
              </button>

              {editMode && (
                <>
                  <button
                    onClick={() => setShowAddHotspot(true)}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all whitespace-nowrap cursor-pointer"
                  >
                    <i className="ri-add-line mr-2"></i>
                    Adicionar Hotspot
                  </button>

                  {selectedHotspot && (
                    <>
                      <button
                        onClick={handleCustomizeHotspot}
                        className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-all whitespace-nowrap cursor-pointer"
                      >
                        <i className="ri-palette-line mr-2"></i>
                        Personalizar
                      </button>

                      <div className="flex items-center gap-2 bg-slate-800 rounded-lg px-3 py-2">
                        <button
                          onClick={() => handleSizeChange(-1)}
                          className="w-8 h-8 flex items-center justify-center bg-slate-700 text-white rounded hover:bg-slate-600 cursor-pointer"
                          title="Diminuir área do hotspot"
                        >
                          <i className="ri-subtract-line"></i>
                        </button>
                        <span className="text-white text-sm px-2">Área</span>
                        <button
                          onClick={() => handleSizeChange(1)}
                          className="w-8 h-8 flex items-center justify-center bg-slate-700 text-white rounded hover:bg-slate-600 cursor-pointer"
                          title="Aumentar área do hotspot"
                        >
                          <i className="ri-add-line"></i>
                        </button>
                      </div>

                      <div className="flex items-center gap-2 bg-slate-800 rounded-lg px-3 py-2">
                        <button
                          onClick={() => handleCircleSizeChange(-2)}
                          className="w-8 h-8 flex items-center justify-center bg-slate-700 text-white rounded hover:bg-slate-600 cursor-pointer"
                          title="Diminuir círculo"
                        >
                          <i className="ri-subtract-line"></i>
                        </button>
                        <span className="text-white text-sm px-2">Círculo</span>
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
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-all whitespace-nowrap cursor-pointer"
              >
                <i className="ri-image-add-line mr-2"></i>
                Alterar Imagem
              </button>

              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className={`px-4 py-2 pr-8 rounded-lg border ${
                  darkMode 
                    ? 'bg-slate-800 border-slate-700 text-white' 
                    : 'bg-white border-gray-300 text-gray-900'
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
                className={`px-4 py-2 pr-8 rounded-lg border ${
                  darkMode 
                    ? 'bg-slate-800 border-slate-700 text-white' 
                    : 'bg-white border-gray-300 text-gray-900'
                } focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer`}
              >
                <option value="todos">Todos os Setores</option>
                {setores.map((setor) => (
                  <option key={setor} value={setor}>{setor}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Legend removed as requested */}

          {/* Loading */}
          {loading && (
            <div className={`rounded-xl overflow-hidden ${darkMode ? 'bg-slate-800' : 'bg-white'} shadow-xl flex items-center justify-center`} style={{ height: 'calc(100vh - 200px)' }}>
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
                <p className={darkMode ? 'text-gray-400' : 'text-gray-600'}>Carregando mapa...</p>
              </div>
            </div>
          )}

          {/* Mapa Interativo - TELA CHEIA */}
          {!loading && (
            <div 
              ref={mapRef}
              className={`rounded-xl overflow-hidden ${darkMode ? 'bg-slate-800' : 'bg-white'} shadow-xl relative ${editMode ? 'cursor-crosshair' : 'cursor-default'}`} 
              style={{ height: 'calc(100vh - 200px)' }}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
            >
              {mapImage ? (
                <img 
                  src={mapImage} 
                  alt="Mapa Industrial" 
                  className="w-full h-full object-cover pointer-events-none"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-slate-700/30">
                  <div className="text-center">
                    <i className="ri-map-pin-line text-5xl text-gray-400 mb-3"></i>
                    <p className="text-gray-300">Nenhuma imagem do mapa. Faça upload em "Alterar Imagem".</p>
                  </div>
                </div>
              )}
              
              {/* Hotspots Overlay */}
              {getFilteredHotspots().map((hotspot) => {
                const equipment = equipments.find(eq => eq.id === hotspot.equipamento_id);
                if (!equipment) return null;

                const hotspotColor = hotspot.color || getStatusColor(equipment.status);
                const fontSize = hotspot.fontSize || 14;
                const iconClass = hotspot.icon || 'ri-tools-fill';
                const circleSize = fontSize * 4;

                return (
                  <div
                    key={hotspot.id}
                    className={`absolute group ${editMode ? 'cursor-move' : 'cursor-pointer'} ${
                      selectedHotspot === hotspot.id ? 'ring-4 ring-blue-500' : ''
                    }`}
                    style={{ 
                      left: `${hotspot.x}%`, 
                      top: `${hotspot.y}%`,
                      width: `${hotspot.width}%`,
                      height: `${hotspot.height}%`,
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
                      <div className={`absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 rounded-lg shadow-xl opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10 ${
                        darkMode ? 'bg-slate-900 text-white' : 'bg-white text-gray-900'
                      } border ${darkMode ? 'border-slate-700' : 'border-gray-200'}`}>
                        <div className="font-bold">{equipment.nome}</div>
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
                          {eq.nome} - {eq.setor}
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
                    <button
                      onClick={openServiceModalForSelected}
                      className="px-3 py-1 rounded-md bg-emerald-600 text-white hover:bg-emerald-700 text-sm"
                    >
                      Cadastrar Serviço Padrão
                    </button>
                    <button
                      onClick={() => {
                        setSelectedEquipment(null);
                        setEquipmentDetails(null);
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
                  {/* Informações Básicas */}
                  <div>
                    <label className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Nome</label>
                    <p className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                      {selectedEquipment.nome}
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

                  {/* Progresso */}
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

                  {/* Custo Total */}
                  <div>
                    <label className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Custo Acumulado</label>
                    <p className={`font-bold text-lg ${darkMode ? 'text-green-400' : 'text-green-600'}`}>
                      R$ {equipmentDetails.custo_total?.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) || '0,00'}
                    </p>
                  </div>

                  {/* Componentes */}
                  <div>
                    <label className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      Componentes ({equipmentDetails.componentes?.length || 0})
                    </label>
                    <div className="mt-2 space-y-2 max-h-40 overflow-y-auto">
                      {equipmentDetails.componentes?.map((comp: any) => (
                        <div key={comp.id} className={`p-2 rounded-lg ${darkMode ? 'bg-slate-700' : 'bg-gray-100'}`}>
                          <p className={`text-sm font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                            {comp.componentes?.nome || 'Sem nome'}
                          </p>
                          <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                            Qtd: {comp.quantidade || 0}
                          </p>
                        </div>
                      ))}
                      {(!equipmentDetails.componentes || equipmentDetails.componentes.length === 0) && (
                        <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                          Nenhum componente vinculado
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Ordens de Serviço */}
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
                              os.status === 'concluida' 
                                ? 'bg-green-500/20 text-green-400' 
                                : 'bg-yellow-500/20 text-yellow-400'
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

                  {/* Histórico de Manutenção */}
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
                      {selectedEquipment.nome}
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
                          <span className={`${darkMode ? 'text-gray-200' : 'text-gray-900'}`}>{eq.nome}</span>
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
