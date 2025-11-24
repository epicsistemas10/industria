import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';

interface Equipment {
  id: string;
  nome: string;
  status: string;
  progresso?: number;
  setor?: string;
  criticidade?: string;
  imagem_url?: string;
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

interface Stats {
  equipamentosOperacionais: number;
  equipamentosManutencao: number;
  equipamentosParados: number;
  equipamentosAlerta: number;
  osAbertas: number;
  osEmAndamento: number;
  osConcluidas: number;
  totalEquipamentos: number;
}

interface Atividade {
  id: string;
  equipamento_nome: string;
  tipo: string;
  descricao: string;
  data_inicio: string;
  responsavel: string;
  prioridade: string;
}

interface Equipe {
  id: string;
  nome: string;
  turno: string;
  membros: string[];
  equipamentos: string[];
}

export default function DashboardTVPage() {
  const [stats, setStats] = useState<Stats>({
    equipamentosOperacionais: 0,
    equipamentosManutencao: 0,
    equipamentosParados: 0,
    equipamentosAlerta: 0,
    osAbertas: 0,
    osEmAndamento: 0,
    osConcluidas: 0,
    totalEquipamentos: 0,
  });
  const [mapaUrl, setMapaUrl] = useState<string>('');
  const [mapImage, setMapImage] = useState<string>('');
  const [equipments, setEquipments] = useState<Equipment[]>([]);
  const [hotspots, setHotspots] = useState<Hotspot[]>([]);
  const [atividades, setAtividades] = useState<Atividade[]>([]);
  const [equipes, setEquipes] = useState<Equipe[]>([]);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [currentView, setCurrentView] = useState<'mapa' | 'planejamento'>('mapa');
  const [companyLogo, setCompanyLogo] = useState<string | null>(null);
  const [companyName, setCompanyName] = useState('');

  useEffect(() => {
    loadData();
    
    // Carregar logo e nome da empresa
    const savedLogo = localStorage.getItem('company_logo');
    const savedName = localStorage.getItem('company_name');
    if (savedLogo) setCompanyLogo(savedLogo);
    if (savedName) setCompanyName(savedName);
    
    // Carregar mapa industrial do localStorage (mesmo local que a página Mapa Industrial)
    console.log('🔍 Tentando carregar mapa do localStorage...');
    const savedMapImage = localStorage.getItem('map_image');
    console.log('📦 Valor encontrado no localStorage:', savedMapImage ? 'Imagem encontrada' : 'Nenhuma imagem');
    
    if (savedMapImage) {
      console.log('✅ Mapa carregado com sucesso!');
      console.log('📏 Tamanho da imagem:', savedMapImage.length, 'caracteres');
      setMapImage(savedMapImage);
    } else {
      console.log('⚠️ Nenhum mapa encontrado no localStorage');
      console.log('💡 Dica: Faça upload do mapa em "Mapa Industrial" primeiro');
    }
    
    const interval = setInterval(() => {
      loadData();
      setCurrentTime(new Date());
      
      // Recarregar mapa a cada 30 segundos
      const updatedMapImage = localStorage.getItem('map_image');
      if (updatedMapImage && updatedMapImage !== mapImage) {
        console.log('🔄 Mapa atualizado detectado');
        setMapImage(updatedMapImage);
      }
    }, 30000);

    const timeInterval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => {
      clearInterval(interval);
      clearInterval(timeInterval);
    };
  }, []);

  useEffect(() => {
    // carregar equipamentos e hotspots também
    loadEquipments();
    loadHotspots();
  }, []);

  const loadEquipments = async () => {
    try {
      const { data: eqData, error: eqError } = await supabase
        .from('equipamentos')
        .select('*, setores(nome)');

      if (!eqError && eqData) {
        const mapped = eqData.map((item: any) => ({
          id: item.id,
          nome: item.nome || 'Sem nome',
          status: item.status || 'parado',
          progresso: item.status_revisao || 0,
          setor: item.setores?.nome || 'Sem setor',
          criticidade: item.criticidade,
          imagem_url: item.imagem_url,
        }));
        setEquipments(mapped);
      } else {
        setEquipments([]);
      }
    } catch (err) {
      console.error('Erro ao carregar equipamentos (TV):', err);
      setEquipments([]);
    }
  };

  const loadHotspots = async () => {
    try {
      const { data, error } = await supabase
        .from('equipamento_mapa')
        .select('*');

      if (!error && data) {
        const hotspotsData = data.map((item: any) => ({
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
      console.error('Erro ao carregar hotspots (TV):', err);
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

  const loadData = async () => {
    try {
      // Carregar estatísticas de equipamentos
      const { data: equipamentos } = await supabase
        .from('equipamentos')
        .select('status, criticidade, imagem_url');

      if (equipamentos) {
        const total = equipamentos.length;
        const operacionais = equipamentos.filter(e => e.status === 'operacional').length;
        const manutencao = equipamentos.filter(e => e.status === 'manutencao').length;
        const parados = equipamentos.filter(e => e.status === 'parado').length;
        const alerta = equipamentos.filter(e => e.status === 'alerta').length;

        setStats(prev => ({
          ...prev,
          totalEquipamentos: total,
          equipamentosOperacionais: operacionais,
          equipamentosManutencao: manutencao,
          equipamentosParados: parados,
          equipamentosAlerta: alerta,
        }));
      }

      // Carregar estatísticas de OS
      const { data: os } = await supabase
        .from('ordens_servico')
        .select('status, data_abertura');

      if (os) {
        const hoje = new Date();
        hoje.setHours(0, 0, 0, 0);

        const abertas = os.filter(o => o.status === 'aberta').length;
        const emAndamento = os.filter(o => o.status === 'em_andamento').length;
        const concluidasHoje = os.filter(o => {
          if (o.status !== 'concluida') return false;
          const dataOS = new Date(o.data_abertura);
          return dataOS >= hoje;
        }).length;

        setStats(prev => ({
          ...prev,
          osAbertas: abertas,
          osEmAndamento: emAndamento,
          osConcluidas: concluidasHoje,
        }));
      }

      // Carregar planejamento semanal
      const { data: planejamento } = await supabase
        .from('planejamento_semana')
        .select('*, equipamentos(nome)')
        .eq('semana', 0)
        .order('data_inicio');

      if (planejamento) {
        setAtividades(planejamento.map(p => ({
          id: p.id,
          equipamento_nome: p.equipamentos?.nome || 'Sem equipamento',
          tipo: p.tipo,
          descricao: p.descricao,
          data_inicio: p.data_inicio,
          responsavel: p.responsavel,
          prioridade: p.prioridade
        })));
      }

      // Carregar equipes
      const { data: equipesData } = await supabase
        .from('equipes')
        .select('*')
        .eq('disponibilidade', true);

      if (equipesData) {
        setEquipes(equipesData.map(e => ({
          id: e.id,
          nome: e.nome,
          turno: e.turno || 'Integral',
          membros: e.membros || [],
          equipamentos: [] // Será preenchido com base no planejamento
        })));
      }
    } catch (err) {
      console.error('Erro ao carregar dados:', err);
    }
  };

  const getPrioridadeColor = (prioridade: string) => {
    switch (prioridade) {
      case 'alta': return 'bg-red-500';
      case 'media': return 'bg-yellow-500';
      case 'baixa': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  const getTipoIcon = (tipo: string) => {
    switch (tipo) {
      case 'revisao': return 'ri-tools-line';
      case 'manutencao': return 'ri-hammer-line';
      case 'inspecao': return 'ri-search-eye-line';
      case 'limpeza': return 'ri-brush-line';
      default: return 'ri-file-list-line';
    }
  };

  const diasSemana = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];

  const disponibilidade = stats.totalEquipamentos > 0 
    ? ((stats.equipamentosOperacionais / stats.totalEquipamentos) * 100).toFixed(1)
    : '0.0';

  const mediaRevisao = stats.totalEquipamentos > 0
    ? (((stats.equipamentosOperacionais + stats.equipamentosManutencao) / stats.totalEquipamentos) * 100).toFixed(1)
    : '0.0';

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-slate-900 via-blue-900 to-purple-900 p-4 md:p-6 lg:p-8">
      {/* Header Compacto */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-4">
          {companyLogo ? (
            <img src={companyLogo} alt="Logo" className="w-16 h-16 rounded-lg object-contain bg-white/10 p-2" />
          ) : (
            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
              <i className="ri-plant-line text-white text-3xl"></i>
            </div>
          )}
          <div>
            <h1 className="text-2xl font-bold text-white">Dashboard Manutenção</h1>
            <p className="text-blue-200 text-base font-bold">{companyName}</p>
          </div>
        </div>
        <div className="text-right">
          <div className="text-3xl font-bold text-white">
            {currentTime.toLocaleTimeString('pt-BR')}
          </div>
          <div className="text-blue-200 text-base">
            {currentTime.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })}
          </div>
        </div>
      </div>

      {/* Stats Compactos - Apenas Média de Revisão */}
      <div className="bg-white/10 backdrop-blur-lg rounded-xl p-4 border border-white/20 mb-4">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-4xl font-bold text-green-400 mb-1">{mediaRevisao}%</div>
            <div className="text-green-200 text-sm">Média de Revisão</div>
          </div>
          <div className="text-center">
            <div className="text-4xl font-bold text-blue-400 mb-1">{stats.equipamentosOperacionais}</div>
            <div className="text-blue-200 text-sm">Operacionais</div>
          </div>
          <div className="text-center">
            <div className="text-4xl font-bold text-orange-400 mb-1">{stats.equipamentosManutencao}</div>
            <div className="text-orange-200 text-sm">Em Manutenção</div>
          </div>
          <div className="text-center">
            <div className="text-4xl font-bold text-purple-400 mb-1">{stats.totalEquipamentos}</div>
            <div className="text-purple-200 text-sm">Total</div>
          </div>
        </div>
      </div>

      {/* Grid: Mapa + Planejamento na mesma tela */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Mapa Industrial */}
        <div className="bg-white/10 backdrop-blur-lg rounded-xl p-4 border border-white/20">
          <h3 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
            <i className="ri-map-pin-line text-blue-400"></i>
            Mapa Industrial
          </h3>
          {mapImage ? (
            <div className="relative w-full h-[400px] lg:h-[500px] rounded-lg overflow-hidden bg-slate-800/50">
              <img
                src={mapImage}
                alt="Mapa Industrial"
                className="w-full h-full object-cover pointer-events-none"
                onError={(e) => {
                  console.error('❌ Erro ao carregar imagem do mapa');
                  setMapImage('');
                }}
                onLoad={() => {
                  console.log('✅ Imagem do mapa carregada com sucesso no Dashboard TV');
                }}
              />
              {/* Hotspots overlay (apenas visualização) */}
              {hotspots.length > 0 && equipments.length > 0 && (
                <div className="absolute inset-0 pointer-events-none">
                  {hotspots.map((hotspot) => {
                    const equipment = equipments.find(eq => eq.id === hotspot.equipamento_id);
                    if (!equipment) return null;

                    const hotspotColor = hotspot.color || getStatusColor(equipment.status);
                    const fontSize = hotspot.fontSize || 14;
                    const iconClass = hotspot.icon || 'ri-tools-fill';
                    const circleSize = fontSize * 4;

                    return (
                      <div
                        key={hotspot.id}
                        className="absolute"
                        style={{
                          left: `${hotspot.x}%`,
                          top: `${hotspot.y}%`,
                          width: `${hotspot.width}%`,
                          height: `${hotspot.height}%`,
                          transform: 'translate(-50%, -50%)',
                        }}
                      >
                        <div
                          className="rounded-full flex flex-col items-center justify-center shadow-lg"
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
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center justify-center h-[400px] lg:h-[500px] bg-slate-800/50 rounded-lg">
              <div className="text-center">
                <i className="ri-map-pin-line text-5xl text-gray-500 mb-3"></i>
                <p className="text-gray-400 text-sm font-medium">Nenhum mapa disponível</p>
                <p className="text-gray-500 text-xs mt-2">Faça upload do mapa em "Mapa Industrial"</p>
                <button
                  onClick={() => {
                    console.log('🔄 Tentando recarregar mapa...');
                    const reloadedMap = localStorage.getItem('map_image');
                    if (reloadedMap) {
                      console.log('✅ Mapa encontrado! Carregando...');
                      setMapImage(reloadedMap);
                    } else {
                      console.log('❌ Ainda não há mapa no localStorage');
                      alert('Nenhum mapa encontrado. Por favor, faça upload em "Mapa Industrial"');
                    }
                  }}
                  className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors cursor-pointer text-sm"
                >
                  <i className="ri-refresh-line mr-2"></i>
                  Tentar Recarregar
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Planejamento Semanal */}
        <div className="bg-white/10 backdrop-blur-lg rounded-xl p-4 border border-white/20">
          <h3 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
            <i className="ri-calendar-line text-blue-400"></i>
            Planejamento Semanal
          </h3>
          
          <div className="space-y-3 max-h-[400px] lg:max-h-[500px] overflow-y-auto pr-2">
            {diasSemana.map((dia, index) => {
              const atividadesDia = atividades.filter(a => {
                const dataAtividade = new Date(a.data_inicio);
                return dataAtividade.getDay() === index + 1;
              });

              return (
                <div key={dia} className="bg-white/5 rounded-lg p-3 border border-white/10">
                  <h4 className="text-sm font-bold text-white mb-2 flex items-center gap-2">
                    <i className="ri-calendar-check-line text-blue-400"></i>
                    {dia}
                    <span className="ml-auto text-xs bg-blue-500/30 px-2 py-1 rounded-full">
                      {atividadesDia.length} atividades
                    </span>
                  </h4>
                  {atividadesDia.length > 0 ? (
                    <div className="space-y-2">
                      {atividadesDia.slice(0, 3).map(ativ => (
                        <div key={ativ.id} className="bg-white/5 rounded p-2 border border-white/10">
                          <div className="flex items-center gap-2 mb-1">
                            <i className={`${getTipoIcon(ativ.tipo)} text-blue-400 text-sm`}></i>
                            <span className="text-xs text-white font-medium truncate flex-1">{ativ.equipamento_nome}</span>
                            <span className={`px-2 py-0.5 rounded text-xs ${getPrioridadeColor(ativ.prioridade)} text-white`}>
                              {ativ.prioridade}
                            </span>
                          </div>
                          <p className="text-xs text-blue-200 truncate ml-5">{ativ.descricao}</p>
                        </div>
                      ))}
                      {atividadesDia.length > 3 && (
                        <p className="text-xs text-gray-400 text-center">
                          +{atividadesDia.length - 3} atividades
                        </p>
                      )}
                    </div>
                  ) : (
                    <p className="text-xs text-gray-400 ml-5">Sem atividades planejadas</p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
