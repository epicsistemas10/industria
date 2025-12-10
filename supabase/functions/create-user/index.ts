// Supabase Edge Function para criar usuário (admin) e inserir perfil em `usuarios`
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || '';
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';

interface CreateUserRequest {
  nome: string;
  email: string;
  password?: string;
  cargo?: string;
  telefone?: string;
  departamento?: string;
  perfil?: string;
  ativo?: boolean;
}

serve(async (req) => {
  // Standard CORS headers (allow local dev origin; using '*' is OK for testing but
  // some browsers disallow credentials with '*'). Adjust `origin` if you need credentials.
  const CORS_HEADERS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'authorization, apikey, content-type',
    'Access-Control-Allow-Credentials': 'true',
    'Content-Type': 'application/json'
  } as Record<string,string>;

  // CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(JSON.stringify({ ok: true }), { status: 204, headers: CORS_HEADERS });
  }

  try {
    let body: CreateUserRequest | null = null;
    try { body = await req.json() as CreateUserRequest; } catch { body = null; }
    if (!body || !body.email) return new Response(JSON.stringify({ error: 'email_required' }), { status: 400, headers: CORS_HEADERS });

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, { global: { headers: { 'x-application': 'create-user-fn' } } });

    // Create auth user if password provided
    let createdUser: any = null;
    if (body.password) {
      const { data, error } = await supabase.auth.admin.createUser({
        email: body.email,
        password: body.password,
        email_confirm: true,
        user_metadata: { nome: body.nome || '' }
      });
      if (error) {
        console.error('admin.createUser error', error);
        return new Response(JSON.stringify({ error: error.message || error }), { status: 500, headers: CORS_HEADERS });
      }
      createdUser = data;
    }

    // Insert profile into usuarios table (use service key)
    const profile: any = {
      nome: body.nome || null,
      email: body.email,
      cargo: body.cargo || null,
      telefone: body.telefone || null,
      departamento: body.departamento || null,
      perfil: body.perfil || 'tecnico',
      ativo: typeof body.ativo === 'undefined' ? true : Boolean(body.ativo),
    };

    const { data: inserted, error: insertErr } = await supabase.from('usuarios').insert([profile]).select('*').limit(1).maybeSingle();
    if (insertErr) {
      console.error('insert usuario error', insertErr);
      return new Response(JSON.stringify({ error: insertErr.message || insertErr }), { status: 500, headers: CORS_HEADERS });
    }

    return new Response(JSON.stringify({ success: true, user: createdUser, perfil: inserted }), { status: 200, headers: CORS_HEADERS });
  } catch (err) {
    console.error('create-user function error', err);
    return new Response(JSON.stringify({ error: (err as any)?.message || String(err) }), { status: 500, headers: CORS_HEADERS });
  }
});
