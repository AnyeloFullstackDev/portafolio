import { NextResponse } from "next/server";
import { submitContactMessage } from "@portfolio/db";
import { getPublicSupabaseClient } from "@/lib/supabase";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, email, subject, message, honeypot } = body;

    // Honeypot anti-spam check
    if (honeypot) {
      return NextResponse.json({ ok: true, id: "silently-ignored" });
    }

    if (!name || typeof name !== "string" || name.trim().length === 0) {
      return NextResponse.json(
        { ok: false, error: "El nombre es obligatorio." },
        { status: 400 }
      );
    }

    if (!email || typeof email !== "string" || !email.includes("@")) {
      return NextResponse.json(
        { ok: false, error: "El correo electrónico es inválido." },
        { status: 400 }
      );
    }

    if (!message || typeof message !== "string" || message.trim().length === 0) {
      return NextResponse.json(
        { ok: false, error: "El mensaje no puede estar vacío." },
        { status: 400 }
      );
    }

    const supabase = getPublicSupabaseClient();
    if (!supabase) {
      // Si la base no está configurada aún en desarrollo, responder OK simulado
      return NextResponse.json({
        ok: true,
        id: "simulated-dev-id",
        notice: "Supabase no configurado en entorno local; mensaje recibido en modo desarrollo.",
      });
    }

    const messageId = await submitContactMessage(supabase, {
      name: name.trim(),
      email: email.trim(),
      subject: typeof subject === "string" ? subject.trim() : null,
      message: message.trim(),
      sourcePage: "/",
    });

    return NextResponse.json({ ok: true, id: messageId });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Error al procesar el mensaje.";
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}

