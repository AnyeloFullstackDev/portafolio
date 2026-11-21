import { redirect } from "next/navigation";

import { isAdminClaim } from "@/lib/auth/claims";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type SesionAdmin = {
  userId: string;
  email: string | null;
};

/**
 * Verificación **segura** de autorización: valida el JWT con Supabase y exige
 * el rol administrativo en `app_metadata`. Debe invocarse en cada página,
 * layout de datos, Server Action y Route Handler sensible.
 */
export async function requireAdmin(): Promise<SesionAdmin> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.getClaims();

  if (error || !data) {
    redirect("/login");
  }

  const { claims } = data;

  if (!isAdminClaim(claims)) {
    redirect("/acceso-denegado");
  }

  return {
    userId: claims.sub,
    email: typeof claims.email === "string" ? claims.email : null,
  };
}

/** Devuelve la sesión administrativa si existe, sin redirigir. */
export async function getSesionAdmin(): Promise<SesionAdmin | null> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.getClaims();

  if (error || !data || !isAdminClaim(data.claims)) {
    return null;
  }

  return {
    userId: data.claims.sub,
    email: typeof data.claims.email === "string" ? data.claims.email : null,
  };
}
