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
      const payload = { ...equipamento };
      // Filter payload to allowed equipamento columns to avoid PostgREST errors
      const allowed = new Set([
        'nome', 'setor_id', 'descricao', 'fabricante', 'modelo', 'ano_fabricacao',
        'criticidade', 'status_revisao', 'foto_url', 'mtbf', 'data_inicio_revisao', 'data_prevista_fim',
        'posicao_x', 'posicao_y', 'codigo_interno', 'linha_setor', 'serie', 'dimensao', 'peso', 'especificacoes', 'motores'
      ]);
      // allow optional equipment number
      allowed.add('numero');
      const filtered: any = {};
      Object.entries(payload).forEach(([k, v]) => {
        if (allowed.has(k)) filtered[k] = v;
      });
      // Convert empty date strings to null to avoid Postgres errors
      if (filtered.data_inicio_revisao === '') filtered.data_inicio_revisao = null;
      if (filtered.data_prevista_fim === '') filtered.data_prevista_fim = null;

      // Avoid requesting returned columns via .select() here because
      // some PostgREST setups (and long/complex return queries) can
      // produce 400 errors. Insert and return the payload on success.
      const { data, error } = await supabase
        .from('equipamentos')
        .insert([filtered]);

      if (error) {
        console.error('Erro ao criar equipamento:', JSON.stringify(error, Object.getOwnPropertyNames(error)));
        throw error;
      }

      // If PostgREST returned the created row, prefer it; otherwise return the payload
      return (data && data[0]) || payload;
    } catch (error) {
      console.error('Erro na criação do equipamento:', error);
      throw error;
    }
  },

  async update(id: string, equipamento: any) {
    try {
      console.debug('[equipamentosAPI.update] id:', id, 'payload:', equipamento);
      const payload = { ...equipamento };
      const allowed = new Set([
        'nome', 'setor_id', 'descricao', 'fabricante', 'modelo', 'ano_fabricacao',
        'criticidade', 'status_revisao', 'foto_url', 'mtbf', 'data_inicio_revisao', 'data_prevista_fim',
        'posicao_x', 'posicao_y', 'codigo_interno', 'linha_setor', 'serie', 'dimensao', 'peso', 'especificacoes', 'motores'
      ]);
      // allow optional equipment number
      allowed.add('numero');
      const filtered: any = {};
      Object.entries(payload).forEach(([k, v]) => {
        if (allowed.has(k)) filtered[k] = v;
      });
      // Convert empty date strings to null to avoid Postgres errors
      if (filtered.data_inicio_revisao === '') filtered.data_inicio_revisao = null;
      if (filtered.data_prevista_fim === '') filtered.data_prevista_fim = null;

      // Similar to create: avoid .select() after update to prevent malformed return queries
      const { data, error } = await supabase
        .from('equipamentos')
        .update(filtered)
        .eq('id', id);

      if (error) {
        console.error('Erro ao atualizar equipamento:', JSON.stringify(error, Object.getOwnPropertyNames(error)));
        throw error;
      }

      return (data && data[0]) || payload;
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

  /**
   * Gera o próximo código interno sequencial para um prefixo de 3 letras.
   * Ex: prefix = 'COM' -> busca último 'COM###' e retorna 'COM' + next number padded 3 digits.
   */
  async getNextCodigo(prefix: string) {
    try {
      const likePattern = `${prefix}%`;
      const { data, error } = await supabase
        .from('componentes')
        .select('codigo_interno')
        .ilike('codigo_interno', likePattern)
        .order('codigo_interno', { ascending: false })
        .limit(1);

      if (error) {
        console.error('Erro ao buscar último código interno:', error);
        throw error;
      }

      let nextNumber = 1;
      if (data && data.length > 0 && data[0].codigo_interno) {
        const lastCode: string = data[0].codigo_interno as string;
        const suffix = lastCode.replace(/[^0-9]/g, '');
        const num = parseInt(suffix || '0', 10);
        if (!isNaN(num)) nextNumber = num + 1;
      }

      const nextStr = String(nextNumber).padStart(3, '0');
      return `${prefix}${nextStr}`;
    } catch (error) {
      console.error('Erro ao gerar próximo código interno:', error);
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

// ==================== SETORES ====================
export const setoresAPI = {
  getAll: async () => {
    const { data, error } = await supabase
      .from('setores')
      .select('*')
      .order('nome');
    if (error) throw error;
    return data;
  },

  getById: async (id: string) => {
    const { data, error } = await supabase
      .from('setores')
      .select('*')
      .eq('id', id)
      .single();
    if (error) throw error;
    return data;
  },

  create: async (setor: any) => {
    console.debug('[setoresAPI.create] payload:', setor);
    const { data, error } = await supabase
      .from('setores')
      .insert([setor])
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  update: async (id: string, setor: any) => {
    console.debug('[setoresAPI.update] id:', id, 'payload:', setor);
    const { data, error } = await supabase
      .from('setores')
      .update(setor)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  delete: async (id: string) => {
    const { error } = await supabase
      .from('setores')
      .delete()
      .eq('id', id);
    if (error) throw error;
    return true;
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
    // Normalize frontend camelCase keys to DB snake_case column names
    const payload: any = { ...hotspot };
    if ('fontSize' in payload) {
      payload.font_size = payload.fontSize;
      delete payload.fontSize;
    }

    // ensure only known columns are sent to avoid PostgREST 400 errors
    const allowed = new Set(['equipamento_id', 'x', 'y', 'width', 'height', 'color', 'font_size', 'icon']);
    const filtered: any = {};
    Object.entries(payload).forEach(([k, v]) => {
      if (allowed.has(k)) filtered[k] = v;
    });

    const { data, error } = await supabase
      .from('equipamento_mapa')
      .insert([filtered])
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  update: async (id: string, hotspot: any) => {
    // Normalize camelCase keys to DB snake_case
    const payload: any = { ...hotspot };
    if ('fontSize' in payload) {
      payload.font_size = payload.fontSize;
      delete payload.fontSize;
    }

    // Filter allowed columns to avoid PostgREST complaining about unknown columns
    const allowed = new Set(['equipamento_id', 'x', 'y', 'width', 'height', 'color', 'font_size', 'icon']);
    const filtered: any = {};
    Object.entries(payload).forEach(([k, v]) => {
      if (allowed.has(k)) filtered[k] = v;
    });

    const { data, error } = await supabase
      .from('equipamento_mapa')
      .update(filtered)
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

// ==================== GRUPO EQUIPAMENTOS ====================
export const grupoEquipamentosAPI = {
  getAll: async () => {
    const { data, error } = await supabase
      .from('grupo_equipamentos')
      .select('*')
      .order('nome');
    if (error) throw error;
    return data || [];
  },

  getById: async (id: string) => {
    const { data, error } = await supabase
      .from('grupo_equipamentos')
      .select('*')
      .eq('id', id)
      .single();
    if (error) throw error;
    return data;
  },

  create: async (grupo: any) => {
    const { data, error } = await supabase
      .from('grupo_equipamentos')
      .insert([grupo])
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  update: async (id: string, grupo: any) => {
    const { data, error } = await supabase
      .from('grupo_equipamentos')
      .update(grupo)
      .eq('id', id)
      .select();

    // Some PostgREST setups or RLS/policies may cause update to return 0 rows.
    // Return the first row when available, otherwise return null (caller should handle).
    if (error) throw error;
    return (data && data[0]) || null;
  },

  delete: async (id: string) => {
    const { error } = await supabase
      .from('grupo_equipamentos')
      .delete()
      .eq('id', id);
    if (error) throw error;
    return true;
  },

  getMembers: async (grupoId: string) => {
    const { data, error } = await supabase
      .from('grupo_equipamentos_members')
      .select('equipamento_id')
      .eq('grupo_id', grupoId);
    if (error) throw error;
    return (data || []).map((d: any) => d.equipamento_id);
  }
};

// ==================== PLANEJAMENTO ====================
export const planejamentoAPI = {
  createPlanning: async (planning: any, items: any[]) => {
    // creates planejamento_semanal and planejamento_itens
    const { data: pData, error: pErr } = await supabase
      .from('planejamento_semanal')
      .insert([planning])
      .select()
      .single();
    if (pErr) throw pErr;
    const planningId = (pData as any).id;
    if (items && items.length > 0) {
      const toInsert = items.map(i => ({ ...i, planejamento_id: planningId }));
      const { error: itemsErr } = await supabase.from('planejamento_itens').insert(toInsert);
      if (itemsErr) throw itemsErr;
    }
    return pData;
  },

  addExecution: async (itemId: string, exec: any) => {
    // exec: { responsavel_id, iniciado_em?, finalizado_em?, observacao }
    const payload = { ...exec, item_id: itemId };
    const { data, error } = await supabase.from('planejamento_execucoes').insert([payload]).select().single();
    if (error) throw error;
    // update item status accordingly
    const status = exec.finalizado_em ? 'concluido' : exec.iniciado_em ? 'iniciado' : undefined;
    if (status) {
      const { error: uErr } = await supabase.from('planejamento_itens').update({ status }).eq('id', itemId);
      if (uErr) console.warn('Não foi possível atualizar status do item:', uErr);
    }
    return data;
  },

  generateOsFromItems: async (items: { equipamento_id: string; servico_id: string; equipe_id?: string; responsavel_id?: string; }[]) => {
    // creates ordens_servico per equipment grouping services into one OS per equipment
    const byEquip: Record<string, any[]> = {};
    items.forEach(it => {
      if (!byEquip[it.equipamento_id]) byEquip[it.equipamento_id] = [];
      byEquip[it.equipamento_id].push(it);
    });

    const created: any[] = [];
    for (const equipamentoId of Object.keys(byEquip)) {
      const services = byEquip[equipamentoId];
      // create a single OS for this equipment containing references in description
      const osPayload: any = {
        equipamento_id: equipamentoId,
        equipe_id: services[0].equipe_id || null,
        criado_por: services[0].responsavel_id || null,
        status: 'aberta',
        descricao: `OS automática gerada para ${services.length} serviço(s): ${services.map(s => s.servico_id).join(',')}`
      };
      const { data, error } = await supabase.from('ordens_servico').insert([osPayload]).select().single();
      if (error) throw error;
      created.push(data);
      // Optionally link services to OS in os_servicos table if exists (not implemented here)
    }
    return created;
  }
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
