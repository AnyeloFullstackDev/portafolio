import { getProfile, getSiteSettings } from "@portfolio/db";
import { requireAdmin } from "@/lib/auth/dal";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { actualizarConfiguracionAction } from "../actions";

export const dynamic = "force-dynamic";

export default async function ConfiguracionPage() {
  await requireAdmin();
  const supabase = await createSupabaseServerClient();

  let settings = null;
  let profile = null;

  try {
    [settings, profile] = await Promise.all([
      getSiteSettings(supabase),
      getProfile(supabase),
    ]);
  } catch (err) {
    console.error("Error al cargar configuración:", err);
  }

  return (
    <div className="flex flex-col gap-6">
      <section>
        <h1 className="text-2xl font-bold tracking-tight text-chalk">
          Configuración y Perfil
        </h1>
        <p className="text-sm text-chalk-dim">
          Edita la configuración general, metadatos SEO y datos del perfil público.
        </p>
      </section>

      <form
        action={actualizarConfiguracionAction}
        className="flex flex-col gap-6 rounded-2xl border border-glass-border bg-glass p-6"
      >
        <div className="border-b border-glass-border pb-4">
          <h2 className="text-lg font-semibold text-chalk">Perfil Profesional</h2>
          <p className="text-xs text-chalk-dim">Datos de autor y marca personal.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs uppercase font-mono text-chalk-dim mb-1">
              Nombre Completo
            </label>
            <input
              type="text"
              name="fullName"
              defaultValue={profile?.full_name || "Anyelo"}
              required
              className="w-full rounded-xl bg-chalk/5 border border-glass-border px-4 py-2 text-sm text-chalk focus:outline-none focus:border-sky"
            />
          </div>

          <div>
            <label className="block text-xs uppercase font-mono text-chalk-dim mb-1">
              Nombre a Mostrar
            </label>
            <input
              type="text"
              name="displayName"
              defaultValue={profile?.display_name || "Anyelo"}
              required
              className="w-full rounded-xl bg-chalk/5 border border-glass-border px-4 py-2 text-sm text-chalk focus:outline-none focus:border-sky"
            />
          </div>
        </div>

        <div className="border-b border-glass-border pt-4 pb-4">
          <h2 className="text-lg font-semibold text-chalk">Metadatos del Sitio y SEO</h2>
          <p className="text-xs text-chalk-dim">Títulos y descripciones para motores de búsqueda.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs uppercase font-mono text-chalk-dim mb-1">
              Nombre del Sitio
            </label>
            <input
              type="text"
              name="siteName"
              defaultValue={settings?.site_name || "AnyeloFullStackDev"}
              required
              className="w-full rounded-xl bg-chalk/5 border border-glass-border px-4 py-2 text-sm text-chalk focus:outline-none focus:border-sky"
            />
          </div>

          <div>
            <label className="block text-xs uppercase font-mono text-chalk-dim mb-1">
              Etiqueta de Disponibilidad
            </label>
            <input
              type="text"
              name="availabilityLabel"
              defaultValue={settings?.availability_label || "Disponible"}
              required
              className="w-full rounded-xl bg-chalk/5 border border-glass-border px-4 py-2 text-sm text-chalk focus:outline-none focus:border-sky"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs uppercase font-mono text-chalk-dim mb-1">
            Título SEO (Head Title)
          </label>
          <input
            type="text"
            name="seoTitle"
            defaultValue={settings?.seo_title || "Anyelo — Fullstack Developer"}
            required
            className="w-full rounded-xl bg-chalk/5 border border-glass-border px-4 py-2 text-sm text-chalk focus:outline-none focus:border-sky"
          />
        </div>

        <div>
          <label className="block text-xs uppercase font-mono text-chalk-dim mb-1">
            Descripción SEO
          </label>
          <textarea
            name="seoDescription"
            rows={3}
            defaultValue={
              settings?.seo_description ||
              "Portfolio de Anyelo, desarrollador fullstack especializado en experiencias digitales únicas con Next.js, React y tecnologías modernas."
            }
            required
            className="w-full rounded-xl bg-chalk/5 border border-glass-border px-4 py-2 text-sm text-chalk focus:outline-none focus:border-sky"
          />
        </div>

        <div className="pt-2">
          <button
            type="submit"
            className="rounded-xl bg-sky px-6 py-2.5 text-sm font-bold text-night transition hover:bg-sky-bright hover:shadow-[0_0_20px_rgba(14,165,233,0.4)]"
          >
            Guardar Cambios
          </button>
        </div>
      </form>
    </div>
  );
}

