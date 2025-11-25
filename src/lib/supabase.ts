import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Variáveis de ambiente do Supabase não configuradas');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Tipos do banco de dados
export interface Equipamento {
  id: string;
  nome: string;
  setor: string;
  descricao?: string;
  fabricante?: string;
  modelo?: string;
  ano_fabricacao?: number;
  criticidade: 'Baixa' | 'Média' | 'Alta' | 'Crítica';
  status_revisao: number;
  foto_url?: string;
  mtbf?: number;
  data_inicio_revisao?: string;
  data_prevista_fim?: string;
  created_at: string;
  updated_at: string;
}

export interface Componente {
  id: string;
  nome: string;
  codigo_interno?: string;
  codigo_fabricante?: string;
  marca?: string;
  tipo?: string;
  medidas?: string;
  descricao?: string;
  foto_url?: string;
  preco_unitario?: number;
  created_at: string;
  updated_at: string;
}

export interface OrdemServico {
  id: string;
  numero_os: string;
  equipamento_id?: string;
  titulo: string;
  descricao?: string;
  prioridade: 'Baixa' | 'Média' | 'Alta' | 'Urgente';
  status: 'Aberta' | 'Em Andamento' | 'Pausada' | 'Concluída' | 'Cancelada';
  data_abertura: string;
  data_inicio?: string;
  data_conclusao?: string;
  responsavel?: string;
  equipe?: string;
  custo_estimado?: number;
  custo_real?: number;
  observacoes?: string;
  created_at: string;
  updated_at: string;
}

export interface Melhoria {
  id: string;
  titulo: string;
  descricao?: string;
  equipamento_id?: string;
  setor?: string;
  tipo: 'Eficiência' | 'Segurança' | 'Qualidade' | 'Custo' | 'Produtividade' | 'Outro';
  prioridade: 'Baixa' | 'Média' | 'Alta' | 'Crítica';
  status: 'Proposta' | 'Em Análise' | 'Aprovada' | 'Em Implementação' | 'Concluída' | 'Rejeitada';
  custo_estimado?: number;
  economia_estimada?: number;
  responsavel?: string;
  data_proposta: string;
  data_implementacao?: string;
  observacoes?: string;
  created_at: string;
  updated_at: string;
}
