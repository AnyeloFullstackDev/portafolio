import { cerrarSesion } from "@/lib/auth/actions";

export const dynamic = "force-dynamic";

export default function AccesoDenegadoPage() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md flex-col justify-center gap-6 px-6 py-12">
      <h1 className="text-2xl font-bold">Acceso denegado</h1>
      <p className="text-sm text-chalk-dim">
        Tu cuenta está autenticada pero no tiene permisos de administración.
        Solicita el rol administrativo al responsable del proyecto.
      </p>

      <form action={cerrarSesion}>
        <button
          type="submit"
          className="rounded-lg border border-glass-border px-4 py-2 text-sm text-chalk transition hover:border-sky hover:text-sky-bright"
        >
          Cerrar sesión
        </button>
      </form>
    </main>
  );
}
