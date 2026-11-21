import type { SupabaseClient } from '@supabase/supabase-js';
import type {
  Database,
  Tables,
  TablesInsert,
  TablesUpdate,
} from './database.types';
import type {
  AuditLogRow,
  ContactLinkRow,
  ContactMessageRow,
  ExperienceRow,
  MediaAssetRow,
  NavItemRow,
  ProfileRow,
  ProfileStatRow,
  ProjectRow,
  ProjectTechnologyRow,
  QuoteRow,
  SectionCtaRow,
  SectionRow,
  SiteSettingsRow,
  SkillCategoryRow,
  SkillRow,
  TechnologyRow,
} from './models';
import type { ContactMessageStatus } from './publication';
import { ContentError } from './errors';
import { unwrapMaybe, unwrapResult, unwrapVoid } from './result';

/**
 * Mutaciones administrativas tipadas.
 *
 * El cliente debe ser una sesión autenticada de Supabase (SSR) cuyo JWT tenga
 * `app_metadata.role = 'admin'`. RLS es la barrera real: estas funciones no
 * comprueban permisos por sí mismas ni usan `service_role`.
 *
 * Las operaciones DELETE requieren además `aal2` (MFA verificado). Cuando RLS
 * bloquea un DELETE, PostgREST responde sin error y con cero filas; por eso las
 * funciones `delete*` devuelven `false` en ese caso.
 */

type Client = SupabaseClient<Database>;

/* -------------------------------------------------------------------------- */
/* site_settings (singleton)                                                  */
/* -------------------------------------------------------------------------- */

export async function getSiteSettings(
  client: Client,
): Promise<SiteSettingsRow | null> {
  const result = await client
    .from('site_settings')
    .select('*')
    .eq('id', true)
    .maybeSingle();

  return unwrapMaybe('getSiteSettings', result);
}

export async function createSiteSettings(
  client: Client,
  input: TablesInsert<'site_settings'>,
): Promise<SiteSettingsRow> {
  const result = await client
    .from('site_settings')
    .insert(input)
    .select('*')
    .single();

  return unwrapResult('createSiteSettings', result);
}

export async function updateSiteSettings(
  client: Client,
  patch: TablesUpdate<'site_settings'>,
): Promise<SiteSettingsRow> {
  const result = await client
    .from('site_settings')
    .update(patch)
    .eq('id', true)
    .select('*')
    .single();

  return unwrapResult('updateSiteSettings', result);
}

export async function deleteSiteSettings(client: Client): Promise<boolean> {
  const result = await client
    .from('site_settings')
    .delete()
    .eq('id', true)
    .select('id');

  return unwrapResult('deleteSiteSettings', result).length > 0;
}

/* -------------------------------------------------------------------------- */
/* profile (singleton)                                                        */
/* -------------------------------------------------------------------------- */

export async function getProfile(client: Client): Promise<ProfileRow | null> {
  const result = await client
    .from('profile')
    .select('*')
    .eq('id', true)
    .maybeSingle();

  return unwrapMaybe('getProfile', result);
}

export async function createProfile(
  client: Client,
  input: TablesInsert<'profile'>,
): Promise<ProfileRow> {
  const result = await client
    .from('profile')
    .insert(input)
    .select('*')
    .single();

  return unwrapResult('createProfile', result);
}

export async function updateProfile(
  client: Client,
  patch: TablesUpdate<'profile'>,
): Promise<ProfileRow> {
  const result = await client
    .from('profile')
    .update(patch)
    .eq('id', true)
    .select('*')
    .single();

  return unwrapResult('updateProfile', result);
}

export async function deleteProfile(client: Client): Promise<boolean> {
  const result = await client
    .from('profile')
    .delete()
    .eq('id', true)
    .select('id');

  return unwrapResult('deleteProfile', result).length > 0;
}

/* -------------------------------------------------------------------------- */
/* media_assets                                                               */
/* -------------------------------------------------------------------------- */

export async function listMediaAssets(
  client: Client,
): Promise<MediaAssetRow[]> {
  const result = await client
    .from('media_assets')
    .select('*')
    .order('created_at', { ascending: false });

  return unwrapResult('listMediaAssets', result);
}

export async function createMediaAsset(
  client: Client,
  input: TablesInsert<'media_assets'>,
): Promise<MediaAssetRow> {
  const result = await client
    .from('media_assets')
    .insert(input)
    .select('*')
    .single();

  return unwrapResult('createMediaAsset', result);
}

export async function updateMediaAsset(
  client: Client,
  id: string,
  patch: TablesUpdate<'media_assets'>,
): Promise<MediaAssetRow> {
  const result = await client
    .from('media_assets')
    .update(patch)
    .eq('id', id)
    .select('*')
    .single();

  return unwrapResult('updateMediaAsset', result);
}

export async function deleteMediaAsset(
  client: Client,
  id: string,
): Promise<boolean> {
  const result = await client
    .from('media_assets')
    .delete()
    .eq('id', id)
    .select('id');

  return unwrapResult('deleteMediaAsset', result).length > 0;
}

/* -------------------------------------------------------------------------- */
/* sections                                                                   */
/* -------------------------------------------------------------------------- */

export async function listSections(client: Client): Promise<SectionRow[]> {
  const result = await client
    .from('sections')
    .select('*')
    .order('sort_order', { ascending: true });

  return unwrapResult('listSections', result);
}

export async function createSection(
  client: Client,
  input: TablesInsert<'sections'>,
): Promise<SectionRow> {
  const result = await client
    .from('sections')
    .insert(input)
    .select('*')
    .single();

  return unwrapResult('createSection', result);
}

export async function updateSection(
  client: Client,
  id: string,
  patch: TablesUpdate<'sections'>,
): Promise<SectionRow> {
  const result = await client
    .from('sections')
    .update(patch)
    .eq('id', id)
    .select('*')
    .single();

  return unwrapResult('updateSection', result);
}

export async function deleteSection(
  client: Client,
  id: string,
): Promise<boolean> {
  const result = await client
    .from('sections')
    .delete()
    .eq('id', id)
    .select('id');

  return unwrapResult('deleteSection', result).length > 0;
}

/* -------------------------------------------------------------------------- */
/* nav_items                                                                  */
/* -------------------------------------------------------------------------- */

export async function listNavItems(client: Client): Promise<NavItemRow[]> {
  const result = await client
    .from('nav_items')
    .select('*')
    .order('sort_order', { ascending: true });

  return unwrapResult('listNavItems', result);
}

export async function createNavItem(
  client: Client,
  input: TablesInsert<'nav_items'>,
): Promise<NavItemRow> {
  const result = await client
    .from('nav_items')
    .insert(input)
    .select('*')
    .single();

  return unwrapResult('createNavItem', result);
}

export async function updateNavItem(
  client: Client,
  id: string,
  patch: TablesUpdate<'nav_items'>,
): Promise<NavItemRow> {
  const result = await client
    .from('nav_items')
    .update(patch)
    .eq('id', id)
    .select('*')
    .single();

  return unwrapResult('updateNavItem', result);
}

export async function deleteNavItem(
  client: Client,
  id: string,
): Promise<boolean> {
  const result = await client
    .from('nav_items')
    .delete()
    .eq('id', id)
    .select('id');

  return unwrapResult('deleteNavItem', result).length > 0;
}

/* -------------------------------------------------------------------------- */
/* section_ctas                                                               */
/* -------------------------------------------------------------------------- */

export async function listSectionCtas(
  client: Client,
): Promise<SectionCtaRow[]> {
  const result = await client
    .from('section_ctas')
    .select('*')
    .order('section_id', { ascending: true })
    .order('sort_order', { ascending: true });

  return unwrapResult('listSectionCtas', result);
}

export async function createSectionCta(
  client: Client,
  input: TablesInsert<'section_ctas'>,
): Promise<SectionCtaRow> {
  const result = await client
    .from('section_ctas')
    .insert(input)
    .select('*')
    .single();

  return unwrapResult('createSectionCta', result);
}

export async function updateSectionCta(
  client: Client,
  id: string,
  patch: TablesUpdate<'section_ctas'>,
): Promise<SectionCtaRow> {
  const result = await client
    .from('section_ctas')
    .update(patch)
    .eq('id', id)
    .select('*')
    .single();

  return unwrapResult('updateSectionCta', result);
}

export async function deleteSectionCta(
  client: Client,
  id: string,
): Promise<boolean> {
  const result = await client
    .from('section_ctas')
    .delete()
    .eq('id', id)
    .select('id');

  return unwrapResult('deleteSectionCta', result).length > 0;
}

/* -------------------------------------------------------------------------- */
/* contact_links                                                              */
/* -------------------------------------------------------------------------- */

export async function listContactLinks(
  client: Client,
): Promise<ContactLinkRow[]> {
  const result = await client
    .from('contact_links')
    .select('*')
    .order('variant', { ascending: true })
    .order('sort_order', { ascending: true });

  return unwrapResult('listContactLinks', result);
}

export async function createContactLink(
  client: Client,
  input: TablesInsert<'contact_links'>,
): Promise<ContactLinkRow> {
  const result = await client
    .from('contact_links')
    .insert(input)
    .select('*')
    .single();

  return unwrapResult('createContactLink', result);
}

export async function updateContactLink(
  client: Client,
  id: string,
  patch: TablesUpdate<'contact_links'>,
): Promise<ContactLinkRow> {
  const result = await client
    .from('contact_links')
    .update(patch)
    .eq('id', id)
    .select('*')
    .single();

  return unwrapResult('updateContactLink', result);
}

export async function deleteContactLink(
  client: Client,
  id: string,
): Promise<boolean> {
  const result = await client
    .from('contact_links')
    .delete()
    .eq('id', id)
    .select('id');

  return unwrapResult('deleteContactLink', result).length > 0;
}

/* -------------------------------------------------------------------------- */
/* projects                                                                   */
/* -------------------------------------------------------------------------- */

export async function listProjects(client: Client): Promise<ProjectRow[]> {
  const result = await client
    .from('projects')
    .select('*')
    .order('sort_order', { ascending: true });

  return unwrapResult('listProjects', result);
}

export async function createProject(
  client: Client,
  input: TablesInsert<'projects'>,
): Promise<ProjectRow> {
  const result = await client
    .from('projects')
    .insert(input)
    .select('*')
    .single();

  return unwrapResult('createProject', result);
}

export async function updateProject(
  client: Client,
  id: string,
  patch: TablesUpdate<'projects'>,
): Promise<ProjectRow> {
  const result = await client
    .from('projects')
    .update(patch)
    .eq('id', id)
    .select('*')
    .single();

  return unwrapResult('updateProject', result);
}

export async function deleteProject(
  client: Client,
  id: string,
): Promise<boolean> {
  const result = await client
    .from('projects')
    .delete()
    .eq('id', id)
    .select('id');

  return unwrapResult('deleteProject', result).length > 0;
}

/* -------------------------------------------------------------------------- */
/* technologies                                                               */
/* -------------------------------------------------------------------------- */

export async function listTechnologies(
  client: Client,
): Promise<TechnologyRow[]> {
  const result = await client
    .from('technologies')
    .select('*')
    .order('name', { ascending: true });

  return unwrapResult('listTechnologies', result);
}

export async function createTechnology(
  client: Client,
  input: TablesInsert<'technologies'>,
): Promise<TechnologyRow> {
  const result = await client
    .from('technologies')
    .insert(input)
    .select('*')
    .single();

  return unwrapResult('createTechnology', result);
}

export async function updateTechnology(
  client: Client,
  id: string,
  patch: TablesUpdate<'technologies'>,
): Promise<TechnologyRow> {
  const result = await client
    .from('technologies')
    .update(patch)
    .eq('id', id)
    .select('*')
    .single();

  return unwrapResult('updateTechnology', result);
}

export async function deleteTechnology(
  client: Client,
  id: string,
): Promise<boolean> {
  const result = await client
    .from('technologies')
    .delete()
    .eq('id', id)
    .select('id');

  return unwrapResult('deleteTechnology', result).length > 0;
}

/* -------------------------------------------------------------------------- */
/* project_technologies                                                       */
/* -------------------------------------------------------------------------- */

export async function listProjectTechnologies(
  client: Client,
): Promise<ProjectTechnologyRow[]> {
  const result = await client
    .from('project_technologies')
    .select('*')
    .order('project_id', { ascending: true })
    .order('sort_order', { ascending: true });

  return unwrapResult('listProjectTechnologies', result);
}

export async function addProjectTechnology(
  client: Client,
  input: TablesInsert<'project_technologies'>,
): Promise<ProjectTechnologyRow> {
  const result = await client
    .from('project_technologies')
    .insert(input)
    .select('*')
    .single();

  return unwrapResult('addProjectTechnology', result);
}

export async function updateProjectTechnologyOrder(
  client: Client,
  projectId: string,
  technologyId: string,
  sortOrder: number,
): Promise<ProjectTechnologyRow> {
  const result = await client
    .from('project_technologies')
    .update({ sort_order: sortOrder })
    .eq('project_id', projectId)
    .eq('technology_id', technologyId)
    .select('*')
    .single();

  return unwrapResult('updateProjectTechnologyOrder', result);
}

export async function removeProjectTechnology(
  client: Client,
  projectId: string,
  technologyId: string,
): Promise<boolean> {
  const result = await client
    .from('project_technologies')
    .delete()
    .eq('project_id', projectId)
    .eq('technology_id', technologyId)
    .select('project_id');

  return unwrapResult('removeProjectTechnology', result).length > 0;
}

/**
 * Reemplaza el conjunto completo de tecnologías de un proyecto en una sola
 * transacción. Requiere sesión admin; no requiere aal2 porque es una edición
 * del proyecto, no la destrucción de contenido.
 */
export async function replaceProjectTechnologies(
  client: Client,
  projectId: string,
  technologyIds: readonly string[],
): Promise<void> {
  const result = await client.rpc('replace_project_technologies', {
    p_project_id: projectId,
    p_technology_ids: [...technologyIds],
  });

  unwrapVoid('replaceProjectTechnologies', result);
}

/* -------------------------------------------------------------------------- */
/* skill_categories                                                           */
/* -------------------------------------------------------------------------- */

export async function listSkillCategories(
  client: Client,
): Promise<SkillCategoryRow[]> {
  const result = await client
    .from('skill_categories')
    .select('*')
    .order('sort_order', { ascending: true });

  return unwrapResult('listSkillCategories', result);
}

export async function createSkillCategory(
  client: Client,
  input: TablesInsert<'skill_categories'>,
): Promise<SkillCategoryRow> {
  const result = await client
    .from('skill_categories')
    .insert(input)
    .select('*')
    .single();

  return unwrapResult('createSkillCategory', result);
}

export async function updateSkillCategory(
  client: Client,
  id: string,
  patch: TablesUpdate<'skill_categories'>,
): Promise<SkillCategoryRow> {
  const result = await client
    .from('skill_categories')
    .update(patch)
    .eq('id', id)
    .select('*')
    .single();

  return unwrapResult('updateSkillCategory', result);
}

export async function deleteSkillCategory(
  client: Client,
  id: string,
): Promise<boolean> {
  const result = await client
    .from('skill_categories')
    .delete()
    .eq('id', id)
    .select('id');

  return unwrapResult('deleteSkillCategory', result).length > 0;
}

/* -------------------------------------------------------------------------- */
/* skills                                                                     */
/* -------------------------------------------------------------------------- */

export async function listSkills(client: Client): Promise<SkillRow[]> {
  const result = await client
    .from('skills')
    .select('*')
    .order('category_id', { ascending: true })
    .order('sort_order', { ascending: true });

  return unwrapResult('listSkills', result);
}

export async function createSkill(
  client: Client,
  input: TablesInsert<'skills'>,
): Promise<SkillRow> {
  const result = await client
    .from('skills')
    .insert(input)
    .select('*')
    .single();

  return unwrapResult('createSkill', result);
}

export async function updateSkill(
  client: Client,
  id: string,
  patch: TablesUpdate<'skills'>,
): Promise<SkillRow> {
  const result = await client
    .from('skills')
    .update(patch)
    .eq('id', id)
    .select('*')
    .single();

  return unwrapResult('updateSkill', result);
}

export async function deleteSkill(
  client: Client,
  id: string,
): Promise<boolean> {
  const result = await client
    .from('skills')
    .delete()
    .eq('id', id)
    .select('id');

  return unwrapResult('deleteSkill', result).length > 0;
}

/* -------------------------------------------------------------------------- */
/* profile_stats                                                              */
/* -------------------------------------------------------------------------- */

export async function listProfileStats(
  client: Client,
): Promise<ProfileStatRow[]> {
  const result = await client
    .from('profile_stats')
    .select('*')
    .order('sort_order', { ascending: true });

  return unwrapResult('listProfileStats', result);
}

export async function createProfileStat(
  client: Client,
  input: TablesInsert<'profile_stats'>,
): Promise<ProfileStatRow> {
  const result = await client
    .from('profile_stats')
    .insert(input)
    .select('*')
    .single();

  return unwrapResult('createProfileStat', result);
}

export async function updateProfileStat(
  client: Client,
  id: string,
  patch: TablesUpdate<'profile_stats'>,
): Promise<ProfileStatRow> {
  const result = await client
    .from('profile_stats')
    .update(patch)
    .eq('id', id)
    .select('*')
    .single();

  return unwrapResult('updateProfileStat', result);
}

export async function deleteProfileStat(
  client: Client,
  id: string,
): Promise<boolean> {
  const result = await client
    .from('profile_stats')
    .delete()
    .eq('id', id)
    .select('id');

  return unwrapResult('deleteProfileStat', result).length > 0;
}

/* -------------------------------------------------------------------------- */
/* experiences                                                                */
/* -------------------------------------------------------------------------- */

export async function listExperiences(
  client: Client,
): Promise<ExperienceRow[]> {
  const result = await client
    .from('experiences')
    .select('*')
    .order('sort_order', { ascending: true });

  return unwrapResult('listExperiences', result);
}

export async function createExperience(
  client: Client,
  input: TablesInsert<'experiences'>,
): Promise<ExperienceRow> {
  const result = await client
    .from('experiences')
    .insert(input)
    .select('*')
    .single();

  return unwrapResult('createExperience', result);
}

export async function updateExperience(
  client: Client,
  id: string,
  patch: TablesUpdate<'experiences'>,
): Promise<ExperienceRow> {
  const result = await client
    .from('experiences')
    .update(patch)
    .eq('id', id)
    .select('*')
    .single();

  return unwrapResult('updateExperience', result);
}

export async function deleteExperience(
  client: Client,
  id: string,
): Promise<boolean> {
  const result = await client
    .from('experiences')
    .delete()
    .eq('id', id)
    .select('id');

  return unwrapResult('deleteExperience', result).length > 0;
}

/* -------------------------------------------------------------------------- */
/* quotes                                                                     */
/* -------------------------------------------------------------------------- */

export async function listQuotes(client: Client): Promise<QuoteRow[]> {
  const result = await client
    .from('quotes')
    .select('*')
    .order('section_id', { ascending: true })
    .order('sort_order', { ascending: true });

  return unwrapResult('listQuotes', result);
}

export async function createQuote(
  client: Client,
  input: TablesInsert<'quotes'>,
): Promise<QuoteRow> {
  const result = await client
    .from('quotes')
    .insert(input)
    .select('*')
    .single();

  return unwrapResult('createQuote', result);
}

export async function updateQuote(
  client: Client,
  id: string,
  patch: TablesUpdate<'quotes'>,
): Promise<QuoteRow> {
  const result = await client
    .from('quotes')
    .update(patch)
    .eq('id', id)
    .select('*')
    .single();

  return unwrapResult('updateQuote', result);
}

export async function deleteQuote(
  client: Client,
  id: string,
): Promise<boolean> {
  const result = await client
    .from('quotes')
    .delete()
    .eq('id', id)
    .select('id');

  return unwrapResult('deleteQuote', result).length > 0;
}

/* -------------------------------------------------------------------------- */
/* contact_messages (la creación pública vive en contact.ts)                  */
/* -------------------------------------------------------------------------- */

export interface ListContactMessagesOptions {
  status?: ContactMessageStatus;
  limit?: number;
  offset?: number;
}

export async function listContactMessages(
  client: Client,
  options: ListContactMessagesOptions = {},
): Promise<ContactMessageRow[]> {
  const limit = options.limit ?? 50;
  const offset = options.offset ?? 0;

  let query = client
    .from('contact_messages')
    .select('*')
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (options.status !== undefined) {
    query = query.eq('status', options.status);
  }

  return unwrapResult('listContactMessages', await query);
}

export async function getContactMessage(
  client: Client,
  id: string,
): Promise<ContactMessageRow | null> {
  const result = await client
    .from('contact_messages')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  return unwrapMaybe('getContactMessage', result);
}

export async function updateContactMessageStatus(
  client: Client,
  id: string,
  status: ContactMessageStatus,
): Promise<ContactMessageRow> {
  const patch: TablesUpdate<'contact_messages'> = { status };
  const now = new Date().toISOString();

  if (status === 'read') {
    patch.read_at = now;
  }

  if (status === 'replied') {
    patch.replied_at = now;
  }

  const result = await client
    .from('contact_messages')
    .update(patch)
    .eq('id', id)
    .select('*')
    .single();

  return unwrapResult('updateContactMessageStatus', result);
}

export async function deleteContactMessage(
  client: Client,
  id: string,
): Promise<boolean> {
  const result = await client
    .from('contact_messages')
    .delete()
    .eq('id', id)
    .select('id');

  return unwrapResult('deleteContactMessage', result).length > 0;
}

/* -------------------------------------------------------------------------- */
/* audit_log (solo lectura)                                                   */
/* -------------------------------------------------------------------------- */

export interface ListAuditLogOptions {
  tableName?: string;
  recordId?: string;
  limit?: number;
  offset?: number;
}

export async function listAuditLog(
  client: Client,
  options: ListAuditLogOptions = {},
): Promise<AuditLogRow[]> {
  const limit = options.limit ?? 100;
  const offset = options.offset ?? 0;

  let query = client
    .from('audit_log')
    .select('*')
    .order('occurred_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (options.tableName !== undefined) {
    query = query.eq('table_name', options.tableName);
  }

  if (options.recordId !== undefined) {
    query = query.eq('record_id', options.recordId);
  }

  return unwrapResult('listAuditLog', await query);
}

/* -------------------------------------------------------------------------- */
/* Utilidades                                                                 */
/* -------------------------------------------------------------------------- */

/** Traduce un error de PostgreSQL/PostgREST a un mensaje apto para el panel. */
export function describeMutationError(error: unknown): string {
  if (error instanceof ContentError) {
    return error.message;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return 'Error desconocido al guardar los cambios.';
}
