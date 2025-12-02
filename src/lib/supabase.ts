import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_PUBLIC_SUPABASE_ANON_KEY;

// Declaramos e exportamos uma variável mutável; atribuímos abaixo dependendo
// da presença das variáveis de ambiente. Isso evita usar `export` dentro
// de blocos condicionais (o que causa erro de sintaxe).
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export let supabase: any;

if (!supabaseUrl || !supabaseAnonKey) {
  // Em ambiente de desenvolvimento, não lançamos para permitir que a
  // aplicação inicialize mesmo sem as variáveis de ambiente. Em vez disso,
  // mostramos um aviso e exportamos um proxy que lança um erro informativo
  // quando qualquer método do supabase é usado.
  // Para usar o Supabase, copie `.env.local.example` para `.env.local`
  // e preencha `VITE_PUBLIC_SUPABASE_URL` e `VITE_PUBLIC_SUPABASE_ANON_KEY`.
  // eslint-disable-next-line no-console
  console.warn('Supabase não configurado: defina VITE_PUBLIC_SUPABASE_URL e VITE_PUBLIC_SUPABASE_ANON_KEY em .env.local');

  const handler: ProxyHandler<any> = {
    get() {
      return () => {
        throw new Error('Supabase não configurado. Copie .env.local.example para .env.local e defina VITE_PUBLIC_SUPABASE_URL e VITE_PUBLIC_SUPABASE_ANON_KEY.');
      };
    },
  };

  supabase = new Proxy({}, handler);
} else {
  supabase = createClient(supabaseUrl, supabaseAnonKey);
}

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
