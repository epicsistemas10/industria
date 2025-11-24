import{s as t}from"./index-FRp6wVcD.js";const s={async getAll(){try{const{data:e,error:r}=await t.from("equipamentos").select(`
          *,
          setores (
            id,
            nome
          )
        `).order("nome");return r?(console.error("Erro ao buscar equipamentos:",r),[]):e||[]}catch(e){return console.error("Erro na API de equipamentos:",e),[]}},async getById(e){try{const{data:r,error:o}=await t.from("equipamentos").select(`
          *,
          setores (
            id,
            nome
          )
        `).eq("id",e).single();return o?(console.error("Erro ao buscar equipamento:",o),null):r}catch(r){return console.error("Erro na API de equipamento:",r),null}},async create(e){try{console.debug("[equipamentosAPI.create] payload:",e);const{data:r,error:o}=await t.from("equipamentos").insert([e]).select().single();if(o)throw console.error("Erro ao criar equipamento:",o),o;return r}catch(r){throw console.error("Erro na criação do equipamento:",r),r}},async update(e,r){try{console.debug("[equipamentosAPI.update] id:",e,"payload:",r);const{data:o,error:a}=await t.from("equipamentos").update(r).eq("id",e).select().single();if(a)throw console.error("Erro ao atualizar equipamento:",a),a;return o}catch(o){throw console.error("Erro na atualização do equipamento:",o),o}},async delete(e){try{const{error:r}=await t.from("equipamentos").delete().eq("id",e);if(r)throw console.error("Erro ao deletar equipamento:",r),r;return!0}catch(r){throw console.error("Erro na exclusão do equipamento:",r),r}}},c={async getAll(){try{const{data:e,error:r}=await t.from("componentes").select(`
          *,
          tipos_componentes (
            id,
            nome
          )
        `).order("nome");return r?(console.error("Erro ao buscar componentes:",r),[]):e||[]}catch(e){return console.error("Erro na API de componentes:",e),[]}},async getById(e){try{const{data:r,error:o}=await t.from("componentes").select(`
          *,
          tipos_componentes (
            id,
            nome
          )
        `).eq("id",e).single();return o?(console.error("Erro ao buscar componente:",o),null):r}catch(r){return console.error("Erro na API de componente:",r),null}},async create(e){try{const{data:r,error:o}=await t.from("componentes").insert([e]).select().single();if(o)throw console.error("Erro ao criar componente:",o),o;return r}catch(r){throw console.error("Erro na criação do componente:",r),r}},async update(e,r){try{const{data:o,error:a}=await t.from("componentes").update(r).eq("id",e).select().single();if(a)throw console.error("Erro ao atualizar componente:",a),a;return o}catch(o){throw console.error("Erro na atualização do componente:",o),o}},async delete(e){try{const{error:r}=await t.from("componentes").delete().eq("id",e);if(r)throw console.error("Erro ao deletar componente:",r),r;return!0}catch(r){throw console.error("Erro na exclusão do componente:",r),r}}},i={async getAll(){try{const{data:e,error:r}=await t.from("ordens_servico").select(`
          *,
          equipamentos (
            id,
            nome
          )
        `).order("created_at",{ascending:!1});return r?(console.error("Erro ao buscar ordens de serviço:",r),[]):e||[]}catch(e){return console.error("Erro na API de ordens de serviço:",e),[]}},async getById(e){try{const{data:r,error:o}=await t.from("ordens_servico").select(`
          *,
          equipamentos (
            id,
            nome
          )
        `).eq("id",e).single();return o?(console.error("Erro ao buscar ordem de serviço:",o),null):r}catch(r){return console.error("Erro na API de ordem de serviço:",r),null}},async create(e){try{const{data:r,error:o}=await t.from("ordens_servico").insert([e]).select().single();if(o)throw console.error("Erro ao criar ordem de serviço:",o),o;return r}catch(r){throw console.error("Erro na criação da ordem de serviço:",r),r}},async update(e,r){try{const{data:o,error:a}=await t.from("ordens_servico").update(r).eq("id",e).select().single();if(a)throw console.error("Erro ao atualizar ordem de serviço:",a),a;return o}catch(o){throw console.error("Erro na atualização da ordem de serviço:",o),o}},async delete(e){try{const{error:r}=await t.from("ordens_servico").delete().eq("id",e);if(r)throw console.error("Erro ao deletar ordem de serviço:",r),r;return!0}catch(r){throw console.error("Erro na exclusão da ordem de serviço:",r),r}}},l={getAll:async()=>{const{data:e,error:r}=await t.from("custos").select("*, equipamentos(nome), componentes(nome)").order("data",{ascending:!1});if(r)throw r;return e},getById:async e=>{const{data:r,error:o}=await t.from("custos").select("*, equipamentos(nome), componentes(nome)").eq("id",e).single();if(o)throw o;return r},create:async e=>{const{data:r,error:o}=await t.from("custos").insert(e).select().single();if(o)throw o;return r},update:async(e,r)=>{const{data:o,error:a}=await t.from("custos").update(r).eq("id",e).select().single();if(a)throw a;return o},delete:async e=>{const{error:r}=await t.from("custos").delete().eq("id",e);if(r)throw r},getTotalPorEquipamento:async()=>{const{data:e,error:r}=await t.rpc("get_custos_por_equipamento");if(r)throw r;return e},getTotalPorTipo:async()=>{const{data:e,error:r}=await t.rpc("get_custos_por_tipo");if(r)throw r;return e}},d={async getAll(){try{const{data:e,error:r}=await t.from("melhorias").select(`
          *,
          equipamentos (
            id,
            nome
          )
        `).order("data_criacao",{ascending:!1});return r?(console.error("Erro ao buscar melhorias:",r),[]):e||[]}catch(e){return console.error("Erro na API de melhorias:",e),[]}},async getById(e){try{const{data:r,error:o}=await t.from("melhorias").select(`
          *,
          equipamentos (
            id,
            nome
          )
        `).eq("id",e).single();return o?(console.error("Erro ao buscar melhoria:",o),null):r}catch(r){return console.error("Erro na API de melhoria:",r),null}},async create(e){try{const{data:r,error:o}=await t.from("melhorias").insert([e]).select().single();if(o)throw console.error("Erro ao criar melhoria:",o),o;return r}catch(r){throw console.error("Erro na criação da melhoria:",r),r}},async update(e,r){try{const{data:o,error:a}=await t.from("melhorias").update(r).eq("id",e).select().single();if(a)throw console.error("Erro ao atualizar melhoria:",a),a;return o}catch(o){throw console.error("Erro na atualização da melhoria:",o),o}},async delete(e){try{const{error:r}=await t.from("melhorias").delete().eq("id",e);if(r)throw console.error("Erro ao deletar melhoria:",r),r;return!0}catch(r){throw console.error("Erro na exclusão da melhoria:",r),r}}},u={getAll:async()=>{const{data:e,error:r}=await t.from("equipes").select("*").order("nome");if(r)throw r;return e},getById:async e=>{const{data:r,error:o}=await t.from("equipes").select("*").eq("id",e).single();if(o)throw o;return r},create:async e=>{console.debug("[equipesAPI.create] payload:",e);const{data:r,error:o}=await t.from("equipes").insert(e).select().single();if(o)throw o;return r},update:async(e,r)=>{console.debug("[equipesAPI.update] id:",e,"payload:",r);const{data:o,error:a}=await t.from("equipes").update(r).eq("id",e).select().single();if(a)throw a;return o},delete:async e=>{const{error:r}=await t.from("equipes").delete().eq("id",e);if(r)throw r}},m={getAll:async()=>{const{data:e,error:r}=await t.from("servicos").select("*").order("nome");if(r)throw r;return e},getById:async e=>{const{data:r,error:o}=await t.from("servicos").select("*").eq("id",e).single();if(o)throw o;return r},create:async e=>{console.debug("[servicosAPI.create] payload:",e);const{data:r,error:o}=await t.from("servicos").insert([e]).select().single();if(o)throw o;return r},update:async(e,r)=>{console.debug("[servicosAPI.update] id:",e,"payload:",r);const{data:o,error:a}=await t.from("servicos").update(r).eq("id",e).select().single();if(a)throw a;return o},delete:async e=>{const{error:r}=await t.from("servicos").delete().eq("id",e);if(r)throw r}};export{u as a,l as b,c,s as e,d as m,i as o,m as s};
//# sourceMappingURL=api-DesrtcF2.js.map
