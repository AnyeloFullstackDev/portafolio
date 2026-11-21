import type { Enums } from './database.types';

/** Estados editoriales admitidos por el esquema. */
export type ContentStatus = Enums<'content_status'>;

export type ProjectLayout = Enums<'project_layout'>;
export type CtaVariant = Enums<'cta_variant'>;
export type LinkVariant = Enums<'link_variant'>;
export type ContactMessageStatus = Enums<'contact_message_status'>;

/**
 * Semántica ÚNICA de publicación del CMS.
 *
 * Un registro es público si y solo si `status = 'published' AND is_visible = true`.
 * Debe coincidir exactamente con `private.is_publicly_visible()` en PostgreSQL,
 * que es el predicado usado por todas las políticas RLS.
 *
 * Todas las consultas del sitio público aplican este filtro de forma explícita
 * (defensa en profundidad) además de depender de RLS.
 */
export const PUBLISHED_CONTENT_FILTER = {
  status: 'published',
  is_visible: true,
} as const;

/** Comprueba la misma semántica que RLS, para tests y mapeos en memoria. */
export function isPubliclyVisible(content: {
  status: ContentStatus;
  is_visible: boolean;
}): boolean {
  return content.status === 'published' && content.is_visible;
}

export const SECTION_KEYS = ['hero', 'about', 'projects', 'skills', 'contact'] as const;

export type SectionKey = (typeof SECTION_KEYS)[number];

export function isSectionKey(value: string): value is SectionKey {
  return (SECTION_KEYS as readonly string[]).includes(value);
}
