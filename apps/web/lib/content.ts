import { getPublishedHomeContent, type HomeContent } from "@portfolio/db";
import { getPublicSupabaseClient } from "./supabase";
import { defaultHomeContent } from "@/content/default-content";

/**
 * Obtiene el contenido para la página de inicio.
 * Prioriza Supabase cuando está disponible y configurado; si no,
 * recurre al contenido estático tipado de respaldo de forma transparente.
 */
export async function getHomeContent(): Promise<HomeContent> {
  const supabase = getPublicSupabaseClient();
  if (!supabase) {
    return defaultHomeContent;
  }

  try {
    const data = await getPublishedHomeContent(supabase);
    // Si la base no devolvió secciones, fallback
    if (!data.profile && (!data.sections || data.sections.length === 0)) {
      return defaultHomeContent;
    }
    return data;
  } catch (error) {
    console.warn("Fallo al obtener contenido desde Supabase, usando respaldo:", error);
    return defaultHomeContent;
  }
}

