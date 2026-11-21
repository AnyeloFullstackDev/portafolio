import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database, Tables } from './database.types';
import { ContentError } from './errors';
import type {
  ContactLinkContent,
  ExperienceContent,
  HomeContent,
  MediaRef,
  NavItemContent,
  ProfileContent,
  ProfileStatContent,
  ProjectCard,
  QuoteContent,
  SectionContent,
  SectionCtaContent,
  SiteSettingsContent,
  SkillCategoryContent,
  TechnologyContent,
} from './models';
import {
  PUBLISHED_CONTENT_FILTER,
  isSectionKey,
  type SectionKey,
} from './publication';
import { unwrapMaybe, unwrapResult } from './result';

/**
 * Consultas de lectura pública.
 *
 * Todas aplican explícitamente el filtro de publicación
 * (`status = 'published' AND is_visible = true`) además de depender de RLS:
 * defensa en profundidad y contrato legible para quien consume el paquete.
 *
 * El cliente debe crearse con la clave anónima y nunca con `service_role`.
 */

type Client = SupabaseClient<Database>;
type MediaRow = Pick<
  Tables<'media_assets'>,
  | 'id'
  | 'bucket'
  | 'object_path'
  | 'file_name'
  | 'mime_type'
  | 'byte_size'
  | 'alt_text'
>;

const PUBLIC = PUBLISHED_CONTENT_FILTER;

function requireSectionKey(operation: string, value: string): SectionKey {
  if (!isSectionKey(value)) {
    throw new ContentError(
      operation,
      `Clave de sección desconocida: "${value}".`,
    );
  }

  return value;
}

function toMediaRef(client: Client, row: MediaRow): MediaRef {
  const { data } = client.storage
    .from(row.bucket)
    .getPublicUrl(row.object_path);

  return {
    id: row.id,
    bucket: row.bucket,
    objectPath: row.object_path,
    fileName: row.file_name,
    mimeType: row.mime_type,
    byteSize: row.byte_size,
    altText: row.alt_text,
    url: data.publicUrl,
  };
}

async function loadMediaMap(client: Client): Promise<Map<string, MediaRef>> {
  const result = await client
    .from('media_assets')
    .select('id,bucket,object_path,file_name,mime_type,byte_size,alt_text');

  const rows = unwrapResult('loadMediaMap', result);
  const map = new Map<string, MediaRef>();

  for (const row of rows) {
    map.set(row.id, toMediaRef(client, row));
  }

  return map;
}

function toSiteSettings(
  row: Tables<'site_settings'>,
): SiteSettingsContent {
  return {
    siteName: row.site_name,
    locale: row.locale,
    seoTitle: row.seo_title,
    seoDescription: row.seo_description,
    seoKeywords: row.seo_keywords,
    ogTitle: row.og_title,
    ogDescription: row.og_description,
    ogType: row.og_type,
    footerName: row.footer_name,
    footerSuffix: row.footer_suffix,
    availabilityLabel: row.availability_label,
    availabilityHref: row.availability_href,
    footerAvailabilityLabel: row.footer_availability_label,
  };
}

function toSection(
  operation: string,
  row: Tables<'sections'>,
): SectionContent {
  return {
    id: row.id,
    key: requireSectionKey(operation, row.key),
    label: row.label,
    heading: row.heading,
    headingHighlight: row.heading_highlight,
    description: row.description,
    marqueeWords: row.marquee_words,
    sortOrder: row.sort_order,
  };
}

export async function getPublishedSiteSettings(
  client: Client,
): Promise<SiteSettingsContent | null> {
  const result = await client
    .from('site_settings')
    .select('*')
    .eq('id', true)
    .maybeSingle();

  const row = unwrapMaybe('getPublishedSiteSettings', result);

  return row === null ? null : toSiteSettings(row);
}

export async function getPublishedProfile(
  client: Client,
): Promise<ProfileContent | null> {
  const result = await client
    .from('profile')
    .select('*')
    .eq('id', true)
    .maybeSingle();

  const row = unwrapMaybe('getPublishedProfile', result);

  if (row === null) {
    return null;
  }

  const media = await loadMediaMap(client);
  const avatar =
    row.avatar_asset_id === null
      ? null
      : (media.get(row.avatar_asset_id) ?? null);

  return {
    fullName: row.full_name,
    displayName: row.display_name,
    avatar,
  };
}

export async function getPublishedSections(
  client: Client,
): Promise<SectionContent[]> {
  const result = await client
    .from('sections')
    .select('*')
    .eq('status', PUBLIC.status)
    .eq('is_visible', PUBLIC.is_visible)
    .order('sort_order', { ascending: true });

  const rows = unwrapResult('getPublishedSections', result);

  return rows.map((row) => toSection('getPublishedSections', row));
}

export function indexSectionsByKey(
  sections: readonly SectionContent[],
): Partial<Record<SectionKey, SectionContent>> {
  const index: Partial<Record<SectionKey, SectionContent>> = {};

  for (const section of sections) {
    index[section.key] = section;
  }

  return index;
}

export async function getPublishedNavItems(
  client: Client,
): Promise<NavItemContent[]> {
  const result = await client
    .from('nav_items')
    .select('*')
    .eq('status', PUBLIC.status)
    .eq('is_visible', PUBLIC.is_visible)
    .order('sort_order', { ascending: true });

  const rows = unwrapResult('getPublishedNavItems', result);

  return rows.map((row) => ({
    id: row.id,
    label: row.label,
    mobileLabel: row.mobile_label,
    href: row.href,
    isCta: row.is_cta,
    sortOrder: row.sort_order,
  }));
}

export async function getPublishedSectionCtas(
  client: Client,
): Promise<SectionCtaContent[]> {
  const [sections, result] = await Promise.all([
    getPublishedSections(client),
    client
      .from('section_ctas')
      .select('*')
      .eq('status', PUBLIC.status)
      .eq('is_visible', PUBLIC.is_visible)
      .order('sort_order', { ascending: true }),
  ]);

  const rows = unwrapResult('getPublishedSectionCtas', result);
  const sectionById = new Map(sections.map((section) => [section.id, section]));
  const sectionOrderByKey = new Map<SectionKey, number>(
    sections.map((section) => [section.key, section.sortOrder]),
  );

  const ctas: SectionCtaContent[] = [];

  for (const row of rows) {
    const section = sectionById.get(row.section_id);

    // RLS ya exige un padre público; se filtra igualmente por defensa.
    if (section === undefined) {
      continue;
    }

    ctas.push({
      id: row.id,
      sectionKey: section.key,
      label: row.label,
      href: row.href,
      variant: row.variant,
      sortOrder: row.sort_order,
    });
  }

  return ctas.sort((a, b) => {
    const sectionA = sectionOrderByKey.get(a.sectionKey) ?? 0;
    const sectionB = sectionOrderByKey.get(b.sectionKey) ?? 0;

    return sectionA - sectionB || a.sortOrder - b.sortOrder;
  });
}

export async function getPublishedContactLinks(
  client: Client,
): Promise<ContactLinkContent[]> {
  const [media, result] = await Promise.all([
    loadMediaMap(client),
    client
      .from('contact_links')
      .select('*')
      .eq('status', PUBLIC.status)
      .eq('is_visible', PUBLIC.is_visible)
      .order('variant', { ascending: true })
      .order('sort_order', { ascending: true }),
  ]);

  const rows = unwrapResult('getPublishedContactLinks', result);
  const links: ContactLinkContent[] = [];

  for (const row of rows) {
    const asset =
      row.asset_id === null ? null : (media.get(row.asset_id) ?? null);
    const href = row.url ?? asset?.url ?? null;

    // El CHECK de la tabla garantiza url o asset; si el asset no es legible,
    // el enlace no se publica en lugar de exponer un href vacío.
    if (href === null) {
      continue;
    }

    links.push({
      id: row.id,
      label: row.label,
      href,
      iconKey: row.icon_key,
      variant: row.variant,
      sortOrder: row.sort_order,
      isDownload: row.url === null && asset !== null,
      fileName: asset?.fileName ?? null,
    });
  }

  return links;
}

export async function getPublishedProjects(
  client: Client,
): Promise<ProjectCard[]> {
  const [media, projectsResult, technologiesResult, linksResult] =
    await Promise.all([
      loadMediaMap(client),
      client
        .from('projects')
        .select('*')
        .eq('status', PUBLIC.status)
        .eq('is_visible', PUBLIC.is_visible)
        .order('sort_order', { ascending: true }),
      client
        .from('technologies')
        .select('*')
        .eq('status', PUBLIC.status)
        .eq('is_visible', PUBLIC.is_visible)
        .order('name', { ascending: true }),
      client
        .from('project_technologies')
        .select('project_id,technology_id,sort_order')
        .order('sort_order', { ascending: true }),
    ]);

  const projects = unwrapResult('getPublishedProjects', projectsResult);
  const technologies = unwrapResult(
    'getPublishedProjects.technologies',
    technologiesResult,
  );
  const links = unwrapResult('getPublishedProjects.links', linksResult);

  const technologyById = new Map<string, TechnologyContent>(
    technologies.map((row) => [
      row.id,
      { id: row.id, name: row.name, slug: row.slug },
    ]),
  );

  const technologyIdsByProject = new Map<string, string[]>();

  for (const link of links) {
    if (!technologyById.has(link.technology_id)) {
      continue;
    }

    const current = technologyIdsByProject.get(link.project_id);

    if (current === undefined) {
      technologyIdsByProject.set(link.project_id, [link.technology_id]);
    } else {
      current.push(link.technology_id);
    }
  }

  return projects.map((row) => {
    const cover =
      row.cover_asset_id === null
        ? null
        : (media.get(row.cover_asset_id) ?? null);

    const technologyIds = technologyIdsByProject.get(row.id) ?? [];
    const projectTechnologies: TechnologyContent[] = [];

    for (const id of technologyIds) {
      const technology = technologyById.get(id);

      if (technology !== undefined) {
        projectTechnologies.push(technology);
      }
    }

    return {
      id: row.id,
      slug: row.slug,
      title: row.title,
      category: row.category,
      description: row.description,
      accentColor: row.accent_color,
      accentColorAlt: row.accent_color_alt,
      layout: row.layout,
      cover,
      technologies: projectTechnologies,
      sortOrder: row.sort_order,
    };
  });
}

async function getPublishedTechnologies(
  client: Client,
  placement: 'hero' | 'tools',
): Promise<TechnologyContent[]> {
  const operation =
    placement === 'hero'
      ? 'getPublishedHeroTechnologies'
      : 'getPublishedToolsTechnologies';

  const query =
    placement === 'hero'
      ? client
          .from('technologies')
          .select('*')
          .eq('status', PUBLIC.status)
          .eq('is_visible', PUBLIC.is_visible)
          .eq('show_in_hero', true)
          .order('hero_sort_order', { ascending: true })
      : client
          .from('technologies')
          .select('*')
          .eq('status', PUBLIC.status)
          .eq('is_visible', PUBLIC.is_visible)
          .eq('show_in_tools', true)
          .order('tools_sort_order', { ascending: true });

  const rows = unwrapResult(operation, await query);

  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    slug: row.slug,
  }));
}

export function getPublishedHeroTechnologies(
  client: Client,
): Promise<TechnologyContent[]> {
  return getPublishedTechnologies(client, 'hero');
}

export function getPublishedToolsTechnologies(
  client: Client,
): Promise<TechnologyContent[]> {
  return getPublishedTechnologies(client, 'tools');
}

export async function getPublishedSkillCategories(
  client: Client,
): Promise<SkillCategoryContent[]> {
  const [categoriesResult, skillsResult] = await Promise.all([
    client
      .from('skill_categories')
      .select('*')
      .eq('status', PUBLIC.status)
      .eq('is_visible', PUBLIC.is_visible)
      .order('sort_order', { ascending: true }),
    client
      .from('skills')
      .select('*')
      .eq('status', PUBLIC.status)
      .eq('is_visible', PUBLIC.is_visible)
      .order('sort_order', { ascending: true }),
  ]);

  const categories = unwrapResult(
    'getPublishedSkillCategories',
    categoriesResult,
  );
  const skills = unwrapResult(
    'getPublishedSkillCategories.skills',
    skillsResult,
  );

  const skillsByCategory = new Map<string, SkillCategoryContent['skills']>();

  for (const skill of skills) {
    const entry = {
      id: skill.id,
      label: skill.label,
      proficiency: skill.proficiency,
      sortOrder: skill.sort_order,
    };

    const current = skillsByCategory.get(skill.category_id);

    if (current === undefined) {
      skillsByCategory.set(skill.category_id, [entry]);
    } else {
      current.push(entry);
    }
  }

  return categories.map((row) => ({
    id: row.id,
    label: row.label,
    color: row.color,
    skills: skillsByCategory.get(row.id) ?? [],
    sortOrder: row.sort_order,
  }));
}

export async function getPublishedProfileStats(
  client: Client,
): Promise<ProfileStatContent[]> {
  const result = await client
    .from('profile_stats')
    .select('*')
    .eq('status', PUBLIC.status)
    .eq('is_visible', PUBLIC.is_visible)
    .order('sort_order', { ascending: true });

  const rows = unwrapResult('getPublishedProfileStats', result);

  return rows.map((row) => ({
    id: row.id,
    value: row.value,
    label: row.label,
    sortOrder: row.sort_order,
  }));
}

export async function getPublishedExperiences(
  client: Client,
): Promise<ExperienceContent[]> {
  const result = await client
    .from('experiences')
    .select('*')
    .eq('status', PUBLIC.status)
    .eq('is_visible', PUBLIC.is_visible)
    .order('sort_order', { ascending: true });

  const rows = unwrapResult('getPublishedExperiences', result);

  return rows.map((row) => ({
    id: row.id,
    yearLabel: row.year_label,
    role: row.role,
    company: row.company,
    description: row.description,
    accentColor: row.accent_color,
    sortOrder: row.sort_order,
  }));
}

export async function getPublishedQuotes(
  client: Client,
): Promise<QuoteContent[]> {
  const [sections, result] = await Promise.all([
    getPublishedSections(client),
    client
      .from('quotes')
      .select('*')
      .eq('status', PUBLIC.status)
      .eq('is_visible', PUBLIC.is_visible)
      .order('sort_order', { ascending: true }),
  ]);

  const rows = unwrapResult('getPublishedQuotes', result);
  const sectionById = new Map(sections.map((section) => [section.id, section]));

  const quotes: QuoteContent[] = [];

  for (const row of rows) {
    const section = sectionById.get(row.section_id);

    // RLS ya exige un padre público; se filtra igualmente por defensa.
    if (section === undefined) {
      continue;
    }

    quotes.push({
      id: row.id,
      sectionKey: section.key,
      label: row.label,
      body: row.body,
      highlight: row.highlight,
      sortOrder: row.sort_order,
    });
  }

  return quotes;
}

/**
 * Carga todo el contenido público de la home.
 *
 * Cada consulta es independiente y se ejecutan en paralelo. Si una falla, la
 * promesa se rechaza con `ContentError`: la página debe mostrar su estado de
 * error en lugar de renderizar contenido parcial silenciosamente.
 */
export async function getPublishedHomeContent(
  client: Client,
): Promise<HomeContent> {
  const [
    siteSettings,
    profile,
    sections,
    navItems,
    sectionCtas,
    contactLinks,
    projects,
    heroTechnologies,
    toolsTechnologies,
    skillCategories,
    profileStats,
    experiences,
    quotes,
  ] = await Promise.all([
    getPublishedSiteSettings(client),
    getPublishedProfile(client),
    getPublishedSections(client),
    getPublishedNavItems(client),
    getPublishedSectionCtas(client),
    getPublishedContactLinks(client),
    getPublishedProjects(client),
    getPublishedHeroTechnologies(client),
    getPublishedToolsTechnologies(client),
    getPublishedSkillCategories(client),
    getPublishedProfileStats(client),
    getPublishedExperiences(client),
    getPublishedQuotes(client),
  ]);

  return {
    siteSettings,
    profile,
    sections,
    sectionsByKey: indexSectionsByKey(sections),
    navItems,
    sectionCtas,
    contactLinks,
    projects,
    heroTechnologies,
    toolsTechnologies,
    skillCategories,
    profileStats,
    experiences,
    quotes,
  };
}
