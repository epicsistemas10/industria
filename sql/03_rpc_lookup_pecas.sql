-- RPC to lookup pecas by codigo_produto array
-- Run this in the Supabase SQL editor (or via psql) to create a server-side endpoint
-- Usage from client: `supabase.rpc('rpc_lookup_pecas', { codes: ['ABC','DEF'] })`
-- NOTE: If Row Level Security (RLS) is enabled, you may need to create this function
-- as a SECURITY DEFINER owned by a role that bypasses RLS (for example the service_role).
-- Review security implications before applying in production.

CREATE OR REPLACE FUNCTION public.rpc_lookup_pecas(codes text[])
RETURNS SETOF public.pecas
LANGUAGE sql
STABLE
AS $$
  SELECT p.*
  FROM public.pecas p
  WHERE p.codigo_produto = ANY(codes)
  ;
$$;

-- Optional: a more permissive search that matches product name (uncomment if desired)
-- CREATE OR REPLACE FUNCTION public.rpc_search_pecas(term text)
-- RETURNS SETOF public.pecas
-- LANGUAGE sql
-- STABLE
-- AS $$
--   SELECT p.*
--   FROM public.pecas p
--   WHERE p.produto ILIKE ('%' || term || '%')
--   ;
-- $$;

-- If you use RLS and want the function to bypass it, consider making it SECURITY DEFINER
-- and owned by a role with appropriate privileges. Example (review carefully):
-- ALTER FUNCTION public.rpc_lookup_pecas(text[]) OWNER TO postgres;
-- ALTER FUNCTION public.rpc_lookup_pecas(text[]) SECURITY DEFINER;

-- After creating the function, call it from the client with `supabase.rpc('rpc_lookup_pecas', { codes })`.