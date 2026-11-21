import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from './database.types';
import { ContentError } from './errors';
import { unwrapVoid } from './result';

/**
 * Ingreso público de mensajes de contacto.
 *
 * `apps/web` no inserta en `public.contact_messages` ni usa `service_role`:
 * llama al RPC `submit_contact_message` con la clave anónima. La base de datos
 * valida, normaliza y aplica el rate limit por correo. El rate limit por IP,
 * captcha o honeypot son responsabilidad del Route Handler que invoca esta
 * función (ver docs/database/SCHEMA.md).
 */

type Client = SupabaseClient<Database>;

export interface ContactMessageInput {
  name: string;
  email: string;
  subject?: string | null;
  message: string;
  sourcePage?: string | null;
}

/**
 * Envía un mensaje de contacto y devuelve el id generado.
 *
 * Errores esperados del RPC (se propagan como `ContentError` con `code`):
 *   - `22023`: nombre, correo, asunto, mensaje o página inválidos.
 *   - `P0001`: límite de frecuencia por correo superado.
 */
export async function submitContactMessage(
  client: Client,
  input: ContactMessageInput,
): Promise<string> {
  const result = await client.rpc('submit_contact_message', {
    p_name: input.name,
    p_email: input.email,
    p_subject: input.subject ?? '',
    p_message: input.message,
    p_source_page: input.sourcePage ?? undefined,
  });

  unwrapVoid('submitContactMessage', result);

  if (typeof result.data !== 'string' || result.data.length === 0) {
    throw new ContentError(
      'submitContactMessage',
      'El RPC de contacto no devolvió un identificador.',
    );
  }

  return result.data;
}
