import { createClient } from "@supabase/supabase-js";
import type { Database } from "@portfolio/db";

/**
 * Cliente de Supabase para lectura pública anónima en apps/web.
 * Retorna null si las variables de entorno no están configuradas.
 */
export function getPublicSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    return null;
  }

  return createClient<Database>(url, anonKey, {
    auth: {
      persistSession: false,
    },
  });
}

