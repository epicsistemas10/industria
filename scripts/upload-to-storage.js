#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('Defina SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY no ambiente.');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

const filePath = process.argv[2];
if (!filePath) {
  console.error('Uso: node scripts/upload-to-storage.js path/to/file.jpg');
  process.exit(1);
}

if (!fs.existsSync(filePath)) {
  console.error('Arquivo não encontrado:', filePath);
  process.exit(1);
}

const fileName = `${Date.now()}-${path.basename(filePath)}`;
const file = fs.readFileSync(filePath);

async function run() {
  const bucket = 'mapas';
  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(fileName, file, { upsert: true });

  if (error) {
    console.error('Erro no upload:', error);
    process.exit(1);
  }

  const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(data.path);
  console.log('Public URL:', urlData.publicUrl);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
