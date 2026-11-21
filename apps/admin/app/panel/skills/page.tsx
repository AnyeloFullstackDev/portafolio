import { listSkillCategories, listSkills } from "@portfolio/db";
import { requireAdmin } from "@/lib/auth/dal";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  actualizarHabilidadAction,
  crearHabilidadAction,
  eliminarHabilidadAction,
} from "../actions";

export const dynamic = "force-dynamic";

export default async function SkillsPage() {
  await requireAdmin();
  const supabase = await createSupabaseServerClient();

  let categories: Awaited<ReturnType<typeof listSkillCategories>> = [];
  let skills: Awaited<ReturnType<typeof listSkills>> = [];

  try {
    [categories, skills] = await Promise.all([
      listSkillCategories(supabase),
      listSkills(supabase),
    ]);
  } catch (err) {
    console.error("Error al listar habilidades:", err);
  }

  return (
    <div className="flex flex-col gap-8">
      <section>
        <h1 className="text-2xl font-bold tracking-tight text-chalk">
          Gestión de Habilidades
        </h1>
        <p className="text-sm text-chalk-dim">
          Administra las tecnologías, categorías y niveles de dominio del stack.
        </p>
      </section>

      {/* Formulario nueva habilidad */}
      <section className="rounded-2xl border border-glass-border bg-glass p-6">
        <h2 className="text-lg font-semibold text-chalk mb-4">Añadir Nueva Habilidad</h2>
        <form action={crearHabilidadAction} className="flex flex-col gap-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs uppercase font-mono text-chalk-dim mb-1">
                Categoría
              </label>
              <select
                name="categoryId"
                required
                className="w-full rounded-xl bg-chalk/5 border border-glass-border px-3 py-2 text-xs text-chalk focus:outline-none"
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id} className="bg-night text-chalk">
                    {c.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs uppercase font-mono text-chalk-dim mb-1">
                Nombre de la tecnología
              </label>
              <input
                type="text"
                name="label"
                required
                placeholder="ej. Next.js, Go, Rust"
                className="w-full rounded-xl bg-chalk/5 border border-glass-border px-3 py-2 text-xs text-chalk focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs uppercase font-mono text-chalk-dim mb-1">
                Porcentaje (0-100)
              </label>
              <input
                type="number"
                name="proficiency"
                min="1"
                max="100"
                defaultValue="85"
                required
                className="w-full rounded-xl bg-chalk/5 border border-glass-border px-3 py-2 text-xs text-chalk focus:outline-none"
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              className="rounded-xl bg-sky px-5 py-2 text-xs font-bold text-night transition hover:bg-sky-bright"
            >
              + Añadir Habilidad
            </button>
          </div>
        </form>
      </section>

      {/* Lista agrupada por categoría */}
      <section className="flex flex-col gap-6">
        <h2 className="text-lg font-semibold text-chalk">Habilidades Actuales</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {categories.map((cat) => {
            const catSkills = skills.filter((s) => s.category_id === cat.id);

            return (
              <div
                key={cat.id}
                className="rounded-2xl border border-glass-border bg-glass p-5 flex flex-col gap-4"
              >
                <div className="flex items-center gap-2 border-b border-glass-border pb-3">
                  <span
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ backgroundColor: cat.color }}
                  />
                  <h3 className="font-bold text-chalk text-sm">{cat.label}</h3>
                  <span className="text-xs text-chalk-dim ml-auto font-mono">
                    ({catSkills.length})
                  </span>
                </div>

                <div className="flex flex-col gap-3">
                  {catSkills.map((s) => {
                    const actualizarConId = actualizarHabilidadAction.bind(null, s.id);
                    const eliminarConId = eliminarHabilidadAction.bind(null, s.id);

                    return (
                      <div
                        key={s.id}
                        className="flex items-center justify-between gap-2 p-2 rounded-lg bg-chalk/5 border border-glass-border"
                      >
                        <form
                          action={actualizarConId}
                          className="flex items-center gap-2 flex-1"
                        >
                          <input
                            type="text"
                            name="label"
                            defaultValue={s.label}
                            required
                            className="w-28 rounded bg-transparent px-1 py-0.5 text-xs text-chalk font-medium"
                          />

                          <div className="flex items-center gap-1">
                            <input
                              type="number"
                              name="proficiency"
                              defaultValue={s.proficiency}
                              min="1"
                              max="100"
                              className="w-12 rounded bg-chalk/5 border border-glass-border px-1 py-0.5 text-xs text-right font-mono text-sky"
                            />
                            <span className="text-xs text-chalk-dim font-mono">%</span>
                          </div>

                          <button
                            type="submit"
                            title="Guardar porcentaje"
                            className="text-[10px] text-sky hover:underline ml-auto"
                          >
                            ✓
                          </button>
                        </form>

                        <form action={eliminarConId}>
                          <button
                            type="submit"
                            title="Eliminar habilidad"
                            className="text-[10px] text-rose-400 hover:underline px-1"
                          >
                            ✕
                          </button>
                        </form>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
