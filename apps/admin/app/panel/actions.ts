"use server";

import { revalidatePath } from "next/cache";
import {
  createExperience,
  createProject,
  createSkill,
  deleteContactMessage,
  deleteExperience,
  deleteProject,
  deleteSkill,
  describeMutationError,
  updateContactMessageStatus,
  updateExperience,
  updateProfile,
  updateProject,
  updateSiteSettings,
  updateSkill,
} from "@portfolio/db";
import { requireAdmin } from "@/lib/auth/dal";
import { createSupabaseServerClient } from "@/lib/supabase/server";

/** Actualiza la configuración del sitio y el perfil público. */
export async function actualizarConfiguracionAction(
  formData: FormData
): Promise<void> {
  await requireAdmin();
  const supabase = await createSupabaseServerClient();

  const siteName = formData.get("siteName")?.toString().trim();
  const seoTitle = formData.get("seoTitle")?.toString().trim();
  const seoDescription = formData.get("seoDescription")?.toString().trim();
  const fullName = formData.get("fullName")?.toString().trim();
  const displayName = formData.get("displayName")?.toString().trim();
  const availabilityLabel = formData.get("availabilityLabel")?.toString().trim();

  try {
    await Promise.all([
      updateSiteSettings(supabase, {
        ...(siteName ? { site_name: siteName } : {}),
        ...(seoTitle ? { seo_title: seoTitle } : {}),
        ...(seoDescription ? { seo_description: seoDescription } : {}),
        ...(availabilityLabel ? { availability_label: availabilityLabel } : {}),
      }),
      updateProfile(supabase, {
        ...(fullName ? { full_name: fullName } : {}),
        ...(displayName ? { display_name: displayName } : {}),
      }),
    ]);

    revalidatePath("/panel/configuracion");
    revalidatePath("/panel");
  } catch (error) {
    console.error("actualizarConfiguracionAction error:", describeMutationError(error));
  }
}

/** Crea un nuevo proyecto. */
export async function crearProyectoAction(
  formData: FormData
): Promise<void> {
  await requireAdmin();
  const supabase = await createSupabaseServerClient();

  const title = formData.get("title")?.toString().trim();
  const slug = formData.get("slug")?.toString().trim() || title?.toLowerCase().replace(/\s+/g, "-");
  const category = formData.get("category")?.toString().trim() || "Fullstack";
  const description = formData.get("description")?.toString().trim() || "";
  const accentColor = formData.get("accentColor")?.toString().trim() || "#0EA5E9";
  const accentColorAlt = formData.get("accentColorAlt")?.toString().trim() || "#0369A1";
  const layout = (formData.get("layout")?.toString() as "large" | "small") || "small";
  const status = (formData.get("status")?.toString() as "published" | "draft") || "published";
  const sortOrder = parseInt(formData.get("sortOrder")?.toString() || "0", 10);

  if (!title || !slug) return;

  try {
    await createProject(supabase, {
      title,
      slug,
      category,
      description,
      accent_color: accentColor,
      accent_color_alt: accentColorAlt,
      layout,
      status,
      is_visible: true,
      sort_order: sortOrder,
    });

    revalidatePath("/panel/proyectos");
    revalidatePath("/panel");
  } catch (error) {
    console.error("crearProyectoAction error:", describeMutationError(error));
  }
}

/** Actualiza un proyecto existente. */
export async function actualizarProyectoAction(
  id: string,
  formData: FormData
): Promise<void> {
  await requireAdmin();
  const supabase = await createSupabaseServerClient();

  const title = formData.get("title")?.toString().trim();
  const category = formData.get("category")?.toString().trim();
  const description = formData.get("description")?.toString().trim();
  const accentColor = formData.get("accentColor")?.toString().trim();
  const accentColorAlt = formData.get("accentColorAlt")?.toString().trim();
  const layout = formData.get("layout")?.toString() as "large" | "small" | undefined;
  const status = formData.get("status")?.toString() as "published" | "draft" | "archived" | undefined;
  const isVisible = formData.get("isVisible") === "on";

  try {
    await updateProject(supabase, id, {
      ...(title ? { title } : {}),
      ...(category ? { category } : {}),
      ...(description !== undefined ? { description } : {}),
      ...(accentColor ? { accent_color: accentColor } : {}),
      ...(accentColorAlt ? { accent_color_alt: accentColorAlt } : {}),
      ...(layout ? { layout } : {}),
      ...(status ? { status } : {}),
      is_visible: isVisible,
    });

    revalidatePath("/panel/proyectos");
    revalidatePath("/panel");
  } catch (error) {
    console.error("actualizarProyectoAction error:", describeMutationError(error));
  }
}

/** Elimina un proyecto. */
export async function eliminarProyectoAction(id: string): Promise<void> {
  await requireAdmin();
  const supabase = await createSupabaseServerClient();

  try {
    const ok = await deleteProject(supabase, id);
    if (!ok) {
      console.warn("deleteProject no eliminó filas. Verifica que la función private.has_mfa() en Postgres permita aal1.");
    }
    revalidatePath("/panel/proyectos");
    revalidatePath("/panel");
  } catch (error) {
    console.error("eliminarProyectoAction error:", describeMutationError(error));
  }
}

/** Crea una nueva habilidad. */
export async function crearHabilidadAction(
  formData: FormData
): Promise<void> {
  await requireAdmin();
  const supabase = await createSupabaseServerClient();

  const categoryId = formData.get("categoryId")?.toString();
  const label = formData.get("label")?.toString().trim();
  const proficiency = parseInt(formData.get("proficiency")?.toString() || "80", 10);
  const sortOrder = parseInt(formData.get("sortOrder")?.toString() || "0", 10);

  if (!categoryId || !label) return;

  try {
    await createSkill(supabase, {
      category_id: categoryId,
      label,
      proficiency,
      sort_order: sortOrder,
      status: "published",
      is_visible: true,
    });

    revalidatePath("/panel/skills");
    revalidatePath("/panel");
  } catch (error) {
    console.error("crearHabilidadAction error:", describeMutationError(error));
  }
}

/** Actualiza una habilidad. */
export async function actualizarHabilidadAction(
  id: string,
  formData: FormData
): Promise<void> {
  await requireAdmin();
  const supabase = await createSupabaseServerClient();

  const label = formData.get("label")?.toString().trim();
  const proficiency = parseInt(formData.get("proficiency")?.toString() || "80", 10);

  try {
    await updateSkill(supabase, id, {
      ...(label ? { label } : {}),
      proficiency,
    });

    revalidatePath("/panel/skills");
    revalidatePath("/panel");
  } catch (error) {
    console.error("actualizarHabilidadAction error:", describeMutationError(error));
  }
}

/** Elimina una habilidad. */
export async function eliminarHabilidadAction(id: string): Promise<void> {
  await requireAdmin();
  const supabase = await createSupabaseServerClient();

  try {
    const ok = await deleteSkill(supabase, id);
    if (!ok) {
      console.warn("deleteSkill no eliminó filas. Verifica que la función private.has_mfa() en Postgres permita aal1.");
    }
    revalidatePath("/panel/skills");
    revalidatePath("/panel");
  } catch (error) {
    console.error("eliminarHabilidadAction error:", describeMutationError(error));
  }
}

/** Crea una experiencia / elemento del timeline. */
export async function crearExperienciaAction(
  formData: FormData
): Promise<void> {
  await requireAdmin();
  const supabase = await createSupabaseServerClient();

  const yearLabel = formData.get("yearLabel")?.toString().trim();
  const role = formData.get("role")?.toString().trim();
  const company = formData.get("company")?.toString().trim();
  const description = formData.get("description")?.toString().trim() || "";
  const accentColor = formData.get("accentColor")?.toString().trim() || "#0EA5E9";
  const sortOrder = parseInt(formData.get("sortOrder")?.toString() || "0", 10);

  if (!yearLabel || !role || !company) return;

  try {
    await createExperience(supabase, {
      year_label: yearLabel,
      role,
      company,
      description,
      accent_color: accentColor,
      sort_order: sortOrder,
      status: "published",
      is_visible: true,
    });

    revalidatePath("/panel/experiencia");
    revalidatePath("/panel");
  } catch (error) {
    console.error("crearExperienciaAction error:", describeMutationError(error));
  }
}

/** Actualiza una experiencia. */
export async function actualizarExperienciaAction(
  id: string,
  formData: FormData
): Promise<void> {
  await requireAdmin();
  const supabase = await createSupabaseServerClient();

  const yearLabel = formData.get("yearLabel")?.toString().trim();
  const role = formData.get("role")?.toString().trim();
  const company = formData.get("company")?.toString().trim();
  const description = formData.get("description")?.toString().trim();
  const accentColor = formData.get("accentColor")?.toString().trim();

  try {
    await updateExperience(supabase, id, {
      ...(yearLabel ? { year_label: yearLabel } : {}),
      ...(role ? { role } : {}),
      ...(company ? { company } : {}),
      ...(description !== undefined ? { description } : {}),
      ...(accentColor ? { accent_color: accentColor } : {}),
    });

    revalidatePath("/panel/experiencia");
    revalidatePath("/panel");
  } catch (error) {
    console.error("actualizarExperienciaAction error:", describeMutationError(error));
  }
}

/** Elimina una experiencia. */
export async function eliminarExperienciaAction(id: string): Promise<void> {
  await requireAdmin();
  const supabase = await createSupabaseServerClient();

  try {
    const ok = await deleteExperience(supabase, id);
    if (!ok) {
      console.warn("deleteExperience no eliminó filas. Verifica que la función private.has_mfa() en Postgres permita aal1.");
    }
    revalidatePath("/panel/experiencia");
    revalidatePath("/panel");
  } catch (error) {
    console.error("eliminarExperienciaAction error:", describeMutationError(error));
  }
}

/** Actualiza el estado de un mensaje de contacto. */
export async function actualizarEstadoMensajeAction(
  id: string,
  status: "new" | "read" | "replied" | "archived" | "spam"
): Promise<void> {
  await requireAdmin();
  const supabase = await createSupabaseServerClient();

  try {
    await updateContactMessageStatus(supabase, id, status);
    revalidatePath("/panel/mensajes");
    revalidatePath("/panel");
  } catch (error) {
    console.error("actualizarEstadoMensajeAction error:", describeMutationError(error));
  }
}

/** Elimina permanentemente un mensaje de contacto. */
export async function eliminarMensajeAction(id: string): Promise<void> {
  await requireAdmin();
  const supabase = await createSupabaseServerClient();

  try {
    const ok = await deleteContactMessage(supabase, id);
    if (!ok) {
      console.warn("deleteContactMessage no eliminó filas. Verifica que la función private.has_mfa() en Postgres permita aal1.");
    }
    revalidatePath("/panel/mensajes");
    revalidatePath("/panel");
  } catch (error) {
    console.error("eliminarMensajeAction error:", describeMutationError(error));
  }
}
