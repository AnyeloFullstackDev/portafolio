import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { Database } from "@portfolio/db";

import { getSupabaseConfig } from "@/lib/env";

/**
 * Cliente de Supabase para Server Components, Server Actions y Route Handlers.
 * Se crea uno nuevo por petición: nunca se comparte entre peticiones.
 */
export async function createSupabaseServerClient() {
  const { url, anonKey } = getSupabaseConfig();
  const cookieStore = await cookies();

  return createServerClient<Database>(url, anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          for (const { name, value, options } of cookiesToSet) {
            cookieStore.set(name, value, options);
          }
        } catch {
          // Los Server Components no pueden escribir cookies. La renovación de
          // sesión la realiza `proxy.ts`; aquí se ignora de forma deliberada.
        }
      },
    },
  });
}
