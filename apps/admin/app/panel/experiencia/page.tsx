import { listExperiences } from "@portfolio/db";
import { requireAdmin } from "@/lib/auth/dal";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  actualizarExperienciaAction,
  crearExperienciaAction,
  eliminarExperienciaAction,
} from "../actions";

export const dynamic = "force-dynamic";

export default async function ExperienciaPage() {
  await requireAdmin();
  const supabase = await createSupabaseServerClient();

  let experiences: Awaited<ReturnType<typeof listExperiences>> = [];

  try {
    experiences = await listExperiences(supabase);
  } catch (err) {
    console.error("Error al listar experiencias:", err);
  }

  return (
    <div className="flex flex-col gap-8">
      <section>
        <h1 className="text-2xl font-bold tracking-tight text-chalk">
          Línea de Tiempo y Experiencia
        </h1>
        <p className="text-sm text-chalk-dim">
          Administra la trayectoria profesional y roles desempeñados mostrados en la sección Sobre mí.
        </p>
      </section>

      {/* Formulario nueva experiencia */}
      <section className="rounded-2xl border border-glass-border bg-glass p-6">
        <h2 className="text-lg font-semibold text-chalk mb-4">Añadir Experiencia</h2>
        <form action={crearExperienciaAction} className="flex flex-col gap-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs uppercase font-mono text-chalk-dim mb-1">
                Año / Periodo
              </label>
              <input
                type="text"
                name="yearLabel"
                required
                placeholder="ej. 2024, 2022 - Presente"
                className="w-full rounded-xl bg-chalk/5 border border-glass-border px-3 py-2 text-xs text-chalk focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs uppercase font-mono text-chalk-dim mb-1">
                Puesto / Rol
              </label>
              <input
                type="text"
                name="role"
                required
                placeholder="ej. Senior Fullstack Developer"
                className="w-full rounded-xl bg-chalk/5 border border-glass-border px-3 py-2 text-xs text-chalk focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs uppercase font-mono text-chalk-dim mb-1">
                Empresa / Entorno
              </label>
              <input
                type="text"
                name="company"
                required
                placeholder="ej. Freelance, Startup"
                className="w-full rounded-xl bg-chalk/5 border border-glass-border px-3 py-2 text-xs text-chalk focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs uppercase font-mono text-chalk-dim mb-1">
              Descripción del impacto y tecnologías
            </label>
            <textarea
              name="description"
              rows={2}
              required
              placeholder="Detalla las responsabilidades y tecnologías clave utilizadas..."
              className="w-full rounded-xl bg-chalk/5 border border-glass-border px-3 py-2 text-xs text-chalk focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4 max-w-sm">
            <div>
              <label className="block text-xs uppercase font-mono text-chalk-dim mb-1">
                Color de Acento
              </label>
              <input
                type="text"
                name="accentColor"
                defaultValue="#0EA5E9"
                className="w-full rounded-xl bg-chalk/5 border border-glass-border px-3 py-2 text-xs font-mono text-chalk"
              />
            </div>
            <div>
              <label className="block text-xs uppercase font-mono text-chalk-dim mb-1">
                Orden
              </label>
              <input
                type="number"
                name="sortOrder"
                defaultValue="0"
                className="w-full rounded-xl bg-chalk/5 border border-glass-border px-3 py-2 text-xs text-chalk"
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              className="rounded-xl bg-sky px-5 py-2 text-xs font-bold text-night transition hover:bg-sky-bright"
            >
              + Añadir Experiencia
            </button>
          </div>
        </form>
      </section>

      {/* Listado */}
      <section className="flex flex-col gap-4">
        <h2 className="text-lg font-semibold text-chalk">
          Experiencias Registradas ({experiences.length})
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {experiences.map((exp) => {
            const actualizarConId = actualizarExperienciaAction.bind(null, exp.id);
            const eliminarConId = eliminarExperienciaAction.bind(null, exp.id);

            return (
              <div
                key={exp.id}
                className="rounded-2xl border border-glass-border bg-glass p-5 flex flex-col gap-3"
              >
                <form action={actualizarConId} className="flex flex-col gap-3">
                  <div className="flex items-center gap-2 border-b border-glass-border pb-2">
                    <span
                      className="font-mono text-base font-bold"
                      style={{ color: exp.accent_color }}
                    >
                      {exp.year_label}
                    </span>
                    <input
                      type="text"
                      name="role"
                      defaultValue={exp.role}
                      required
                      className="rounded bg-chalk/5 border border-glass-border px-2 py-1 text-xs font-bold text-chalk flex-1"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10px] uppercase font-mono text-chalk-dim mb-0.5">
                        Empresa
                      </label>
                      <input
                        type="text"
                        name="company"
                        defaultValue={exp.company}
                        required
                        className="w-full rounded bg-chalk/5 border border-glass-border px-2 py-1 text-xs text-chalk"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] uppercase font-mono text-chalk-dim mb-0.5">
                        Año
                      </label>
                      <input
                        type="text"
                        name="yearLabel"
                        defaultValue={exp.year_label}
                        required
                        className="w-full rounded bg-chalk/5 border border-glass-border px-2 py-1 text-xs text-chalk"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] uppercase font-mono text-chalk-dim mb-0.5">
                      Descripción
                    </label>
                    <textarea
                      name="description"
                      defaultValue={exp.description}
                      rows={2}
                      className="w-full rounded bg-chalk/5 border border-glass-border px-2 py-1 text-xs text-chalk"
                    />
                  </div>

                  <div className="flex items-center justify-end pt-1">
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
                      Eliminar experiencia
                    </button>
                  </form>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}

