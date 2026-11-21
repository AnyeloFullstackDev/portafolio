import type { Tables } from './database.types';
import type {
  CtaVariant,
  LinkVariant,
  ProjectLayout,
  SectionKey,
} from './publication';

/**
 * Modelos de lectura del sitio público.
 *
 * Los tipos generados por Supabase describen filas `snake_case`. Estos modelos
 * son el contrato estable que consumen `apps/web` y `apps/admin`: nombres
 * `camelCase`, sin columnas internas de ciclo de vida y con las URLs de Storage
 * ya resueltas.
 */

export interface MediaRef {
  id: string;
  bucket: string;
  objectPath: string;
  fileName: string;
  mimeType: string;
  byteSize: number;
  altText: string | null;
  /** URL pública resuelta por Supabase Storage. */
  url: string;
}

export interface SiteSettingsContent {
  siteName: string;
  locale: string;
  seoTitle: string;
  seoDescription: string;
  seoKeywords: string[];
  ogTitle: string;
  ogDescription: string;
  ogType: string;
  footerName: string;
  footerSuffix: string;
  availabilityLabel: string;
  availabilityHref: string;
  footerAvailabilityLabel: string;
}

export interface ProfileContent {
  fullName: string;
  displayName: string;
  avatar: MediaRef | null;
}

export interface SectionContent {
  id: string;
  key: SectionKey;
  label: string;
  heading: string;
  headingHighlight: string | null;
  description: string | null;
  marqueeWords: string[];
  sortOrder: number;
}

export interface NavItemContent {
  id: string;
  label: string;
  mobileLabel: string | null;
  href: string;
  isCta: boolean;
  sortOrder: number;
}

export interface SectionCtaContent {
  id: string;
  sectionKey: SectionKey;
  label: string;
  href: string;
  variant: CtaVariant;
  sortOrder: number;
}

export interface ContactLinkContent {
  id: string;
  label: string;
  href: string;
  iconKey: string | null;
  variant: LinkVariant;
  sortOrder: number;
  /** true cuando el destino es un archivo de Storage (por ejemplo, el CV). */
  isDownload: boolean;
  fileName: string | null;
}

export interface TechnologyContent {
  id: string;
  name: string;
  slug: string;
}

export interface ProjectCard {
  id: string;
  slug: string;
  title: string;
  category: string;
  description: string;
  accentColor: string;
  accentColorAlt: string;
  layout: ProjectLayout;
  cover: MediaRef | null;
  technologies: TechnologyContent[];
  sortOrder: number;
}

export interface SkillContent {
  id: string;
  label: string;
  proficiency: number;
  sortOrder: number;
}

export interface SkillCategoryContent {
  id: string;
  label: string;
  color: string;
  skills: SkillContent[];
  sortOrder: number;
}

export interface ProfileStatContent {
  id: string;
  value: string;
  label: string;
  sortOrder: number;
}

export interface ExperienceContent {
  id: string;
  yearLabel: string;
  role: string;
  company: string;
  description: string;
  accentColor: string;
  sortOrder: number;
}

export interface QuoteContent {
  id: string;
  sectionKey: SectionKey;
  label: string;
  body: string;
  highlight: string | null;
  sortOrder: number;
}

/** Agregado completo de la home pública. */
export interface HomeContent {
  siteSettings: SiteSettingsContent | null;
  profile: ProfileContent | null;
  sections: SectionContent[];
  sectionsByKey: Partial<Record<SectionKey, SectionContent>>;
  navItems: NavItemContent[];
  sectionCtas: SectionCtaContent[];
  contactLinks: ContactLinkContent[];
  projects: ProjectCard[];
  heroTechnologies: TechnologyContent[];
  toolsTechnologies: TechnologyContent[];
  skillCategories: SkillCategoryContent[];
  profileStats: ProfileStatContent[];
  experiences: ExperienceContent[];
  quotes: QuoteContent[];
}

/* -------------------------------------------------------------------------- */
/* Filas completas para el panel administrativo                               */
/* -------------------------------------------------------------------------- */

export type SiteSettingsRow = Tables<'site_settings'>;
export type ProfileRow = Tables<'profile'>;
export type MediaAssetRow = Tables<'media_assets'>;
export type SectionRow = Tables<'sections'>;
export type NavItemRow = Tables<'nav_items'>;
export type SectionCtaRow = Tables<'section_ctas'>;
export type ContactLinkRow = Tables<'contact_links'>;
export type ProjectRow = Tables<'projects'>;
export type TechnologyRow = Tables<'technologies'>;
export type ProjectTechnologyRow = Tables<'project_technologies'>;
export type SkillCategoryRow = Tables<'skill_categories'>;
export type SkillRow = Tables<'skills'>;
export type ProfileStatRow = Tables<'profile_stats'>;
export type ExperienceRow = Tables<'experiences'>;
export type QuoteRow = Tables<'quotes'>;
export type ContactMessageRow = Tables<'contact_messages'>;
export type AuditLogRow = Tables<'audit_log'>;
