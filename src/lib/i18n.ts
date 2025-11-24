// Configuração de internacionalização (i18n)
export const i18nConfig = {
  defaultLanguage: 'pt-BR',
  supportedLanguages: ['pt-BR', 'en-US', 'es-ES'],
  fallbackLanguage: 'pt-BR'
};

export interface Translation {
  [key: string]: string | Translation;
}

export interface LanguageData {
  code: string;
  name: string;
  flag: string;
  translations: Translation;
}

// Traduções em Português (Brasil)
const ptBR: Translation = {
  common: {
    save: 'Salvar',
    cancel: 'Cancelar',
    delete: 'Excluir',
    edit: 'Editar',
    create: 'Criar',
    search: 'Buscar',
    filter: 'Filtrar',
    loading: 'Carregando...',
    noData: 'Nenhum dado disponível',
    confirm: 'Confirmar',
    back: 'Voltar',
    next: 'Próximo',
    previous: 'Anterior',
    close: 'Fechar',
    yes: 'Sim',
    no: 'Não',
    all: 'Todos',
    actions: 'Ações',
    details: 'Detalhes',
    status: 'Status',
    date: 'Data',
    description: 'Descrição',
    name: 'Nome',
    type: 'Tipo',
    priority: 'Prioridade',
    cost: 'Custo',
    total: 'Total'
  },
  auth: {
    login: 'Entrar',
    logout: 'Sair',
    email: 'E-mail',
    password: 'Senha',
    forgotPassword: 'Esqueceu a senha?',
    rememberMe: 'Lembrar-me',
    loginError: 'Erro ao fazer login',
    invalidCredentials: 'Credenciais inválidas'
  },
  dashboard: {
    title: 'Painel de Controle',
    welcome: 'Bem-vindo',
    overview: 'Visão Geral',
    statistics: 'Estatísticas',
    recentActivity: 'Atividade Recente'
  },
  equipment: {
    title: 'Equipamentos',
    new: 'Novo Equipamento',
    edit: 'Editar Equipamento',
    delete: 'Excluir Equipamento',
    name: 'Nome do Equipamento',
    sector: 'Setor',
    manufacturer: 'Fabricante',
    model: 'Modelo',
    year: 'Ano de Fabricação',
    criticality: 'Criticidade',
    status: 'Status',
    operational: 'Operacional',
    maintenance: 'Em Manutenção',
    stopped: 'Parado',
    alert: 'Alerta',
    low: 'Baixa',
    medium: 'Média',
    high: 'Alta',
    critical: 'Crítica'
  },
  workOrder: {
    title: 'Ordens de Serviço',
    new: 'Nova Ordem de Serviço',
    edit: 'Editar Ordem de Serviço',
    number: 'Número',
    equipment: 'Equipamento',
    priority: 'Prioridade',
    status: 'Status',
    open: 'Aberta',
    inProgress: 'Em Andamento',
    paused: 'Pausada',
    completed: 'Concluída',
    cancelled: 'Cancelada',
    urgent: 'Urgente',
    responsible: 'Responsável',
    team: 'Equipe',
    estimatedCost: 'Custo Estimado',
    actualCost: 'Custo Real'
  },
  components: {
    title: 'Componentes',
    new: 'Novo Componente',
    edit: 'Editar Componente',
    code: 'Código',
    brand: 'Marca',
    stock: 'Estoque',
    minStock: 'Estoque Mínimo',
    unitPrice: 'Preço Unitário'
  },
  reports: {
    title: 'Relatórios',
    generate: 'Gerar Relatório',
    export: 'Exportar',
    pdf: 'Exportar PDF',
    excel: 'Exportar Excel',
    period: 'Período',
    consolidated: 'Relatório Consolidado'
  },
  predictions: {
    title: 'Previsão de Falhas',
    probability: 'Probabilidade de Falha',
    daysUntilFailure: 'Dias até Falha',
    confidence: 'Confiança',
    riskFactors: 'Fatores de Risco',
    recommendations: 'Recomendações',
    highRisk: 'Alto Risco',
    mediumRisk: 'Médio Risco',
    lowRisk: 'Baixo Risco',
    criticalRisk: 'Risco Crítico'
  }
};

// Traduções em Inglês (EUA)
const enUS: Translation = {
  common: {
    save: 'Save',
    cancel: 'Cancel',
    delete: 'Delete',
    edit: 'Edit',
    create: 'Create',
    search: 'Search',
    filter: 'Filter',
    loading: 'Loading...',
    noData: 'No data available',
    confirm: 'Confirm',
    back: 'Back',
    next: 'Next',
    previous: 'Previous',
    close: 'Close',
    yes: 'Yes',
    no: 'No',
    all: 'All',
    actions: 'Actions',
    details: 'Details',
    status: 'Status',
    date: 'Date',
    description: 'Description',
    name: 'Name',
    type: 'Type',
    priority: 'Priority',
    cost: 'Cost',
    total: 'Total'
  },
  auth: {
    login: 'Login',
    logout: 'Logout',
    email: 'Email',
    password: 'Password',
    forgotPassword: 'Forgot password?',
    rememberMe: 'Remember me',
    loginError: 'Login error',
    invalidCredentials: 'Invalid credentials'
  },
  dashboard: {
    title: 'Dashboard',
    welcome: 'Welcome',
    overview: 'Overview',
    statistics: 'Statistics',
    recentActivity: 'Recent Activity'
  },
  equipment: {
    title: 'Equipment',
    new: 'New Equipment',
    edit: 'Edit Equipment',
    delete: 'Delete Equipment',
    name: 'Equipment Name',
    sector: 'Sector',
    manufacturer: 'Manufacturer',
    model: 'Model',
    year: 'Manufacturing Year',
    criticality: 'Criticality',
    status: 'Status',
    operational: 'Operational',
    maintenance: 'Under Maintenance',
    stopped: 'Stopped',
    alert: 'Alert',
    low: 'Low',
    medium: 'Medium',
    high: 'High',
    critical: 'Critical'
  },
  workOrder: {
    title: 'Work Orders',
    new: 'New Work Order',
    edit: 'Edit Work Order',
    number: 'Number',
    equipment: 'Equipment',
    priority: 'Priority',
    status: 'Status',
    open: 'Open',
    inProgress: 'In Progress',
    paused: 'Paused',
    completed: 'Completed',
    cancelled: 'Cancelled',
    urgent: 'Urgent',
    responsible: 'Responsible',
    team: 'Team',
    estimatedCost: 'Estimated Cost',
    actualCost: 'Actual Cost'
  },
  components: {
    title: 'Components',
    new: 'New Component',
    edit: 'Edit Component',
    code: 'Code',
    brand: 'Brand',
    stock: 'Stock',
    minStock: 'Minimum Stock',
    unitPrice: 'Unit Price'
  },
  reports: {
    title: 'Reports',
    generate: 'Generate Report',
    export: 'Export',
    pdf: 'Export PDF',
    excel: 'Export Excel',
    period: 'Period',
    consolidated: 'Consolidated Report'
  },
  predictions: {
    title: 'Failure Prediction',
    probability: 'Failure Probability',
    daysUntilFailure: 'Days Until Failure',
    confidence: 'Confidence',
    riskFactors: 'Risk Factors',
    recommendations: 'Recommendations',
    highRisk: 'High Risk',
    mediumRisk: 'Medium Risk',
    lowRisk: 'Low Risk',
    criticalRisk: 'Critical Risk'
  }
};

// Traduções em Espanhol
const esES: Translation = {
  common: {
    save: 'Guardar',
    cancel: 'Cancelar',
    delete: 'Eliminar',
    edit: 'Editar',
    create: 'Crear',
    search: 'Buscar',
    filter: 'Filtrar',
    loading: 'Cargando...',
    noData: 'No hay datos disponibles',
    confirm: 'Confirmar',
    back: 'Volver',
    next: 'Siguiente',
    previous: 'Anterior',
    close: 'Cerrar',
    yes: 'Sí',
    no: 'No',
    all: 'Todos',
    actions: 'Acciones',
    details: 'Detalles',
    status: 'Estado',
    date: 'Fecha',
    description: 'Descripción',
    name: 'Nombre',
    type: 'Tipo',
    priority: 'Prioridad',
    cost: 'Costo',
    total: 'Total'
  },
  auth: {
    login: 'Iniciar sesión',
    logout: 'Cerrar sesión',
    email: 'Correo electrónico',
    password: 'Contraseña',
    forgotPassword: '¿Olvidó su contraseña?',
    rememberMe: 'Recuérdame',
    loginError: 'Error al iniciar sesión',
    invalidCredentials: 'Credenciales inválidas'
  },
  dashboard: {
    title: 'Panel de Control',
    welcome: 'Bienvenido',
    overview: 'Resumen',
    statistics: 'Estadísticas',
    recentActivity: 'Actividad Reciente'
  },
  equipment: {
    title: 'Equipos',
    new: 'Nuevo Equipo',
    edit: 'Editar Equipo',
    delete: 'Eliminar Equipo',
    name: 'Nombre del Equipo',
    sector: 'Sector',
    manufacturer: 'Fabricante',
    model: 'Modelo',
    year: 'Año de Fabricación',
    criticality: 'Criticidad',
    status: 'Estado',
    operational: 'Operacional',
    maintenance: 'En Mantenimiento',
    stopped: 'Detenido',
    alert: 'Alerta',
    low: 'Baja',
    medium: 'Media',
    high: 'Alta',
    critical: 'Crítica'
  },
  workOrder: {
    title: 'Órdenes de Servicio',
    new: 'Nueva Orden de Servicio',
    edit: 'Editar Orden de Servicio',
    number: 'Número',
    equipment: 'Equipo',
    priority: 'Prioridad',
    status: 'Estado',
    open: 'Abierta',
    inProgress: 'En Progreso',
    paused: 'Pausada',
    completed: 'Completada',
    cancelled: 'Cancelada',
    urgent: 'Urgente',
    responsible: 'Responsable',
    team: 'Equipo',
    estimatedCost: 'Costo Estimado',
    actualCost: 'Costo Real'
  },
  components: {
    title: 'Componentes',
    new: 'Nuevo Componente',
    edit: 'Editar Componente',
    code: 'Código',
    brand: 'Marca',
    stock: 'Stock',
    minStock: 'Stock Mínimo',
    unitPrice: 'Precio Unitario'
  },
  reports: {
    title: 'Informes',
    generate: 'Generar Informe',
    export: 'Exportar',
    pdf: 'Exportar PDF',
    excel: 'Exportar Excel',
    period: 'Período',
    consolidated: 'Informe Consolidado'
  },
  predictions: {
    title: 'Predicción de Fallas',
    probability: 'Probabilidad de Falla',
    daysUntilFailure: 'Días hasta Falla',
    confidence: 'Confianza',
    riskFactors: 'Factores de Riesgo',
    recommendations: 'Recomendaciones',
    highRisk: 'Alto Riesgo',
    mediumRisk: 'Riesgo Medio',
    lowRisk: 'Bajo Riesgo',
    criticalRisk: 'Riesgo Crítico'
  }
};

export const languages: LanguageData[] = [
  {
    code: 'pt-BR',
    name: 'Português (Brasil)',
    flag: '🇧🇷',
    translations: ptBR
  },
  {
    code: 'en-US',
    name: 'English (US)',
    flag: '🇺🇸',
    translations: enUS
  },
  {
    code: 'es-ES',
    name: 'Español',
    flag: '🇪🇸',
    translations: esES
  }
];

// Hook para usar traduções
export function useTranslation(language: string = 'pt-BR') {
  const lang = languages.find(l => l.code === language) || languages[0];
  
  const t = (key: string): string => {
    const keys = key.split('.');
    let value: any = lang.translations;
    
    for (const k of keys) {
      if (value && typeof value === 'object') {
        value = value[k];
      } else {
        return key;
      }
    }
    
    return typeof value === 'string' ? value : key;
  };
  
  return { t, language: lang };
}

// Salvar idioma preferido
export function saveLanguagePreference(languageCode: string) {
  localStorage.setItem('preferred_language', languageCode);
}

// Carregar idioma preferido
export function loadLanguagePreference(): string {
  return localStorage.getItem('preferred_language') || i18nConfig.defaultLanguage;
}
