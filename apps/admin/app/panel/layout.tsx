import Link from "next/link";
import { requireAdmin } from "@/lib/auth/dal";
import { cerrarSesion } from "@/lib/auth/actions";

export const dynamic = "force-dynamic";

const NAV_ITEMS = [
  { href: "/panel", label: "Resumen" },
  { href: "/panel/configuracion", label: "Configuración" },
  { href: "/panel/proyectos", label: "Proyectos" },
  { href: "/panel/skills", label: "Habilidades" },
  { href: "/panel/experiencia", label: "Experiencia" },
  { href: "/panel/mensajes", label: "Mensajes" },
];

export default async function PanelLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const sesion = await requireAdmin();

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-6 px-6 py-8">
      <header className="flex flex-wrap items-center justify-between gap-4 border-b border-glass-border pb-6">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-3">
            <span className="text-xs uppercase tracking-[0.2em] text-sky font-bold">
              Panel Administrativo
            </span>
            <span className="rounded-full bg-sky/10 border border-sky/20 px-2 py-0.5 text-[10px] text-sky font-mono">
              Rol: Admin
            </span>
          </div>
          <p className="text-sm text-chalk-dim">{sesion.email}</p>
        </div>

        <div className="flex items-center gap-3">
          <a
            href="http://localhost:3000"
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-lg border border-glass-border px-3 py-1.5 text-xs text-chalk-dim transition hover:border-sky/40 hover:text-chalk"
          >
            Ver sitio público ↗
          </a>
          <form action={cerrarSesion}>
            <button
              type="submit"
              className="rounded-lg border border-glass-border px-3 py-1.5 text-xs text-chalk transition hover:border-red-400/40 hover:text-red-400"
            >
              Cerrar sesión
            </button>
          </form>
        </div>
      </header>

      {/* Nav tabs */}
      <nav className="flex flex-wrap gap-2 border-b border-glass-border pb-3">
        {NAV_ITEMS.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="rounded-lg px-3.5 py-1.5 text-sm font-medium text-chalk-dim transition hover:bg-glass hover:text-chalk"
          >
            {item.label}
          </Link>
        ))}
      </nav>

      <main className="flex flex-col gap-6">{children}</main>
    </div>
  );
}
