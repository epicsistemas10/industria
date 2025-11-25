#!/usr/bin/env node
// Simple script to run basic Supabase operations using service role key from env vars.
// Usage examples:
//   SUPABASE_URL="https://xyz" SUPABASE_SERVICE_ROLE="..." node scripts/supabase-cli.js create-hotspot --equipamento_id=... --x=10 --y=20

import fetch from 'node-fetch';
import { argv } from 'process';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE) {
  console.error('Please set SUPABASE_URL and SUPABASE_SERVICE_ROLE environment variables.');
  process.exit(1);
}

const headers = {
  'Content-Type': 'application/json',
  apikey: SUPABASE_SERVICE_ROLE,
  Authorization: `Bearer ${SUPABASE_SERVICE_ROLE}`,
};

async function createHotspot(opts) {
  const body = [{
    equipamento_id: opts.equipamento_id,
    x: Number(opts.x) || 10,
    y: Number(opts.y) || 10,
    width: Number(opts.width) || 8,
    height: Number(opts.height) || 8,
  }];

  const res = await fetch(`${SUPABASE_URL}/rest/v1/equipamento_mapa`, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  });
  const text = await res.text();
  console.log('createHotspot response:', res.status, text);
}

async function deleteHotspot(id) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/equipamento_mapa?id=eq.${id}`, {
    method: 'DELETE',
    headers,
  });
  const text = await res.text();
  console.log('deleteHotspot response:', res.status, text);
}

async function createPanorama(opts) {
  const body = [{ titulo: opts.titulo || 'Panorama', url: opts.url }];
  const res = await fetch(`${SUPABASE_URL}/rest/v1/panoramas`, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  });
  const text = await res.text();
  console.log('createPanorama response:', res.status, text);
}

async function main() {
  const cmd = argv[2];
  const args = argv.slice(3);
  const opts = {};
  args.forEach(a => {
    const [k,v] = a.replace(/^--/,'').split('=');
    opts[k] = v;
  });

  try {
    if (cmd === 'create-hotspot') await createHotspot(opts);
    else if (cmd === 'delete-hotspot') await deleteHotspot(opts.id);
    else if (cmd === 'create-panorama') await createPanorama(opts);
    else console.log('unknown command');
  } catch (err) {
    console.error('Error:', err);
  }
}

main();
