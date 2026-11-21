import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

import { isAdminClaim } from "@/lib/auth/claims";
import { getSupabaseConfig, SupabaseConfigError } from "@/lib/env";

/** Rutas accesibles sin sesión. */
const RUTAS_PUBLICAS = ["/login"];

/** Rutas accesibles con sesión, aunque el usuario no sea administrador. */
const RUTAS_AUTENTICADAS = ["/acceso-denegado"];

export const RUTA_ENTRADA = "/panel";

function paginaSinConfiguracion(mensaje: string): NextResponse {
  return new NextResponse(
    `<!doctype html><html lang="es"><head><meta charset="utf-8"><title>Configuración pendiente</title></head>` +
      `<body style="font-family:system-ui;background:#0D0F1A;color:#F5F3EF;padding:3rem;line-height:1.6">` +
      `<h1 style="font-size:1.25rem">Panel no disponible</h1><p>${mensaje}</p></body></html>`,
    {
      status: 503,
      headers: { "content-type": "text/html; charset=utf-8" },
    },
  );
}

/**
 * Renueva la sesión de Supabase y aplica comprobaciones **optimistas** de
 * acceso. La autorización real se verifica en cada página y Server Action
 * mediante `requireAdmin()`; este proxy nunca es la única barrera.
 */
export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  let config;
  try {
    config = getSupabaseConfig();
  } catch (error) {
    if (error instanceof SupabaseConfigError) {
      return paginaSinConfiguracion(error.message);
    }
    throw error;
  }

  const supabase = createServerClient(config.url, config.anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet, headers) {
        for (const { name, value } of cookiesToSet) {
          request.cookies.set(name, value);
        }

        response = NextResponse.next({ request });

        for (const { name, value, options } of cookiesToSet) {
          response.cookies.set(name, value, options);
        }

        for (const [key, value] of Object.entries(headers)) {
          response.headers.set(key, value);
        }
      },
    },
  });

  const { data, error } = await supabase.auth.getClaims();

  if (error) {
    // Token inválido o expirado sin posibilidad de renovación: se trata como
    // sesión ausente y las rutas protegidas redirigen a /login.
    const path = request.nextUrl.pathname;
    const esPublica = RUTAS_PUBLICAS.some((ruta) => path.startsWith(ruta));

    if (esPublica) {
      return response;
    }

    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.search = "";
    return NextResponse.redirect(url);
  }

  const claims = data?.claims ?? null;
  const path = request.nextUrl.pathname;
  const esPublica = RUTAS_PUBLICAS.some((ruta) => path.startsWith(ruta));
  const esAutenticada = RUTAS_AUTENTICADAS.some((ruta) => path.startsWith(ruta));

  if (!claims && !esPublica) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.search = "";
    return NextResponse.redirect(url);
  }

  if (claims && !esPublica && !esAutenticada && !isAdminClaim(claims)) {
    const url = request.nextUrl.clone();
    url.pathname = "/acceso-denegado";
    url.search = "";
    return NextResponse.redirect(url);
  }

  if (claims && esPublica && isAdminClaim(claims)) {
    const url = request.nextUrl.clone();
    url.pathname = RUTA_ENTRADA;
    url.search = "";
    return NextResponse.redirect(url);
  }

  return response;
}
