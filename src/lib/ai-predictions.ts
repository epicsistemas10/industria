// Sistema de previsão de falhas usando IA
import { supabase } from './supabase';

export interface PredictionData {
  equipamento_id: string;
  equipamento_nome: string;
  probabilidade_falha: number; // 0-100
  dias_ate_falha: number;
  confianca: number; // 0-100
  fatores_risco: string[];
  recomendacoes: string[];
  historico_usado: number;
  ultima_atualizacao: Date;
}

export interface EquipmentMetrics {
  mtbf: number; // Mean Time Between Failures
  mttr: number; // Mean Time To Repair
  idade_anos: number;
  horas_operacao: number;
  numero_falhas: number;
  custo_medio_manutencao: number;
  dias_desde_ultima_revisao: number;
  status_revisao: number; // 0-100
}

export const aiPredictionService = {
  // Calcular probabilidade de falha baseado em dados históricos
  calculateFailureProbability(metrics: EquipmentMetrics): number {
    let probability = 0;

    // Fator 1: Idade do equipamento (peso: 20%)
    const idadeFator = Math.min((metrics.idade_anos / 20) * 100, 100);
    probability += idadeFator * 0.2;

    // Fator 2: Status da revisão (peso: 25%)
    const revisaoFator = 100 - metrics.status_revisao;
    probability += revisaoFator * 0.25;

    // Fator 3: Dias desde última revisão (peso: 20%)
    const diasFator = Math.min((metrics.dias_desde_ultima_revisao / 365) * 100, 100);
    probability += diasFator * 0.2;

    // Fator 4: Histórico de falhas (peso: 20%)
    const falhasFator = Math.min((metrics.numero_falhas / 10) * 100, 100);
    probability += falhasFator * 0.2;

    // Fator 5: MTBF (peso: 15%)
    const mtbfFator = metrics.mtbf > 0 ? Math.max(0, 100 - (metrics.mtbf / 8760) * 100) : 50;
    probability += mtbfFator * 0.15;

    return Math.min(Math.round(probability), 100);
  },

  // Estimar dias até falha
  estimateDaysUntilFailure(metrics: EquipmentMetrics, probability: number): number {
    if (probability < 20) return 365; // Baixo risco: ~1 ano
    if (probability < 40) return 180; // Médio-baixo: ~6 meses
    if (probability < 60) return 90;  // Médio: ~3 meses
    if (probability < 80) return 30;  // Alto: ~1 mês
    return 7; // Crítico: ~1 semana
  },

  // Identificar fatores de risco
  identifyRiskFactors(metrics: EquipmentMetrics, probability: number): string[] {
    const factors: string[] = [];

    if (metrics.idade_anos > 15) {
      factors.push('Equipamento com idade avançada (>15 anos)');
    }

    if (metrics.status_revisao < 50) {
      factors.push('Status de revisão crítico (<50%)');
    }

    if (metrics.dias_desde_ultima_revisao > 180) {
      factors.push('Revisão atrasada (>6 meses)');
    }

    if (metrics.numero_falhas > 5) {
      factors.push('Histórico de falhas frequentes');
    }

    if (metrics.mtbf < 2000) {
      factors.push('MTBF baixo (<2000 horas)');
    }

    if (metrics.custo_medio_manutencao > 5000) {
      factors.push('Custos de manutenção elevados');
    }

    if (probability > 70) {
      factors.push('Probabilidade de falha crítica');
    }

    return factors;
  },

  // Gerar recomendações
  generateRecommendations(metrics: EquipmentMetrics, probability: number): string[] {
    const recommendations: string[] = [];

    if (probability > 70) {
      recommendations.push('🚨 URGENTE: Agendar inspeção imediata');
      recommendations.push('Considerar substituição preventiva de componentes críticos');
    }

    if (metrics.status_revisao < 50) {
      recommendations.push('Realizar revisão completa o mais breve possível');
    }

    if (metrics.dias_desde_ultima_revisao > 180) {
      recommendations.push('Atualizar cronograma de manutenção preventiva');
    }

    if (metrics.numero_falhas > 5) {
      recommendations.push('Investigar causa raiz das falhas recorrentes');
      recommendations.push('Avaliar necessidade de upgrade ou substituição');
    }

    if (metrics.mtbf < 2000) {
      recommendations.push('Implementar monitoramento contínuo');
      recommendations.push('Aumentar frequência de inspeções');
    }

    if (metrics.idade_anos > 15) {
      recommendations.push('Avaliar viabilidade de modernização');
      recommendations.push('Preparar plano de substituição');
    }

    if (recommendations.length === 0) {
      recommendations.push('Manter cronograma regular de manutenção');
      recommendations.push('Continuar monitoramento de performance');
    }

    return recommendations;
  },

  // Calcular confiança da previsão
  calculateConfidence(historico_usado: number): number {
    // Quanto mais dados históricos, maior a confiança
    if (historico_usado >= 20) return 95;
    if (historico_usado >= 15) return 85;
    if (historico_usado >= 10) return 75;
    if (historico_usado >= 5) return 60;
    return 40;
  },

  // Buscar dados do equipamento e gerar previsão
  async predictEquipmentFailure(equipamento_id: string): Promise<PredictionData | null> {
    try {
      // Buscar dados do equipamento
      const { data: equipamento, error: eqError } = await supabase
        .from('equipamentos')
        .select('*, setor:setores(*)')
        .eq('id', equipamento_id)
        .single();

      if (eqError || !equipamento) throw eqError;

      // Buscar histórico de revisões
      const { data: revisoes, error: revError } = await supabase
        .from('historico_revisoes')
        .select('*')
        .eq('equipamento_id', equipamento_id)
        .order('data_revisao', { ascending: false });

      if (revError) throw revError;

      // Buscar ordens de serviço
      const { data: ordens, error: osError } = await supabase
        .from('ordens_servico')
        .select('*')
        .eq('equipamento_id', equipamento_id)
        .order('data_abertura', { ascending: false });

      if (osError) throw osError;

      // Calcular métricas
      const hoje = new Date();
      const dataFabricacao = equipamento.ano_fabricacao 
        ? new Date(equipamento.ano_fabricacao, 0, 1) 
        : new Date(hoje.getFullYear() - 10, 0, 1);
      
      const idade_anos = (hoje.getTime() - dataFabricacao.getTime()) / (1000 * 60 * 60 * 24 * 365);
      
      const ultimaRevisao = equipamento.ultima_revisao 
        ? new Date(equipamento.ultima_revisao) 
        : new Date(hoje.getTime() - 365 * 24 * 60 * 60 * 1000);
      
      const dias_desde_ultima_revisao = Math.floor(
        (hoje.getTime() - ultimaRevisao.getTime()) / (1000 * 60 * 60 * 24)
      );

      const numero_falhas = ordens?.filter(os => 
        os.tipo === 'corretiva' && os.status === 'concluida'
      ).length || 0;

      const custo_medio_manutencao = ordens && ordens.length > 0
        ? ordens.reduce((sum, os) => sum + (os.custo_real || 0), 0) / ordens.length
        : 0;

      const metrics: EquipmentMetrics = {
        mtbf: equipamento.mtbf || 5000,
        mttr: 24, // Valor padrão
        idade_anos: Math.round(idade_anos * 10) / 10,
        horas_operacao: Math.floor(idade_anos * 8760), // Estimativa
        numero_falhas,
        custo_medio_manutencao,
        dias_desde_ultima_revisao,
        status_revisao: equipamento.status_revisao || 0
      };

      // Calcular previsões
      const probabilidade_falha = this.calculateFailureProbability(metrics);
      const dias_ate_falha = this.estimateDaysUntilFailure(metrics, probabilidade_falha);
      const fatores_risco = this.identifyRiskFactors(metrics, probabilidade_falha);
      const recomendacoes = this.generateRecommendations(metrics, probabilidade_falha);
      const historico_usado = (revisoes?.length || 0) + (ordens?.length || 0);
      const confianca = this.calculateConfidence(historico_usado);

      const prediction: PredictionData = {
        equipamento_id,
        equipamento_nome: equipamento.nome,
        probabilidade_falha,
        dias_ate_falha,
        confianca,
        fatores_risco,
        recomendacoes,
        historico_usado,
        ultima_atualizacao: new Date()
      };

      return prediction;
    } catch (error) {
      console.error('Erro ao gerar previsão:', error);
      return null;
    }
  },

  // Gerar previsões para todos os equipamentos
  async predictAllEquipments(): Promise<PredictionData[]> {
    try {
      const { data: equipamentos, error } = await supabase
        .from('equipamentos')
        .select('id');

      if (error) throw error;

      const predictions: PredictionData[] = [];

      for (const eq of equipamentos || []) {
        const prediction = await this.predictEquipmentFailure(eq.id);
        if (prediction) {
          predictions.push(prediction);
        }
      }

      // Ordenar por probabilidade de falha (maior primeiro)
      return predictions.sort((a, b) => b.probabilidade_falha - a.probabilidade_falha);
    } catch (error) {
      console.error('Erro ao gerar previsões:', error);
      return [];
    }
  },

  // Buscar equipamentos de alto risco
  async getHighRiskEquipments(): Promise<PredictionData[]> {
    const predictions = await this.predictAllEquipments();
    return predictions.filter(p => p.probabilidade_falha >= 60);
  }
};
