import type { JwtPayload } from "@supabase/supabase-js";

/**
 * El rol administrativo se lee de `app_metadata`, que solo puede modificar el
 * servidor. `user_metadata` es editable por el usuario y nunca se usa aquí.
 */
export function isAdminClaim(claims: JwtPayload | null | undefined): boolean {
  const appMetadata: unknown = claims?.app_metadata;

  if (typeof appMetadata !== "object" || appMetadata === null) {
    return false;
  }

  const role = (appMetadata as Record<string, unknown>).role;
  return role === "admin";
}
