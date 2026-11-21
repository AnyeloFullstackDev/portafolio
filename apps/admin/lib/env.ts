/**
 * Acceso a la configuración pública de Supabase.
 *
 * Solo se leen variables `NEXT_PUBLIC_*`, que son las únicas necesarias para
 * autenticación SSR. La `service_role` no se usa en este panel: todas las
 * operaciones se ejecutan con la sesión del usuario y quedan sujetas a RLS.
 */

export type SupabaseConfig = {
  url: string;
  anonKey: string;
};

export class SupabaseConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "SupabaseConfigError";
  }
}

export function getSupabaseConfig(): SupabaseConfig {
  let url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    throw new SupabaseConfigError(
      "Configuración de Supabase incompleta: define NEXT_PUBLIC_SUPABASE_URL y NEXT_PUBLIC_SUPABASE_ANON_KEY en apps/admin/.env.local",
    );
  }

  // Sanitizar URL: eliminar /rest/v1 o trailing slashes si fueron incluidos por error
  url = url.trim().replace(/\/rest\/v1\/?$/, "").replace(/\/+$/, "");

  return { url, anonKey: anonKey.trim() };
}
