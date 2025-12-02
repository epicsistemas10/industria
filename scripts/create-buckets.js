// scripts/create-buckets.js
// Script para criar buckets no Supabase usando a Service Role Key
// Uso: setar SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY no ambiente e rodar: node scripts/create-buckets.js

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Erro: defina SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY no ambiente');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function create() {
  const buckets = ['equipamentos', 'componentes', 'ordens_servico', 'melhorias', 'usuarios'];

  for (const bucket of buckets) {
    try {
      const { data, error } = await supabase.storage.createBucket(bucket, {
        public: true,
        fileSizeLimit: 5242880,
        allowedMimeTypes: ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'],
      });

      if (error) {
        // Se já existir, o erro costuma conter 'already exists'
        if (error.message && error.message.toLowerCase().includes('already exists')) {
          console.log(`Bucket '${bucket}' já existe`);
        } else {
          console.error(`Erro ao criar bucket '${bucket}':`, error.message || error);
        }
      } else {
        console.log(`Bucket '${bucket}' criado com sucesso`);
      }
    } catch (e) {
      console.error(`Erro inesperado ao criar bucket '${bucket}':`, e.message || e);
    }
  }
}

create().then(() => process.exit(0)).catch(() => process.exit(1));
