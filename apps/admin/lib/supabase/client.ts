import { createBrowserClient } from "@supabase/ssr";

import { getSupabaseConfig } from "@/lib/env";

/**
 * Cliente de navegador con la clave pública. No se usa para operaciones
 * privilegiadas: cualquier escritura queda sujeta a RLS.
 */
export function createSupabaseBrowserClient() {
  const { url, anonKey } = getSupabaseConfig();
  return createBrowserClient(url, anonKey);
}
