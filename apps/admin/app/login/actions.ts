"use server";

import { redirect } from "next/navigation";
import { z } from "zod";

import { isAdminClaim } from "@/lib/auth/claims";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type EstadoLogin = { error: string | null };

const esquemaCredenciales = z.object({
  email: z.email(),
  password: z.string().min(1, "La contraseña no puede estar vacía."),
});

const MENSAJE_CREDENCIALES = "Credenciales inválidas.";

export async function iniciarSesion(
  _estado: EstadoLogin,
  formData: FormData,
): Promise<EstadoLogin> {
  const parsed = esquemaCredenciales.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return {
      error:
        "Revisa los datos: el correo debe ser válido y la contraseña no puede estar vacía.",
    };
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.signInWithPassword(parsed.data);

  if (error || !data.user) {
    console.error("[Login Auth Error]:", error?.message, error?.status);
    return {
      error:
        error?.message === "Invalid login credentials"
          ? MENSAJE_CREDENCIALES
          : error?.message || MENSAJE_CREDENCIALES,
    };
  }

  const { data: claimsData, error: claimsError } =
    await supabase.auth.getClaims();

  if (claimsError || !claimsData || !isAdminClaim(claimsData.claims)) {
    await supabase.auth.signOut();
    return { error: "Esta cuenta no tiene permisos de administración." };
  }

  redirect("/panel");
}
