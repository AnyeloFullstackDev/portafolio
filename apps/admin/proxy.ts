import type { NextRequest } from "next/server";

import { updateSession } from "@/lib/supabase/proxy";

export default async function proxy(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  matcher: [
    /*
     * Todas las rutas excepto estáticos y archivos con extensión.
     * Las Server Actions se ejecutan sobre la ruta que las invoca, por lo que
     * quedan cubiertas; aun así, cada una verifica permisos por su cuenta.
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.[^/]+$).*)",
  ],
};
