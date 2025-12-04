import { createClient } from '@supabase/supabase-js';

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!SUPABASE_URL || !SERVICE_ROLE_KEY) return res.status(500).json({ error: 'Supabase env vars not configured on server.' });

  const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

  try {
    const { nome, email, password, cargo, telefone, departamento, perfil, ativo } = req.body || {};
    if (!email) return res.status(400).json({ error: 'Missing email' });
    if (!password) return res.status(400).json({ error: 'Missing password' });

    // Create the auth user via service_role (admin)
    const createRes: any = await admin.auth.admin.createUser({
      email,
      password,
      user_metadata: { nome, cargo, telefone, departamento, perfil }
    });
    const createdUser = (createRes && (createRes.data || createRes.user)) || createRes;
    const createErr = createRes?.error || null;
    if (createErr) return res.status(400).json({ error: createErr.message || createErr });

    const uid = createdUser?.id || (createdUser && createdUser.user && createdUser.user.id);
    if (!uid) return res.status(500).json({ error: 'Auth did not return a user id' });

    // Insert profile into usuarios table
    const profile = {
      id: uid,
      nome: nome || null,
      email: email || null,
      cargo: cargo || null,
      telefone: telefone || null,
      departamento: departamento || null,
      perfil: perfil || 'tecnico',
      ativo: typeof ativo === 'undefined' ? true : !!ativo
    };

    const { data: inserted, error: insertErr } = await admin.from('usuarios').insert([profile]);
    if (insertErr) return res.status(400).json({ error: insertErr.message || insertErr });

    return res.status(200).json({ user: createdUser, profile: inserted });
  } catch (err: any) {
    return res.status(500).json({ error: err?.message || String(err) });
  }
}
