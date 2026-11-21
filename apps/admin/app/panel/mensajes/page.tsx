import { listContactMessages } from "@portfolio/db";
import { requireAdmin } from "@/lib/auth/dal";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  actualizarEstadoMensajeAction,
  eliminarMensajeAction,
} from "../actions";

export const dynamic = "force-dynamic";

export default async function MensajesPage() {
  await requireAdmin();
  const supabase = await createSupabaseServerClient();

  let messages: Awaited<ReturnType<typeof listContactMessages>> = [];

  try {
    messages = await listContactMessages(supabase);
  } catch (err) {
    console.error("Error al listar mensajes:", err);
  }

  return (
    <div className="flex flex-col gap-6">
      <section>
        <h1 className="text-2xl font-bold tracking-tight text-chalk">
          Buzón de Contacto
        </h1>
        <p className="text-sm text-chalk-dim">
          Mensajes recibidos mediante el formulario público y protegidos por RLS.
        </p>
      </section>

      {messages.length === 0 ? (
        <div className="rounded-2xl border border-glass-border bg-glass p-8 text-center text-sm text-chalk-dim">
          No hay mensajes en el buzón.
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {messages.map((m) => {
            const marcarLeido = actualizarEstadoMensajeAction.bind(null, m.id, "read");
            const marcarNoLeido = actualizarEstadoMensajeAction.bind(null, m.id, "new");
            const marcarArchivado = actualizarEstadoMensajeAction.bind(null, m.id, "archived");
            const eliminarMensaje = eliminarMensajeAction.bind(null, m.id);

            return (
              <div
                key={m.id}
                className={`rounded-2xl border bg-glass p-5 flex flex-col gap-3 transition ${
                  m.status === "new"
                    ? "border-sky/40 bg-sky/5 shadow-[0_0_20px_rgba(14,165,233,0.1)]"
                    : "border-glass-border"
                }`}
              >
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-glass-border pb-2">
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-chalk text-sm">{m.name}</span>
                    <a
                      href={`mailto:${m.email}`}
                      className="text-xs text-sky hover:underline font-mono"
                    >
                      {m.email}
                    </a>
                  </div>

                  <div className="flex items-center gap-2 text-xs font-mono">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] ${
                        m.status === "new"
                          ? "bg-sky/20 text-sky"
                          : m.status === "read"
                          ? "bg-chalk/10 text-chalk-dim"
                          : "bg-amber-400/20 text-amber-300"
                      }`}
                    >
                      {m.status}
                    </span>
                    <span className="text-chalk-dim">
                      {new Date(m.created_at).toLocaleDateString("es-ES", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                </div>

                {m.subject && (
                  <p className="text-xs font-semibold text-chalk-dim">
                    Asunto: <span className="text-chalk">{m.subject}</span>
                  </p>
                )}

                <p className="text-sm text-chalk leading-relaxed whitespace-pre-wrap bg-chalk/5 p-3 rounded-xl border border-glass-border">
                  {m.message}
                </p>

                <div className="flex items-center justify-end gap-2 pt-1">
                  {m.status === "new" ? (
                    <form action={marcarLeido}>
                      <button
                        type="submit"
                        className="rounded-lg border border-sky/30 px-3 py-1 text-xs text-sky hover:bg-sky/10 transition"
                      >
                        Marcar como leído
                      </button>
                    </form>
                  ) : (
                    <form action={marcarNoLeido}>
                      <button
                        type="submit"
                        className="rounded-lg border border-glass-border px-3 py-1 text-xs text-chalk-dim hover:text-chalk transition"
                      >
                        Marcar como nuevo
                      </button>
                    </form>
                  )}

                  {m.status !== "archived" && (
                    <form action={marcarArchivado}>
                      <button
                        type="submit"
                        className="rounded-lg border border-glass-border px-3 py-1 text-xs text-chalk-dim hover:text-amber-400 hover:border-amber-400/30 transition"
                      >
                        Archivar
                      </button>
                    </form>
                  )}

                  <form action={eliminarMensaje}>
                    <button
                      type="submit"
                      className="rounded-lg border border-red-500/30 px-3 py-1 text-xs text-red-400 hover:bg-red-500/10 transition"
                    >
                      Eliminar
                    </button>
                  </form>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
