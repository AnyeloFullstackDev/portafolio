import { listProjects } from "@portfolio/db";
import { requireAdmin } from "@/lib/auth/dal";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  actualizarProyectoAction,
  crearProyectoAction,
  eliminarProyectoAction,
} from "../actions";

export const dynamic = "force-dynamic";

export default async function ProyectosPage() {
  await requireAdmin();
  const supabase = await createSupabaseServerClient();

  let projects: Awaited<ReturnType<typeof listProjects>> = [];
  try {
    projects = await listProjects(supabase);
  } catch (err) {
    console.error("Error al listar proyectos:", err);
  }

  return (
    <div className="flex flex-col gap-8">
      <section>
        <h1 className="text-2xl font-bold tracking-tight text-chalk">
          Gestión de Proyectos
        </h1>
        <p className="text-sm text-chalk-dim">
          Crea, edita y organiza los proyectos que se muestran en el portafolio público.
        </p>
      </section>

      {/* Formulario nuevo proyecto */}
      <section className="rounded-2xl border border-glass-border bg-glass p-6">
        <h2 className="text-lg font-semibold text-chalk mb-4">Añadir Nuevo Proyecto</h2>
        <form action={crearProyectoAction} className="flex flex-col gap-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs uppercase font-mono text-chalk-dim mb-1">
                Título
              </label>
              <input
                type="text"
                name="title"
                required
                placeholder="Nombre del proyecto"
                className="w-full rounded-xl bg-chalk/5 border border-glass-border px-4 py-2 text-sm text-chalk focus:outline-none focus:border-sky"
              />
            </div>
            <div>
              <label className="block text-xs uppercase font-mono text-chalk-dim mb-1">
                Categoría
              </label>
              <input
                type="text"
                name="category"
                required
                placeholder="ej. Fullstack App, Backend"
                className="w-full rounded-xl bg-chalk/5 border border-glass-border px-4 py-2 text-sm text-chalk focus:outline-none focus:border-sky"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs uppercase font-mono text-chalk-dim mb-1">
              Descripción
            </label>
            <textarea
              name="description"
              rows={2}
              required
              placeholder="Descripción del proyecto..."
              className="w-full rounded-xl bg-chalk/5 border border-glass-border px-4 py-2 text-sm text-chalk focus:outline-none focus:border-sky"
            />
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs uppercase font-mono text-chalk-dim mb-1">
                Color Primario
              </label>
              <input
                type="text"
                name="accentColor"
                defaultValue="#0EA5E9"
                className="w-full rounded-xl bg-chalk/5 border border-glass-border px-3 py-2 text-xs font-mono text-chalk focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs uppercase font-mono text-chalk-dim mb-1">
                Color Acento
              </label>
              <input
                type="text"
                name="accentColorAlt"
                defaultValue="#0369A1"
                className="w-full rounded-xl bg-chalk/5 border border-glass-border px-3 py-2 text-xs font-mono text-chalk focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs uppercase font-mono text-chalk-dim mb-1">
                Tamaño Tarjeta
              </label>
              <select
                name="layout"
                defaultValue="small"
                className="w-full rounded-xl bg-chalk/5 border border-glass-border px-3 py-2 text-xs text-chalk focus:outline-none"
              >
                <option value="small" className="bg-night text-chalk">Estándar (1 col)</option>
                <option value="large" className="bg-night text-chalk">Destacado (2 col)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs uppercase font-mono text-chalk-dim mb-1">
                Orden
              </label>
              <input
                type="number"
                name="sortOrder"
                defaultValue="0"
                className="w-full rounded-xl bg-chalk/5 border border-glass-border px-3 py-2 text-xs text-chalk focus:outline-none"
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              className="rounded-xl bg-sky px-5 py-2 text-xs font-bold text-night transition hover:bg-sky-bright"
            >
              + Crear Proyecto
            </button>
          </div>
        </form>
      </section>

      {/* Listado de proyectos existentes */}
      <section className="flex flex-col gap-4">
        <h2 className="text-lg font-semibold text-chalk">
          Proyectos Existentes ({projects.length})
        </h2>

        {projects.length === 0 ? (
          <p className="text-sm text-chalk-dim">No hay proyectos registrados aún.</p>
        ) : (
          <div className="flex flex-col gap-4">
            {projects.map((p) => {
              const actualizarConId = actualizarProyectoAction.bind(null, p.id);
              const eliminarConId = eliminarProyectoAction.bind(null, p.id);

              return (
                <div
                  key={p.id}
                  className="rounded-2xl border border-glass-border bg-glass p-5 flex flex-col gap-4"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-glass-border pb-3">
                    <div className="flex items-center gap-3">
                      <span
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: p.accent_color }}
                      />
                      <span className="font-bold text-chalk">{p.title}</span>
                      <span className="text-xs uppercase font-mono text-sky">
                        [{p.category}]
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-xs font-mono">
                      <span className={p.status === "published" ? "text-emerald-400" : "text-amber-400"}>
                        {p.status}
                      </span>
                      <span>·</span>
                      <span className={p.is_visible ? "text-emerald-400" : "text-rose-400"}>
                        {p.is_visible ? "visible" : "oculto"}
                      </span>
                    </div>
                  </div>

                  <form action={actualizarConId} className="flex flex-col gap-3">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-[10px] uppercase font-mono text-chalk-dim mb-1">
                          Título
                        </label>
                        <input
                          type="text"
                          name="title"
                          defaultValue={p.title}
                          required
                          className="w-full rounded-lg bg-chalk/5 border border-glass-border px-3 py-1.5 text-xs text-chalk"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] uppercase font-mono text-chalk-dim mb-1">
                          Categoría
                        </label>
                        <input
                          type="text"
                          name="category"
                          defaultValue={p.category}
                          required
                          className="w-full rounded-lg bg-chalk/5 border border-glass-border px-3 py-1.5 text-xs text-chalk"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] uppercase font-mono text-chalk-dim mb-1">
                          Estado
                        </label>
                        <select
                          name="status"
                          defaultValue={p.status}
                          className="w-full rounded-lg bg-chalk/5 border border-glass-border px-3 py-1.5 text-xs text-chalk"
                        >
                          <option value="published" className="bg-night">published</option>
                          <option value="draft" className="bg-night">draft</option>
                          <option value="archived" className="bg-night">archived</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] uppercase font-mono text-chalk-dim mb-1">
                        Descripción
                      </label>
                      <textarea
                        name="description"
                        defaultValue={p.description}
                        rows={2}
                        className="w-full rounded-lg bg-chalk/5 border border-glass-border px-3 py-1.5 text-xs text-chalk"
                      />
                    </div>

                    <div className="flex items-center justify-between pt-2">
                      <label className="flex items-center gap-2 text-xs text-chalk-dim cursor-pointer">
                        <input
                          type="checkbox"
                          name="isVisible"
                          defaultChecked={p.is_visible}
                          className="rounded border-glass-border bg-chalk/5"
                        />
                        <span>Visible en sitio web</span>
                      </label>

                      <button
                        type="submit"
                        className="rounded-lg bg-sky/20 border border-sky/40 px-3 py-1 text-xs font-semibold text-sky hover:bg-sky/30 transition"
                      >
                        Guardar cambios
                      </button>
                    </div>
                  </form>

                  <div className="flex items-center justify-end pt-2 border-t border-glass-border/40">
                    <form action={eliminarConId}>
                      <button
                        type="submit"
                        className="rounded-lg border border-red-500/30 px-3 py-1 text-xs text-red-400 hover:bg-red-500/10 transition"
                      >
                        Eliminar proyecto
                      </button>
                    </form>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}

