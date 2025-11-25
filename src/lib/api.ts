import { supabase } from './supabase';

// ==================== EQUIPAMENTOS ====================
export const equipamentosAPI = {
  async getAll() {
    try {
      const { data, error } = await supabase
        .from('equipamentos')
        .select(`
          *,
          setores (
            id,
            nome
          )
        `)
        .order('nome');

      if (error) {
        console.error('Erro ao buscar equipamentos:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Erro na API de equipamentos:', error);
      return [];
    }
  },

  async getById(id: string) {
    try {
      const { data, error } = await supabase
        .from('equipamentos')
        .select(`
          *,
          setores (
            id,
            nome
          )
        `)
        .eq('id', id)
        .single();

      if (error) {
        console.error('Erro ao buscar equipamento:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Erro na API de equipamento:', error);
      return null;
    }
  },

  async create(equipamento: any) {
    try {
      console.debug('[equipamentosAPI.create] payload:', equipamento);
      const { data, error } = await supabase
        .from('equipamentos')
        .insert([equipamento])
        .select()
        .single();

      if (error) {
        console.error('Erro ao criar equipamento:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Erro na criação do equipamento:', error);
      throw error;
    }
  },

  async update(id: string, equipamento: any) {
    try {
      console.debug('[equipamentosAPI.update] id:', id, 'payload:', equipamento);
      const { data, error } = await supabase
        .from('equipamentos')
        .update(equipamento)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Erro ao atualizar equipamento:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Erro na atualização do equipamento:', error);
      throw error;
    }
  },

  async delete(id: string) {
    try {
      const { error } = await supabase
        .from('equipamentos')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Erro ao deletar equipamento:', error);
        throw error;
      }

      return true;
    } catch (error) {
      console.error('Erro na exclusão do equipamento:', error);
      throw error;
    }
  }
};

// ==================== COMPONENTES ====================
export const componentesAPI = {
  async getAll() {
    try {
      const { data, error } = await supabase
        .from('componentes')
        .select(`
          *,
          tipos_componentes (
            id,
            nome
          )
        `)
        .order('nome');

      if (error) {
        console.error('Erro ao buscar componentes:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Erro na API de componentes:', error);
      return [];
    }
  },

  async getById(id: string) {
    try {
      const { data, error } = await supabase
        .from('componentes')
        .select(`
          *,
          tipos_componentes (
            id,
            nome
          )
        `)
        .eq('id', id)
        .single();

      if (error) {
        console.error('Erro ao buscar componente:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Erro na API de componente:', error);
      return null;
    }
  },

  async create(componente: any) {
    try {
      const { data, error } = await supabase
        .from('componentes')
        .insert([componente])
        .select()
        .single();

      if (error) {
        console.error('Erro ao criar componente:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Erro na criação do componente:', error);
      throw error;
    }
  },

  async update(id: string, componente: any) {
    try {
      const { data, error } = await supabase
        .from('componentes')
        .update(componente)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Erro ao atualizar componente:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Erro na atualização do componente:', error);
      throw error;
    }
  },

  async delete(id: string) {
    try {
      const { error } = await supabase
        .from('componentes')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Erro ao deletar componente:', error);
        throw error;
      }

      return true;
    } catch (error) {
      console.error('Erro na exclusão do componente:', error);
      throw error;
    }
  }
};

// ==================== ORDENS DE SERVIÇO ====================
export const ordensServicoAPI = {
  async getAll() {
    try {
      const { data, error } = await supabase
        .from('ordens_servico')
        .select(`
          *,
          equipamentos (
            id,
            nome
          )
        `)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Erro ao buscar ordens de serviço:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Erro na API de ordens de serviço:', error);
      return [];
    }
  },

  async getById(id: string) {
    try {
      const { data, error } = await supabase
        .from('ordens_servico')
        .select(`
          *,
          equipamentos (
            id,
            nome
          )
        `)
        .eq('id', id)
        .single();

      if (error) {
        console.error('Erro ao buscar ordem de serviço:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Erro na API de ordem de serviço:', error);
      return null;
    }
  },

  async create(os: any) {
    try {
      const { data, error } = await supabase
        .from('ordens_servico')
        .insert([os])
        .select()
        .single();

      if (error) {
        console.error('Erro ao criar ordem de serviço:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Erro na criação da ordem de serviço:', error);
      throw error;
    }
  },

  async update(id: string, os: any) {
    try {
      const { data, error } = await supabase
        .from('ordens_servico')
        .update(os)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Erro ao atualizar ordem de serviço:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Erro na atualização da ordem de serviço:', error);
      throw error;
    }
  },

  async delete(id: string) {
    try {
      const { error } = await supabase
        .from('ordens_servico')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Erro ao deletar ordem de serviço:', error);
        throw error;
      }

      return true;
    } catch (error) {
      console.error('Erro na exclusão da ordem de serviço:', error);
      throw error;
    }
  }
};

// ==================== CUSTOS ====================
export const custosAPI = {
  getAll: async () => {
    const { data, error } = await supabase
      .from('custos')
      .select('*, equipamentos(nome), componentes(nome)')
      .order('data', { ascending: false });
    if (error) throw error;
    return data;
  },

  getById: async (id: string) => {
    const { data, error } = await supabase
      .from('custos')
      .select('*, equipamentos(nome), componentes(nome)')
      .eq('id', id)
      .single();
    if (error) throw error;
    return data;
  },

  create: async (custo: any) => {
    const { data, error } = await supabase
      .from('custos')
      .insert(custo)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  update: async (id: string, custo: any) => {
    const { data, error } = await supabase
      .from('custos')
      .update(custo)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  delete: async (id: string) => {
    const { error } = await supabase
      .from('custos')
      .delete()
      .eq('id', id);
    if (error) throw error;
  },

  getTotalPorEquipamento: async () => {
    const { data, error } = await supabase
      .rpc('get_custos_por_equipamento');
    if (error) throw error;
    return data;
  },

  getTotalPorTipo: async () => {
    const { data, error } = await supabase
      .rpc('get_custos_por_tipo');
    if (error) throw error;
    return data;
  },
};

// ==================== MELHORIAS ====================
export const melhoriasAPI = {
  async getAll() {
    try {
      const { data, error } = await supabase
        .from('melhorias')
        .select(`
          *,
          equipamentos (
            id,
            nome
          )
        `)
        .order('data_criacao', { ascending: false });

      if (error) {
        console.error('Erro ao buscar melhorias:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Erro na API de melhorias:', error);
      return [];
    }
  },

  async getById(id: string) {
    try {
      const { data, error } = await supabase
        .from('melhorias')
        .select(`
          *,
          equipamentos (
            id,
            nome
          )
        `)
        .eq('id', id)
        .single();

      if (error) {
        console.error('Erro ao buscar melhoria:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Erro na API de melhoria:', error);
      return null;
    }
  },

  async create(melhoria: any) {
    try {
      const { data, error } = await supabase
        .from('melhorias')
        .insert([melhoria])
        .select()
        .single();

      if (error) {
        console.error('Erro ao criar melhoria:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Erro na criação da melhoria:', error);
      throw error;
    }
  },

  async update(id: string, melhoria: any) {
    try {
      const { data, error } = await supabase
        .from('melhorias')
        .update(melhoria)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Erro ao atualizar melhoria:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Erro na atualização da melhoria:', error);
      throw error;
    }
  },

  async delete(id: string) {
    try {
      const { error } = await supabase
        .from('melhorias')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Erro ao deletar melhoria:', error);
        throw error;
      }

      return true;
    } catch (error) {
      console.error('Erro na exclusão da melhoria:', error);
      throw error;
    }
  }
};

// ==================== EQUIPES ====================
export const equipesAPI = {
  getAll: async () => {
    const { data, error } = await supabase
      .from('equipes')
      .select('*')
      .order('nome');
    if (error) throw error;
    return data;
  },

  getById: async (id: string) => {
    const { data, error } = await supabase
      .from('equipes')
      .select('*')
      .eq('id', id)
      .single();
    if (error) throw error;
    return data;
  },

  create: async (equipe: any) => {
    console.debug('[equipesAPI.create] payload:', equipe);
    const { data, error } = await supabase
      .from('equipes')
      .insert(equipe)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  update: async (id: string, equipe: any) => {
    console.debug('[equipesAPI.update] id:', id, 'payload:', equipe);
    const { data, error } = await supabase
      .from('equipes')
      .update(equipe)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  delete: async (id: string) => {
    const { error } = await supabase
      .from('equipes')
      .delete()
      .eq('id', id);
    if (error) throw error;
  },
};

// ==================== SERVIÇOS ====================
export const servicosAPI = {
  getAll: async () => {
    const { data, error } = await supabase
      .from('servicos')
      .select('*')
      .order('nome');
    if (error) throw error;
    return data;
  },

  getById: async (id: string) => {
    const { data, error } = await supabase
      .from('servicos')
      .select('*')
      .eq('id', id)
      .single();
    if (error) throw error;
    return data;
  },

  create: async (servico: any) => {
    console.debug('[servicosAPI.create] payload:', servico);
    const { data, error } = await supabase
      .from('servicos')
      .insert([servico])
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  update: async (id: string, servico: any) => {
    console.debug('[servicosAPI.update] id:', id, 'payload:', servico);
    const { data, error } = await supabase
      .from('servicos')
      .update(servico)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  delete: async (id: string) => {
    const { error } = await supabase
      .from('servicos')
      .delete()
      .eq('id', id);
    if (error) throw error;
  }
};

// ==================== COLABORADORES ====================
export const colaboradoresAPI = {
  getAll: async () => {
    const { data, error } = await supabase
      .from('colaboradores')
      .select('*')
      .order('nome');
    if (error) throw error;
    return data;
  },

  getById: async (id: string) => {
    const { data, error } = await supabase
      .from('colaboradores')
      .select('*')
      .eq('id', id)
      .single();
    if (error) throw error;
    return data;
  },

  create: async (colaborador: any) => {
    const { data, error } = await supabase
      .from('colaboradores')
      .insert(colaborador)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  update: async (id: string, colaborador: any) => {
    const { data, error } = await supabase
      .from('colaboradores')
      .update(colaborador)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  delete: async (id: string) => {
    const { error } = await supabase
      .from('colaboradores')
      .delete()
      .eq('id', id);
    if (error) throw error;
  },
};

// ==================== USUÁRIOS ====================
export const usuariosAPI = {
  getAll: async () => {
    const { data, error } = await supabase
      .from('usuarios')
      .select('*')
      .order('nome');
    if (error) throw error;
    return data;
  },

  getById: async (id: string) => {
    const { data, error } = await supabase
      .from('usuarios')
      .select('*')
      .eq('id', id)
      .single();
    if (error) throw error;
    return data;
  },

  create: async (usuario: any) => {
    const { data, error } = await supabase
      .from('usuarios')
      .insert(usuario)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  update: async (id: string, usuario: any) => {
    const { data, error } = await supabase
      .from('usuarios')
      .update(usuario)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  delete: async (id: string) => {
    const { error } = await supabase
      .from('usuarios')
      .delete()
      .eq('id', id);
    if (error) throw error;
  },
};

// ==================== MAPA ====================
export const mapaAPI = {
  getAll: async () => {
    const { data, error } = await supabase
      .from('equipamento_mapa')
      .select('*, equipamentos(nome, status_revisao, criticidade)')
      .order('id');
    if (error) throw error;
    return data;
  },

  getById: async (id: string) => {
    const { data, error } = await supabase
      .from('equipamento_mapa')
      .select('*, equipamentos(*)')
      .eq('id', id)
      .single();
    if (error) throw error;
    return data;
  },

  create: async (mapa: any) => {
    const { data, error } = await supabase
      .from('equipamento_mapa')
      .insert(mapa)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  update: async (id: string, mapa: any) => {
    const { data, error } = await supabase
      .from('equipamento_mapa')
      .update(mapa)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  delete: async (id: string) => {
    const { error } = await supabase
      .from('equipamento_mapa')
      .delete()
      .eq('id', id);
    if (error) throw error;
  },
};

// ==================== MAPA HOTSPOTS ====================
export const mapaHotspotsAPI = {
  getAll: async () => {
    const { data, error } = await supabase
      .from('equipamento_mapa')
      .select('*')
      .order('id');
    if (error) throw error;
    return data;
  },

  getById: async (id: string) => {
    const { data, error } = await supabase
      .from('equipamento_mapa')
      .select('*')
      .eq('id', id)
      .single();
    if (error) throw error;
    return data;
  },

  create: async (hotspot: any) => {
    const { data, error } = await supabase
      .from('equipamento_mapa')
      .insert([hotspot])
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  update: async (id: string, hotspot: any) => {
    const { data, error } = await supabase
      .from('equipamento_mapa')
      .update(hotspot)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  delete: async (id: string) => {
    const { error } = await supabase
      .from('equipamento_mapa')
      .delete()
      .eq('id', id);
    if (error) throw error;
    return true;
  },
};

// ==================== PANORAMAS ====================
export const panoramasAPI = {
  getAll: async () => {
    const { data, error } = await supabase
      .from('panoramas')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data;
  },

  getById: async (id: string) => {
    const { data, error } = await supabase
      .from('panoramas')
      .select('*')
      .eq('id', id)
      .single();
    if (error) throw error;
    return data;
  },

  create: async (panorama: any) => {
    const { data, error } = await supabase
      .from('panoramas')
      .insert([panorama])
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  update: async (id: string, panorama: any) => {
    const { data, error } = await supabase
      .from('panoramas')
      .update(panorama)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  delete: async (id: string) => {
    const { error } = await supabase
      .from('panoramas')
      .delete()
      .eq('id', id);
    if (error) throw error;
    return true;
  },
};
