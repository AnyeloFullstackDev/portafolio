import Link from "next/link";
import {
  listContactMessages,
  listExperiences,
  listProjects,
  listSkills,
} from "@portfolio/db";
import { requireAdmin } from "@/lib/auth/dal";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function PanelPage() {
  await requireAdmin();
  const supabase = await createSupabaseServerClient();

  let projectsCount = 0;
  let skillsCount = 0;
  let experiencesCount = 0;
  let messagesCount = 0;
  let unreadMessages = 0;
  let isDbConnected = true;

  try {
    const [projects, skills, experiences, messages] = await Promise.all([
      listProjects(supabase),
      listSkills(supabase),
      listExperiences(supabase),
      listContactMessages(supabase),
    ]);

    projectsCount = projects.length;
    skillsCount = skills.length;
    experiencesCount = experiences.length;
    messagesCount = messages.length;
    unreadMessages = messages.filter((m) => m.status === "new").length;
  } catch {
    isDbConnected = false;
  }

  return (
    <>
      <section className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold tracking-tight text-chalk">
          Panel de Control
        </h1>
        <p className="text-sm text-chalk-dim">
          Administración centralizada de contenidos, configuración y mensajes del portafolio.
        </p>
      </section>

      {!isDbConnected && (
        <div className="rounded-xl border border-yellow-500/30 bg-yellow-500/10 p-4 text-sm text-yellow-200">
          <strong>Aviso:</strong> No se pudo conectar a la base de datos local de Supabase.
          Asegúrate de que los contenedores locales estén activos (<code>pnpm dlx supabase@3.1.0 start</code>).
        </div>
      )}

      {/* Metrics Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="rounded-xl border border-glass-border bg-glass p-5">
          <p className="text-xs uppercase tracking-wider text-chalk-dim">Proyectos</p>
          <p className="text-3xl font-black text-sky mt-1">{projectsCount}</p>
          <Link href="/panel/proyectos" className="text-xs text-sky hover:underline mt-2 inline-block">
            Administrar →
          </Link>
        </div>

        <div className="rounded-xl border border-glass-border bg-glass p-5">
          <p className="text-xs uppercase tracking-wider text-chalk-dim">Habilidades</p>
          <p className="text-3xl font-black text-emerald-400 mt-1">{skillsCount}</p>
          <Link href="/panel/skills" className="text-xs text-emerald-400 hover:underline mt-2 inline-block">
            Administrar →
          </Link>
        </div>

        <div className="rounded-xl border border-glass-border bg-glass p-5">
          <p className="text-xs uppercase tracking-wider text-chalk-dim">Experiencias</p>
          <p className="text-3xl font-black text-indigo-400 mt-1">{experiencesCount}</p>
          <Link href="/panel/experiencia" className="text-xs text-indigo-400 hover:underline mt-2 inline-block">
            Administrar →
          </Link>
        </div>

        <div className="rounded-xl border border-glass-border bg-glass p-5">
          <p className="text-xs uppercase tracking-wider text-chalk-dim">Mensajes</p>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-3xl font-black text-rose-400">{messagesCount}</span>
            {unreadMessages > 0 && (
              <span className="text-xs font-medium text-amber-400">({unreadMessages} sin leer)</span>
            )}
          </div>
          <Link href="/panel/mensajes" className="text-xs text-rose-400 hover:underline mt-2 inline-block">
            Ver buzón →
          </Link>
        </div>
      </div>

      {/* Quick Navigation Sections */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="rounded-2xl border border-glass-border bg-glass p-6">
          <h2 className="text-lg font-semibold text-chalk">Contenido Editorial</h2>
          <p className="text-xs text-chalk-dim mt-1 mb-4">
            Gestiona la información pública visible para los visitantes.
          </p>
          <ul className="flex flex-col gap-2 text-sm">
            <li>
              <Link href="/panel/configuracion" className="flex items-center justify-between p-2 rounded-lg hover:bg-glass text-chalk-dim hover:text-chalk transition">
                <span>Configuración general y perfil</span>
                <span className="text-xs text-sky font-mono">Editar →</span>
              </Link>
            </li>
            <li>
              <Link href="/panel/proyectos" className="flex items-center justify-between p-2 rounded-lg hover:bg-glass text-chalk-dim hover:text-chalk transition">
                <span>Proyectos y tecnologías vinculadas</span>
                <span className="text-xs text-sky font-mono">Editar →</span>
              </Link>
            </li>
            <li>
              <Link href="/panel/skills" className="flex items-center justify-between p-2 rounded-lg hover:bg-glass text-chalk-dim hover:text-chalk transition">
                <span>Categorías de habilidades y niveles</span>
                <span className="text-xs text-sky font-mono">Editar →</span>
              </Link>
            </li>
            <li>
              <Link href="/panel/experiencia" className="flex items-center justify-between p-2 rounded-lg hover:bg-glass text-chalk-dim hover:text-chalk transition">
                <span>Línea de tiempo profesional</span>
                <span className="text-xs text-sky font-mono">Editar →</span>
              </Link>
            </li>
          </ul>
        </div>

        <div className="rounded-2xl border border-glass-border bg-glass p-6">
          <h2 className="text-lg font-semibold text-chalk">Seguridad y Políticas</h2>
          <p className="text-xs text-chalk-dim mt-1 mb-4">
            Contrato de integridad y permisos activos en el sistema.
          </p>
          <div className="flex flex-col gap-3 text-xs text-chalk-dim">
            <div className="flex items-center justify-between border-b border-glass-border pb-2">
              <span>Mecanismo de autorización</span>
              <span className="font-mono text-emerald-400">app_metadata.role</span>
            </div>
            <div className="flex items-center justify-between border-b border-glass-border pb-2">
              <span>Políticas RLS activas</span>
              <span className="font-mono text-emerald-400">Lectura pública / Escritura admin</span>
            </div>
            <div className="flex items-center justify-between border-b border-glass-border pb-2">
              <span>Auditoría de cambios</span>
              <span className="font-mono text-emerald-400">Triggers en audit_log</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Buzón de contacto</span>
              <span className="font-mono text-emerald-400">RPC seguro submit_contact_message</span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
