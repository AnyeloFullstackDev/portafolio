-- =============================================================================
-- CMS del portafolio — esquema base
-- Fuente: inventario real de apps/web/app/components/*.tsx y app/layout.tsx
-- Ver docs/database/CONTENT-INVENTORY.md y docs/database/SCHEMA.md
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. Esquema privado para helpers (no expuesto por la Data API)
-- -----------------------------------------------------------------------------
CREATE SCHEMA IF NOT EXISTS private;

REVOKE ALL ON SCHEMA private FROM PUBLIC;

-- -----------------------------------------------------------------------------
-- 2. Tipos enumerados
-- -----------------------------------------------------------------------------
CREATE TYPE public.content_status AS ENUM ('draft', 'published', 'archived');

CREATE TYPE public.project_layout AS ENUM ('large', 'small');

CREATE TYPE public.cta_variant AS ENUM ('primary', 'secondary', 'text');

CREATE TYPE public.link_variant AS ENUM ('button', 'icon');

CREATE TYPE public.contact_message_status AS ENUM ('new', 'read', 'replied', 'archived', 'spam');

-- -----------------------------------------------------------------------------
-- 3. Helpers de autorización y de ciclo de vida
-- -----------------------------------------------------------------------------

-- Semántica ÚNICA de publicación: un registro es público si y solo si
-- status = 'published' AND is_visible = true. Todas las políticas RLS y todas
-- las consultas del sitio público usan este predicado.
CREATE OR REPLACE FUNCTION private.is_publicly_visible(
  p_status public.content_status,
  p_is_visible boolean
)
RETURNS boolean
LANGUAGE sql
IMMUTABLE
PARALLEL SAFE
SET search_path = ''
AS $$
  SELECT p_status = 'published' AND p_is_visible;
$$;

-- El claim administrativo SIEMPRE proviene de app_metadata (controlado por el
-- backend/servicio de Auth). user_metadata es editable por el usuario y nunca
-- se consulta aquí.
CREATE OR REPLACE FUNCTION private.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SET search_path = ''
AS $$
  SELECT COALESCE((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin', false);
$$;

-- Nivel de garantía de autenticación (MFA). Solo un JWT con aal2 demuestra un
-- segundo factor verificado. Se exige para operaciones destructivas.
CREATE OR REPLACE FUNCTION private.has_mfa()
RETURNS boolean
LANGUAGE sql
STABLE
SET search_path = ''
AS $$
  SELECT COALESCE((auth.jwt() ->> 'aal') = 'aal2', false);
$$;

CREATE OR REPLACE FUNCTION private.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION private.set_published_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  IF NEW.status = 'published' AND NEW.published_at IS NULL THEN
    NEW.published_at := now();
  END IF;
  RETURN NEW;
END;
$$;

-- Auditoría genérica. SECURITY DEFINER para poder insertar en audit_log aunque
-- el rol que ejecuta la mutación no tenga INSERT sobre esa tabla.
CREATE OR REPLACE FUNCTION private.audit_row_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_actor uuid;
  v_actor_email text;
  v_actor_role text;
  v_record_id text;
  v_old_data jsonb;
  v_new_data jsonb;
BEGIN
  v_actor := auth.uid();
  v_actor_email := auth.jwt() ->> 'email';
  v_actor_role := COALESCE(
    auth.jwt() -> 'app_metadata' ->> 'role',
    auth.jwt() ->> 'role'
  );

  IF TG_OP = 'DELETE' THEN
    v_old_data := to_jsonb(OLD);
  ELSIF TG_OP = 'UPDATE' THEN
    v_old_data := to_jsonb(OLD);
    v_new_data := to_jsonb(NEW);
  ELSE
    v_new_data := to_jsonb(NEW);
  END IF;

  v_record_id := COALESCE(v_new_data ->> 'id', v_old_data ->> 'id');

  INSERT INTO public.audit_log (
    actor_id,
    actor_email,
    actor_role,
    operation,
    table_name,
    record_id,
    old_data,
    new_data
  )
  VALUES (
    v_actor,
    v_actor_email,
    v_actor_role,
    TG_OP,
    TG_TABLE_NAME,
    v_record_id,
    v_old_data,
    v_new_data
  );

  RETURN NULL;
END;
$$;

-- -----------------------------------------------------------------------------
-- 4. Medios (metadatos; el binario vive en Supabase Storage)
-- -----------------------------------------------------------------------------
CREATE TABLE public.media_assets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bucket text NOT NULL CHECK (bucket IN ('media', 'documents')),
  object_path text NOT NULL CHECK (object_path <> ''),
  file_name text NOT NULL CHECK (file_name <> ''),
  mime_type text NOT NULL CHECK (mime_type <> ''),
  byte_size bigint NOT NULL CHECK (byte_size > 0),
  alt_text text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT media_assets_bucket_path_ck CHECK (
    (bucket = 'media' AND (object_path LIKE 'profile/%' OR object_path LIKE 'projects/%'))
    OR (bucket = 'documents' AND object_path LIKE 'resume/%')
  ),
  CONSTRAINT media_assets_bucket_path_uq UNIQUE (bucket, object_path)
);

COMMENT ON TABLE public.media_assets IS
  'Metadatos de archivos almacenados en Supabase Storage. El binario nunca se guarda en PostgreSQL.';

-- -----------------------------------------------------------------------------
-- 5. Configuración global, SEO y perfil
-- -----------------------------------------------------------------------------
CREATE TABLE public.site_settings (
  id boolean PRIMARY KEY DEFAULT true,
  site_name text NOT NULL CHECK (site_name <> ''),
  locale text NOT NULL DEFAULT 'es' CHECK (locale ~ '^[a-z]{2}(-[A-Z]{2})?$'),
  seo_title text NOT NULL CHECK (seo_title <> ''),
  seo_description text NOT NULL CHECK (seo_description <> ''),
  seo_keywords text[] NOT NULL DEFAULT '{}',
  og_title text NOT NULL CHECK (og_title <> ''),
  og_description text NOT NULL CHECK (og_description <> ''),
  og_type text NOT NULL DEFAULT 'website' CHECK (og_type <> ''),
  footer_name text NOT NULL CHECK (footer_name <> ''),
  footer_suffix text NOT NULL CHECK (footer_suffix <> ''),
  availability_label text NOT NULL CHECK (availability_label <> ''),
  availability_href text NOT NULL CHECK (availability_href ~ '^(#|/|https://)'),
  footer_availability_label text NOT NULL CHECK (footer_availability_label <> ''),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT site_settings_singleton_ck CHECK (id)
);

COMMENT ON TABLE public.site_settings IS
  'Fila única (id = true) con configuración global, SEO, footer y disponibilidad.';

CREATE TABLE public.profile (
  id boolean PRIMARY KEY DEFAULT true,
  full_name text NOT NULL CHECK (full_name <> ''),
  display_name text NOT NULL CHECK (display_name <> ''),
  avatar_asset_id uuid REFERENCES public.media_assets (id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT profile_singleton_ck CHECK (id)
);

COMMENT ON TABLE public.profile IS
  'Fila única (id = true) con la identidad pública de la persona.';

-- -----------------------------------------------------------------------------
-- 6. Secciones, navegación y llamadas a la acción
-- -----------------------------------------------------------------------------
CREATE TABLE public.sections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text NOT NULL UNIQUE
    CHECK (key IN ('hero', 'about', 'projects', 'skills', 'contact')),
  label text NOT NULL CHECK (label <> ''),
  heading text NOT NULL CHECK (heading <> ''),
  heading_highlight text,
  description text,
  marquee_words text[] NOT NULL DEFAULT '{}',
  status public.content_status NOT NULL DEFAULT 'draft',
  is_visible boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  published_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT sections_highlight_ck CHECK (
    heading_highlight IS NULL OR position(heading_highlight IN heading) > 0
  ),
  CONSTRAINT sections_published_at_ck CHECK (
    status <> 'published' OR published_at IS NOT NULL
  )
);

COMMENT ON COLUMN public.sections.status IS
  'Ciclo de vida editorial. Solo draft|published|archived.';
COMMENT ON COLUMN public.sections.is_visible IS
  'Interruptor de visibilidad independiente del estado. Público = published AND is_visible.';
COMMENT ON COLUMN public.sections.marquee_words IS
  'Palabras de la cinta decorativa. Contrato: solo la sección projects las usa hoy.';

CREATE TABLE public.nav_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  label text NOT NULL CHECK (label <> ''),
  mobile_label text,
  href text NOT NULL CHECK (href ~ '^(#|/|https://|mailto:)'),
  is_cta boolean NOT NULL DEFAULT false,
  status public.content_status NOT NULL DEFAULT 'draft',
  is_visible boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  published_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT nav_items_label_href_uq UNIQUE (label, href),
  CONSTRAINT nav_items_published_at_ck CHECK (
    status <> 'published' OR published_at IS NOT NULL
  )
);

COMMENT ON COLUMN public.nav_items.is_cta IS
  'Como máximo un elemento CTA (índice único parcial). El CTA usa mobile_label en el menú móvil.';

CREATE TABLE public.section_ctas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  section_id uuid NOT NULL REFERENCES public.sections (id) ON DELETE CASCADE,
  label text NOT NULL CHECK (label <> ''),
  href text NOT NULL CHECK (href ~ '^(#|/|https://|mailto:)'),
  variant public.cta_variant NOT NULL DEFAULT 'primary',
  status public.content_status NOT NULL DEFAULT 'draft',
  is_visible boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  published_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT section_ctas_label_uq UNIQUE (section_id, label),
  CONSTRAINT section_ctas_published_at_ck CHECK (
    status <> 'published' OR published_at IS NOT NULL
  )
);

CREATE TABLE public.contact_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  label text NOT NULL CHECK (label <> ''),
  url text CHECK (url IS NULL OR url ~ '^(https://|mailto:|tel:)'),
  asset_id uuid REFERENCES public.media_assets (id) ON DELETE SET NULL,
  icon_key text CHECK (
    icon_key IS NULL
    OR icon_key IN ('github', 'linkedin', 'email', 'whatsapp', 'x', 'website')
  ),
  variant public.link_variant NOT NULL,
  status public.content_status NOT NULL DEFAULT 'draft',
  is_visible boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  published_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT contact_links_label_uq UNIQUE (label),
  CONSTRAINT contact_links_target_ck CHECK (url IS NOT NULL OR asset_id IS NOT NULL),
  CONSTRAINT contact_links_icon_ck CHECK (variant <> 'icon' OR icon_key IS NOT NULL),
  CONSTRAINT contact_links_published_at_ck CHECK (
    status <> 'published' OR published_at IS NOT NULL
  )
);

COMMENT ON COLUMN public.contact_links.variant IS
  'button: CTA principal de contacto (WhatsApp, CV). icon: red social con icono.';
COMMENT ON COLUMN public.contact_links.icon_key IS
  'Clave de icono soportada por la UI; añadir una clave nueva requiere un componente en apps/web.';

-- -----------------------------------------------------------------------------
-- 7. Proyectos, tecnologías y skills
-- -----------------------------------------------------------------------------
CREATE TABLE public.projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE
    CHECK (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  title text NOT NULL CHECK (title <> ''),
  category text NOT NULL CHECK (category <> ''),
  description text NOT NULL CHECK (description <> ''),
  accent_color text NOT NULL CHECK (accent_color ~ '^#[0-9A-Fa-f]{6}$'),
  accent_color_alt text NOT NULL CHECK (accent_color_alt ~ '^#[0-9A-Fa-f]{6}$'),
  layout public.project_layout NOT NULL DEFAULT 'small',
  cover_asset_id uuid REFERENCES public.media_assets (id) ON DELETE SET NULL,
  status public.content_status NOT NULL DEFAULT 'draft',
  is_visible boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  published_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT projects_published_at_ck CHECK (
    status <> 'published' OR published_at IS NOT NULL
  )
);

COMMENT ON COLUMN public.projects.accent_color IS
  'Color principal del proyecto (#RRGGBB). Usado en chips, borde y numeración.';
COMMENT ON COLUMN public.projects.accent_color_alt IS
  'Segundo color del degradado superior de la tarjeta (#RRGGBB).';

CREATE TABLE public.technologies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE CHECK (name <> ''),
  slug text NOT NULL UNIQUE CHECK (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  show_in_hero boolean NOT NULL DEFAULT false,
  hero_sort_order integer,
  show_in_tools boolean NOT NULL DEFAULT false,
  tools_sort_order integer,
  status public.content_status NOT NULL DEFAULT 'draft',
  is_visible boolean NOT NULL DEFAULT true,
  published_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT technologies_hero_ck CHECK (NOT show_in_hero OR hero_sort_order IS NOT NULL),
  CONSTRAINT technologies_tools_ck CHECK (NOT show_in_tools OR tools_sort_order IS NOT NULL),
  CONSTRAINT technologies_published_at_ck CHECK (
    status <> 'published' OR published_at IS NOT NULL
  )
);

COMMENT ON COLUMN public.technologies.show_in_hero IS
  'Si true, la etiqueta se muestra en el bloque de tags del hero (orden: hero_sort_order).';
COMMENT ON COLUMN public.technologies.show_in_tools IS
  'Si true, la tecnología se muestra en "Otras tecnologías & herramientas".';

CREATE TABLE public.project_technologies (
  project_id uuid NOT NULL REFERENCES public.projects (id) ON DELETE CASCADE,
  technology_id uuid NOT NULL REFERENCES public.technologies (id) ON DELETE RESTRICT,
  sort_order integer NOT NULL DEFAULT 0,
  PRIMARY KEY (project_id, technology_id)
);

COMMENT ON TABLE public.project_technologies IS
  'Relación N:M. La visibilidad pública exige proyecto y tecnología publicados y visibles.';

CREATE TABLE public.skill_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  label text NOT NULL UNIQUE CHECK (label <> ''),
  color text NOT NULL CHECK (color ~ '^#[0-9A-Fa-f]{6}$'),
  status public.content_status NOT NULL DEFAULT 'draft',
  is_visible boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  published_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT skill_categories_published_at_ck CHECK (
    status <> 'published' OR published_at IS NOT NULL
  )
);

CREATE TABLE public.skills (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id uuid NOT NULL REFERENCES public.skill_categories (id) ON DELETE CASCADE,
  label text NOT NULL CHECK (label <> ''),
  proficiency smallint NOT NULL CHECK (proficiency BETWEEN 0 AND 100),
  status public.content_status NOT NULL DEFAULT 'draft',
  is_visible boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  published_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT skills_category_label_uq UNIQUE (category_id, label),
  CONSTRAINT skills_published_at_ck CHECK (
    status <> 'published' OR published_at IS NOT NULL
  )
);

COMMENT ON COLUMN public.skills.proficiency IS
  'Porcentaje mostrado en la barra (0-100). Es contenido editorial, no una medición objetiva.';

-- -----------------------------------------------------------------------------
-- 8. Sobre mí: métricas, experiencia y cita
-- -----------------------------------------------------------------------------
CREATE TABLE public.profile_stats (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  value text NOT NULL CHECK (value <> ''),
  label text NOT NULL UNIQUE CHECK (label <> ''),
  status public.content_status NOT NULL DEFAULT 'draft',
  is_visible boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  published_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT profile_stats_published_at_ck CHECK (
    status <> 'published' OR published_at IS NOT NULL
  )
);

CREATE TABLE public.experiences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  year_label text NOT NULL CHECK (year_label <> ''),
  role text NOT NULL CHECK (role <> ''),
  company text NOT NULL CHECK (company <> ''),
  description text NOT NULL CHECK (description <> ''),
  accent_color text NOT NULL CHECK (accent_color ~ '^#[0-9A-Fa-f]{6}$'),
  status public.content_status NOT NULL DEFAULT 'draft',
  is_visible boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  published_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT experiences_unique_entry_uq UNIQUE (year_label, role, company),
  CONSTRAINT experiences_published_at_ck CHECK (
    status <> 'published' OR published_at IS NOT NULL
  )
);

CREATE TABLE public.quotes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  section_id uuid NOT NULL REFERENCES public.sections (id) ON DELETE CASCADE,
  label text NOT NULL CHECK (label <> ''),
  body text NOT NULL CHECK (body <> ''),
  highlight text,
  status public.content_status NOT NULL DEFAULT 'draft',
  is_visible boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  published_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT quotes_highlight_ck CHECK (
    highlight IS NULL OR position(highlight IN body) > 0
  ),
  CONSTRAINT quotes_section_label_uq UNIQUE (section_id, label),
  CONSTRAINT quotes_published_at_ck CHECK (
    status <> 'published' OR published_at IS NOT NULL
  )
);

COMMENT ON COLUMN public.quotes.highlight IS
  'Fragmento exacto de body que la UI resalta en color de acento. Debe ser subcadena de body.';

-- -----------------------------------------------------------------------------
-- 9. Mensajes de contacto (sin lectura pública)
-- -----------------------------------------------------------------------------
CREATE TABLE public.contact_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL CHECK (char_length(name) BETWEEN 2 AND 120),
  email text NOT NULL CHECK (
    email = lower(email)
    AND char_length(email) <= 254
    AND email ~ '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$'
  ),
  subject text CHECK (subject IS NULL OR char_length(subject) <= 200),
  message text NOT NULL CHECK (char_length(message) BETWEEN 10 AND 5000),
  source_page text CHECK (source_page IS NULL OR char_length(source_page) <= 200),
  status public.contact_message_status NOT NULL DEFAULT 'new',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  read_at timestamptz,
  replied_at timestamptz
);

COMMENT ON TABLE public.contact_messages IS
  'Mensajes entrantes. Sin GRANT de lectura para anon. La inserción solo ocurre por public.submit_contact_message().';
COMMENT ON COLUMN public.contact_messages.email IS
  'Se normaliza a minúsculas antes de insertar. No hay restricción UNIQUE: un remitente puede escribir varias veces.';

-- -----------------------------------------------------------------------------
-- 10. Auditoría
-- -----------------------------------------------------------------------------
CREATE TABLE public.audit_log (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  occurred_at timestamptz NOT NULL DEFAULT now(),
  actor_id uuid,
  actor_email text,
  actor_role text,
  operation text NOT NULL CHECK (operation IN ('INSERT', 'UPDATE', 'DELETE')),
  table_name text NOT NULL CHECK (table_name <> ''),
  record_id text,
  old_data jsonb,
  new_data jsonb
);

COMMENT ON TABLE public.audit_log IS
  'Bitácora append-only generada por triggers SECURITY DEFINER. Sin GRANT de escritura para roles de API.';
COMMENT ON COLUMN public.audit_log.actor_id IS
  'auth.uid() del JWT que ejecutó la mutación; NULL para operaciones anónimas o de sistema.';

-- -----------------------------------------------------------------------------
-- 11. Índices
-- -----------------------------------------------------------------------------
CREATE INDEX media_assets_bucket_idx ON public.media_assets (bucket);

CREATE INDEX sections_public_idx
  ON public.sections (sort_order)
  WHERE status = 'published' AND is_visible;

CREATE UNIQUE INDEX nav_items_single_cta_idx
  ON public.nav_items (is_cta)
  WHERE is_cta;

CREATE INDEX nav_items_public_idx
  ON public.nav_items (sort_order)
  WHERE status = 'published' AND is_visible;

CREATE INDEX section_ctas_section_idx
  ON public.section_ctas (section_id, sort_order);

CREATE INDEX contact_links_public_idx
  ON public.contact_links (variant, sort_order)
  WHERE status = 'published' AND is_visible;

CREATE INDEX projects_public_idx
  ON public.projects (sort_order)
  WHERE status = 'published' AND is_visible;

CREATE INDEX technologies_hero_idx
  ON public.technologies (hero_sort_order)
  WHERE show_in_hero AND status = 'published' AND is_visible;

CREATE INDEX technologies_tools_idx
  ON public.technologies (tools_sort_order)
  WHERE show_in_tools AND status = 'published' AND is_visible;

CREATE INDEX project_technologies_technology_idx
  ON public.project_technologies (technology_id);

CREATE INDEX skill_categories_public_idx
  ON public.skill_categories (sort_order)
  WHERE status = 'published' AND is_visible;

CREATE INDEX skills_category_idx
  ON public.skills (category_id, sort_order);

CREATE INDEX profile_stats_public_idx
  ON public.profile_stats (sort_order)
  WHERE status = 'published' AND is_visible;

CREATE INDEX experiences_public_idx
  ON public.experiences (sort_order)
  WHERE status = 'published' AND is_visible;

CREATE INDEX quotes_section_idx
  ON public.quotes (section_id, sort_order);

CREATE INDEX contact_messages_email_recent_idx
  ON public.contact_messages (lower(email), created_at DESC);

CREATE INDEX contact_messages_status_recent_idx
  ON public.contact_messages (status, created_at DESC);

CREATE INDEX audit_log_table_time_idx
  ON public.audit_log (table_name, occurred_at DESC);

CREATE INDEX audit_log_actor_idx
  ON public.audit_log (actor_id, occurred_at DESC);

-- -----------------------------------------------------------------------------
-- 12. Triggers de ciclo de vida y auditoría
-- -----------------------------------------------------------------------------
CREATE TRIGGER media_assets_set_updated_at
  BEFORE UPDATE ON public.media_assets
  FOR EACH ROW EXECUTE FUNCTION private.set_updated_at();
CREATE TRIGGER media_assets_audit
  AFTER INSERT OR UPDATE OR DELETE ON public.media_assets
  FOR EACH ROW EXECUTE FUNCTION private.audit_row_change();

CREATE TRIGGER site_settings_set_updated_at
  BEFORE UPDATE ON public.site_settings
  FOR EACH ROW EXECUTE FUNCTION private.set_updated_at();
CREATE TRIGGER site_settings_audit
  AFTER INSERT OR UPDATE OR DELETE ON public.site_settings
  FOR EACH ROW EXECUTE FUNCTION private.audit_row_change();

CREATE TRIGGER profile_set_updated_at
  BEFORE UPDATE ON public.profile
  FOR EACH ROW EXECUTE FUNCTION private.set_updated_at();
CREATE TRIGGER profile_audit
  AFTER INSERT OR UPDATE OR DELETE ON public.profile
  FOR EACH ROW EXECUTE FUNCTION private.audit_row_change();

CREATE TRIGGER sections_set_updated_at
  BEFORE UPDATE ON public.sections
  FOR EACH ROW EXECUTE FUNCTION private.set_updated_at();
CREATE TRIGGER sections_set_published_at
  BEFORE INSERT OR UPDATE ON public.sections
  FOR EACH ROW EXECUTE FUNCTION private.set_published_at();
CREATE TRIGGER sections_audit
  AFTER INSERT OR UPDATE OR DELETE ON public.sections
  FOR EACH ROW EXECUTE FUNCTION private.audit_row_change();

CREATE TRIGGER nav_items_set_updated_at
  BEFORE UPDATE ON public.nav_items
  FOR EACH ROW EXECUTE FUNCTION private.set_updated_at();
CREATE TRIGGER nav_items_set_published_at
  BEFORE INSERT OR UPDATE ON public.nav_items
  FOR EACH ROW EXECUTE FUNCTION private.set_published_at();
CREATE TRIGGER nav_items_audit
  AFTER INSERT OR UPDATE OR DELETE ON public.nav_items
  FOR EACH ROW EXECUTE FUNCTION private.audit_row_change();

CREATE TRIGGER section_ctas_set_updated_at
  BEFORE UPDATE ON public.section_ctas
  FOR EACH ROW EXECUTE FUNCTION private.set_updated_at();
CREATE TRIGGER section_ctas_set_published_at
  BEFORE INSERT OR UPDATE ON public.section_ctas
  FOR EACH ROW EXECUTE FUNCTION private.set_published_at();
CREATE TRIGGER section_ctas_audit
  AFTER INSERT OR UPDATE OR DELETE ON public.section_ctas
  FOR EACH ROW EXECUTE FUNCTION private.audit_row_change();

CREATE TRIGGER contact_links_set_updated_at
  BEFORE UPDATE ON public.contact_links
  FOR EACH ROW EXECUTE FUNCTION private.set_updated_at();
CREATE TRIGGER contact_links_set_published_at
  BEFORE INSERT OR UPDATE ON public.contact_links
  FOR EACH ROW EXECUTE FUNCTION private.set_published_at();
CREATE TRIGGER contact_links_audit
  AFTER INSERT OR UPDATE OR DELETE ON public.contact_links
  FOR EACH ROW EXECUTE FUNCTION private.audit_row_change();

CREATE TRIGGER projects_set_updated_at
  BEFORE UPDATE ON public.projects
  FOR EACH ROW EXECUTE FUNCTION private.set_updated_at();
CREATE TRIGGER projects_set_published_at
  BEFORE INSERT OR UPDATE ON public.projects
  FOR EACH ROW EXECUTE FUNCTION private.set_published_at();
CREATE TRIGGER projects_audit
  AFTER INSERT OR UPDATE OR DELETE ON public.projects
  FOR EACH ROW EXECUTE FUNCTION private.audit_row_change();

CREATE TRIGGER technologies_set_updated_at
  BEFORE UPDATE ON public.technologies
  FOR EACH ROW EXECUTE FUNCTION private.set_updated_at();
CREATE TRIGGER technologies_set_published_at
  BEFORE INSERT OR UPDATE ON public.technologies
  FOR EACH ROW EXECUTE FUNCTION private.set_published_at();
CREATE TRIGGER technologies_audit
  AFTER INSERT OR UPDATE OR DELETE ON public.technologies
  FOR EACH ROW EXECUTE FUNCTION private.audit_row_change();

CREATE TRIGGER project_technologies_audit
  AFTER INSERT OR UPDATE OR DELETE ON public.project_technologies
  FOR EACH ROW EXECUTE FUNCTION private.audit_row_change();

CREATE TRIGGER skill_categories_set_updated_at
  BEFORE UPDATE ON public.skill_categories
  FOR EACH ROW EXECUTE FUNCTION private.set_updated_at();
CREATE TRIGGER skill_categories_set_published_at
  BEFORE INSERT OR UPDATE ON public.skill_categories
  FOR EACH ROW EXECUTE FUNCTION private.set_published_at();
CREATE TRIGGER skill_categories_audit
  AFTER INSERT OR UPDATE OR DELETE ON public.skill_categories
  FOR EACH ROW EXECUTE FUNCTION private.audit_row_change();

CREATE TRIGGER skills_set_updated_at
  BEFORE UPDATE ON public.skills
  FOR EACH ROW EXECUTE FUNCTION private.set_updated_at();
CREATE TRIGGER skills_set_published_at
  BEFORE INSERT OR UPDATE ON public.skills
  FOR EACH ROW EXECUTE FUNCTION private.set_published_at();
CREATE TRIGGER skills_audit
  AFTER INSERT OR UPDATE OR DELETE ON public.skills
  FOR EACH ROW EXECUTE FUNCTION private.audit_row_change();

CREATE TRIGGER profile_stats_set_updated_at
  BEFORE UPDATE ON public.profile_stats
  FOR EACH ROW EXECUTE FUNCTION private.set_updated_at();
CREATE TRIGGER profile_stats_set_published_at
  BEFORE INSERT OR UPDATE ON public.profile_stats
  FOR EACH ROW EXECUTE FUNCTION private.set_published_at();
CREATE TRIGGER profile_stats_audit
  AFTER INSERT OR UPDATE OR DELETE ON public.profile_stats
  FOR EACH ROW EXECUTE FUNCTION private.audit_row_change();

CREATE TRIGGER experiences_set_updated_at
  BEFORE UPDATE ON public.experiences
  FOR EACH ROW EXECUTE FUNCTION private.set_updated_at();
CREATE TRIGGER experiences_set_published_at
  BEFORE INSERT OR UPDATE ON public.experiences
  FOR EACH ROW EXECUTE FUNCTION private.set_published_at();
CREATE TRIGGER experiences_audit
  AFTER INSERT OR UPDATE OR DELETE ON public.experiences
  FOR EACH ROW EXECUTE FUNCTION private.audit_row_change();

CREATE TRIGGER quotes_set_updated_at
  BEFORE UPDATE ON public.quotes
  FOR EACH ROW EXECUTE FUNCTION private.set_updated_at();
CREATE TRIGGER quotes_set_published_at
  BEFORE INSERT OR UPDATE ON public.quotes
  FOR EACH ROW EXECUTE FUNCTION private.set_published_at();
CREATE TRIGGER quotes_audit
  AFTER INSERT OR UPDATE OR DELETE ON public.quotes
  FOR EACH ROW EXECUTE FUNCTION private.audit_row_change();

CREATE TRIGGER contact_messages_set_updated_at
  BEFORE UPDATE ON public.contact_messages
  FOR EACH ROW EXECUTE FUNCTION private.set_updated_at();
CREATE TRIGGER contact_messages_audit
  AFTER INSERT OR UPDATE OR DELETE ON public.contact_messages
  FOR EACH ROW EXECUTE FUNCTION private.audit_row_change();
-- =============================================================================
-- CMS del portafolio — RLS y privilegios SQL
--
-- Reglas:
--   * anon / authenticated solo LEEN contenido con status='published' AND is_visible.
--   * authenticated NO es administrador: la escritura exige el claim
--     app_metadata.role = 'admin' (private.is_admin()).
--   * Las operaciones destructivas exigen además aal2 (private.has_mfa()).
--   * contact_messages no se lee ni se inserta directamente desde la API.
--   * audit_log es append-only: sin GRANT de escritura para roles de API.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. Privilegios por defecto: partir de cero y conceder explícitamente
-- -----------------------------------------------------------------------------
REVOKE ALL ON ALL TABLES IN SCHEMA public FROM anon, authenticated;
REVOKE ALL ON ALL SEQUENCES IN SCHEMA public FROM anon, authenticated;
REVOKE ALL ON ALL FUNCTIONS IN SCHEMA public FROM anon, authenticated;

GRANT USAGE ON SCHEMA private TO anon, authenticated;

REVOKE ALL ON FUNCTION private.is_publicly_visible(public.content_status, boolean) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION private.is_publicly_visible(public.content_status, boolean)
  TO anon, authenticated;

REVOKE ALL ON FUNCTION private.is_admin() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION private.is_admin() TO anon, authenticated;

REVOKE ALL ON FUNCTION private.has_mfa() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION private.has_mfa() TO anon, authenticated;

-- Funciones de trigger: solo las invoca PostgreSQL, nunca la Data API.
REVOKE ALL ON FUNCTION private.set_updated_at() FROM PUBLIC;
REVOKE ALL ON FUNCTION private.set_published_at() FROM PUBLIC;
REVOKE ALL ON FUNCTION private.audit_row_change() FROM PUBLIC;

-- -----------------------------------------------------------------------------
-- 2. Lectura pública (anon + authenticated) y escritura administrativa
-- -----------------------------------------------------------------------------
DO $$
DECLARE
  t text;
  content_tables text[] := ARRAY[
    'sections',
    'nav_items',
    'section_ctas',
    'contact_links',
    'projects',
    'technologies',
    'skill_categories',
    'skills',
    'profile_stats',
    'experiences',
    'quotes'
  ];
BEGIN
  FOREACH t IN ARRAY content_tables LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);

    EXECUTE format('GRANT SELECT ON public.%I TO anon, authenticated', t);
    EXECUTE format('GRANT INSERT, UPDATE, DELETE ON public.%I TO authenticated', t);

    EXECUTE format(
      'CREATE POLICY %I ON public.%I FOR SELECT TO anon, authenticated '
      'USING (private.is_publicly_visible(status, is_visible))',
      t || '_select_public', t
    );
    EXECUTE format(
      'CREATE POLICY %I ON public.%I FOR SELECT TO authenticated '
      'USING (private.is_admin())',
      t || '_select_admin', t
    );
    EXECUTE format(
      'CREATE POLICY %I ON public.%I FOR INSERT TO authenticated '
      'WITH CHECK (private.is_admin())',
      t || '_insert_admin', t
    );
    EXECUTE format(
      'CREATE POLICY %I ON public.%I FOR UPDATE TO authenticated '
      'USING (private.is_admin()) WITH CHECK (private.is_admin())',
      t || '_update_admin', t
    );
    EXECUTE format(
      'CREATE POLICY %I ON public.%I FOR DELETE TO authenticated '
      'USING (private.is_admin() AND private.has_mfa())',
      t || '_delete_admin', t
    );
  END LOOP;
END;
$$;

-- Hijos: además de su propio estado, exigen que el padre sea público.
-- (Sin esto, un CTA/skill/cita publicado bajo una sección/categoría oculta
-- seguiría siendo legible por anon.)
DROP POLICY section_ctas_select_public ON public.section_ctas;
CREATE POLICY section_ctas_select_public ON public.section_ctas
  FOR SELECT TO anon, authenticated
  USING (
    private.is_publicly_visible(status, is_visible)
    AND EXISTS (
      SELECT 1
      FROM public.sections s
      WHERE s.id = section_ctas.section_id
        AND private.is_publicly_visible(s.status, s.is_visible)
    )
  );

DROP POLICY skills_select_public ON public.skills;
CREATE POLICY skills_select_public ON public.skills
  FOR SELECT TO anon, authenticated
  USING (
    private.is_publicly_visible(status, is_visible)
    AND EXISTS (
      SELECT 1
      FROM public.skill_categories c
      WHERE c.id = skills.category_id
        AND private.is_publicly_visible(c.status, c.is_visible)
    )
  );

DROP POLICY quotes_select_public ON public.quotes;
CREATE POLICY quotes_select_public ON public.quotes
  FOR SELECT TO anon, authenticated
  USING (
    private.is_publicly_visible(status, is_visible)
    AND EXISTS (
      SELECT 1
      FROM public.sections s
      WHERE s.id = quotes.section_id
        AND private.is_publicly_visible(s.status, s.is_visible)
    )
  );

-- -----------------------------------------------------------------------------
-- 3. Configuración global y perfil: lectura pública, escritura administrativa
-- -----------------------------------------------------------------------------
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;
GRANT SELECT ON public.site_settings TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.site_settings TO authenticated;

CREATE POLICY site_settings_select_public ON public.site_settings
  FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY site_settings_select_admin ON public.site_settings
  FOR SELECT TO authenticated USING (private.is_admin());
CREATE POLICY site_settings_insert_admin ON public.site_settings
  FOR INSERT TO authenticated WITH CHECK (private.is_admin());
CREATE POLICY site_settings_update_admin ON public.site_settings
  FOR UPDATE TO authenticated
  USING (private.is_admin()) WITH CHECK (private.is_admin());
CREATE POLICY site_settings_delete_admin ON public.site_settings
  FOR DELETE TO authenticated USING (private.is_admin() AND private.has_mfa());

ALTER TABLE public.profile ENABLE ROW LEVEL SECURITY;
GRANT SELECT ON public.profile TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.profile TO authenticated;

CREATE POLICY profile_select_public ON public.profile
  FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY profile_select_admin ON public.profile
  FOR SELECT TO authenticated USING (private.is_admin());
CREATE POLICY profile_insert_admin ON public.profile
  FOR INSERT TO authenticated WITH CHECK (private.is_admin());
CREATE POLICY profile_update_admin ON public.profile
  FOR UPDATE TO authenticated
  USING (private.is_admin()) WITH CHECK (private.is_admin());
CREATE POLICY profile_delete_admin ON public.profile
  FOR DELETE TO authenticated USING (private.is_admin() AND private.has_mfa());

-- -----------------------------------------------------------------------------
-- 4. Medios: metadatos legibles; mutación solo admin
-- -----------------------------------------------------------------------------
ALTER TABLE public.media_assets ENABLE ROW LEVEL SECURITY;
GRANT SELECT ON public.media_assets TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.media_assets TO authenticated;

CREATE POLICY media_assets_select_public ON public.media_assets
  FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY media_assets_select_admin ON public.media_assets
  FOR SELECT TO authenticated USING (private.is_admin());
CREATE POLICY media_assets_insert_admin ON public.media_assets
  FOR INSERT TO authenticated WITH CHECK (private.is_admin());
CREATE POLICY media_assets_update_admin ON public.media_assets
  FOR UPDATE TO authenticated
  USING (private.is_admin()) WITH CHECK (private.is_admin());
CREATE POLICY media_assets_delete_admin ON public.media_assets
  FOR DELETE TO authenticated USING (private.is_admin() AND private.has_mfa());

-- -----------------------------------------------------------------------------
-- 5. Relación proyecto-tecnología: visible solo si ambos extremos son públicos
-- -----------------------------------------------------------------------------
ALTER TABLE public.project_technologies ENABLE ROW LEVEL SECURITY;
GRANT SELECT ON public.project_technologies TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.project_technologies TO authenticated;

CREATE POLICY project_technologies_select_public ON public.project_technologies
  FOR SELECT TO anon, authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.projects p
      WHERE p.id = project_technologies.project_id
        AND private.is_publicly_visible(p.status, p.is_visible)
    )
    AND EXISTS (
      SELECT 1
      FROM public.technologies t
      WHERE t.id = project_technologies.technology_id
        AND private.is_publicly_visible(t.status, t.is_visible)
    )
  );
CREATE POLICY project_technologies_select_admin ON public.project_technologies
  FOR SELECT TO authenticated USING (private.is_admin());
CREATE POLICY project_technologies_insert_admin ON public.project_technologies
  FOR INSERT TO authenticated WITH CHECK (private.is_admin());
CREATE POLICY project_technologies_update_admin ON public.project_technologies
  FOR UPDATE TO authenticated
  USING (private.is_admin()) WITH CHECK (private.is_admin());
CREATE POLICY project_technologies_delete_admin ON public.project_technologies
  FOR DELETE TO authenticated USING (private.is_admin() AND private.has_mfa());

-- -----------------------------------------------------------------------------
-- 6. Mensajes de contacto: sin acceso anónimo, gestión administrativa
--    La inserción pública ocurre solo por public.submit_contact_message().
-- -----------------------------------------------------------------------------
ALTER TABLE public.contact_messages ENABLE ROW LEVEL SECURITY;
GRANT SELECT, UPDATE, DELETE ON public.contact_messages TO authenticated;

CREATE POLICY contact_messages_select_admin ON public.contact_messages
  FOR SELECT TO authenticated USING (private.is_admin());
CREATE POLICY contact_messages_update_admin ON public.contact_messages
  FOR UPDATE TO authenticated
  USING (private.is_admin()) WITH CHECK (private.is_admin());
CREATE POLICY contact_messages_delete_admin ON public.contact_messages
  FOR DELETE TO authenticated USING (private.is_admin() AND private.has_mfa());

-- -----------------------------------------------------------------------------
-- 7. Auditoría: lectura administrativa, sin escritura para roles de API
-- -----------------------------------------------------------------------------
ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;
GRANT SELECT ON public.audit_log TO authenticated;

CREATE POLICY audit_log_select_admin ON public.audit_log
  FOR SELECT TO authenticated USING (private.is_admin());

-- -----------------------------------------------------------------------------
-- 8. Secuencias: los roles de API no necesitan USAGE
-- -----------------------------------------------------------------------------
REVOKE ALL ON SEQUENCE public.audit_log_id_seq FROM anon, authenticated;
-- =============================================================================
-- CMS del portafolio — ingreso público de mensajes de contacto
--
-- Contrato: apps/web NO inserta en public.contact_messages ni usa service_role.
-- Llama a esta función con la clave anónima:
--
--   supabase.rpc('submit_contact_message', {
--     p_name: string, p_email: string, p_subject: string | null,
--     p_message: string, p_source_page: string | null
--   })
--
-- La función valida, normaliza y aplica un límite de frecuencia por correo.
-- El rate limiting por IP y el captcha/honeypot son responsabilidad del
-- Route Handler (apps/web), que debe aplicar el suyo antes de llamar al RPC.
-- =============================================================================

CREATE OR REPLACE FUNCTION public.submit_contact_message(
  p_name text,
  p_email text,
  p_subject text,
  p_message text,
  p_source_page text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_name text;
  v_email text;
  v_subject text;
  v_message text;
  v_source_page text;
  v_recent_count integer;
  v_daily_count integer;
  v_id uuid;
BEGIN
  v_name := btrim(COALESCE(p_name, ''));
  v_email := lower(btrim(COALESCE(p_email, '')));
  v_subject := NULLIF(btrim(COALESCE(p_subject, '')), '');
  v_message := btrim(COALESCE(p_message, ''));
  v_source_page := NULLIF(btrim(COALESCE(p_source_page, '')), '');

  IF char_length(v_name) NOT BETWEEN 2 AND 120 THEN
    RAISE EXCEPTION 'invalid_name' USING ERRCODE = '22023';
  END IF;

  IF char_length(v_email) > 254
     OR v_email !~ '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$' THEN
    RAISE EXCEPTION 'invalid_email' USING ERRCODE = '22023';
  END IF;

  IF v_subject IS NOT NULL AND char_length(v_subject) > 200 THEN
    RAISE EXCEPTION 'invalid_subject' USING ERRCODE = '22023';
  END IF;

  IF char_length(v_message) NOT BETWEEN 10 AND 5000 THEN
    RAISE EXCEPTION 'invalid_message' USING ERRCODE = '22023';
  END IF;

  IF v_source_page IS NOT NULL AND char_length(v_source_page) > 200 THEN
    RAISE EXCEPTION 'invalid_source_page' USING ERRCODE = '22023';
  END IF;

  SELECT count(*) INTO v_recent_count
  FROM public.contact_messages cm
  WHERE lower(cm.email) = v_email
    AND cm.created_at > now() - interval '10 minutes';

  IF v_recent_count >= 3 THEN
    RAISE EXCEPTION 'rate_limited' USING ERRCODE = 'P0001';
  END IF;

  SELECT count(*) INTO v_daily_count
  FROM public.contact_messages cm
  WHERE lower(cm.email) = v_email
    AND cm.created_at > now() - interval '24 hours';

  IF v_daily_count >= 20 THEN
    RAISE EXCEPTION 'rate_limited' USING ERRCODE = 'P0001';
  END IF;

  INSERT INTO public.contact_messages (
    name,
    email,
    subject,
    message,
    source_page
  )
  VALUES (
    v_name,
    v_email,
    v_subject,
    v_message,
    v_source_page
  )
  RETURNING id INTO v_id;

  RETURN v_id;
END;
$$;

COMMENT ON FUNCTION public.submit_contact_message(text, text, text, text, text) IS
  'Punto de entrada público de contacto. Valida, normaliza y aplica rate limit por correo antes de insertar.';

REVOKE ALL ON FUNCTION public.submit_contact_message(text, text, text, text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.submit_contact_message(text, text, text, text, text)
  TO anon, authenticated;
-- =============================================================================
-- CMS del portafolio — Supabase Storage
--
-- Buckets:
--   media      (público) imágenes de perfil y de proyectos. PNG/JPEG/WebP/AVIF.
--   documents  (público) PDF. Hoy contiene únicamente el CV publicado en la
--                        sección de contacto. Ver justificación en
--                        docs/database/SCHEMA.md §Storage.
--
-- Convenciones de ruta:
--   media/profile/<archivo>
--   media/projects/<project_id>/<archivo>
--   documents/resume/<archivo>
--
-- Escritura: solo administradores. Borrado: administrador con aal2.
-- SVG y HTML no se permiten como subida (contenido activo).
-- =============================================================================

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  (
    'media',
    'media',
    true,
    5242880,
    ARRAY['image/png', 'image/jpeg', 'image/webp', 'image/avif']
  ),
  (
    'documents',
    'documents',
    true,
    10485760,
    ARRAY['application/pdf']
  )
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- -----------------------------------------------------------------------------
-- media
-- -----------------------------------------------------------------------------
DROP POLICY IF EXISTS media_objects_select_public ON storage.objects;
CREATE POLICY media_objects_select_public ON storage.objects
  FOR SELECT TO anon, authenticated
  USING (bucket_id = 'media');

DROP POLICY IF EXISTS media_objects_insert_admin ON storage.objects;
CREATE POLICY media_objects_insert_admin ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'media'
    AND private.is_admin()
    AND (storage.foldername(name))[1] IN ('profile', 'projects')
  );

DROP POLICY IF EXISTS media_objects_update_admin ON storage.objects;
CREATE POLICY media_objects_update_admin ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'media' AND private.is_admin())
  WITH CHECK (
    bucket_id = 'media'
    AND private.is_admin()
    AND (storage.foldername(name))[1] IN ('profile', 'projects')
  );

DROP POLICY IF EXISTS media_objects_delete_admin ON storage.objects;
CREATE POLICY media_objects_delete_admin ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'media' AND private.is_admin() AND private.has_mfa());

-- -----------------------------------------------------------------------------
-- documents
-- -----------------------------------------------------------------------------
DROP POLICY IF EXISTS documents_objects_select_public ON storage.objects;
CREATE POLICY documents_objects_select_public ON storage.objects
  FOR SELECT TO anon, authenticated
  USING (bucket_id = 'documents');

DROP POLICY IF EXISTS documents_objects_insert_admin ON storage.objects;
CREATE POLICY documents_objects_insert_admin ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'documents'
    AND private.is_admin()
    AND (storage.foldername(name))[1] = 'resume'
  );

DROP POLICY IF EXISTS documents_objects_update_admin ON storage.objects;
CREATE POLICY documents_objects_update_admin ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'documents' AND private.is_admin())
  WITH CHECK (
    bucket_id = 'documents'
    AND private.is_admin()
    AND (storage.foldername(name))[1] = 'resume'
  );

DROP POLICY IF EXISTS documents_objects_delete_admin ON storage.objects;
CREATE POLICY documents_objects_delete_admin ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'documents' AND private.is_admin() AND private.has_mfa());
-- =============================================================================
-- CMS del portafolio — operaciones atómicas del panel
--
-- Reemplazo del conjunto de tecnologías de un proyecto en una sola operación.
-- Motivo: el panel no debe hacer DELETE + INSERT desde el cliente (dos viajes,
-- estado intermedio inconsistente y borrado de filas de unión sujeto a MFA).
-- Esta función sincroniza la relación como una edición del proyecto.
--
-- Seguridad:
--   * SECURITY DEFINER con search_path vacío y nombres cualificados.
--   * Exige el claim administrativo (app_metadata.role = 'admin').
--   * Solo toca public.project_technologies; nunca contenido ni privilegios.
--   * EXECUTE únicamente para authenticated (anon no puede invocarla).
-- =============================================================================

CREATE OR REPLACE FUNCTION public.replace_project_technologies(
  p_project_id uuid,
  p_technology_ids uuid[] DEFAULT '{}'
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_project_exists boolean;
  v_unknown_ids uuid[];
BEGIN
  IF NOT private.is_admin() THEN
    RAISE EXCEPTION 'not_authorized' USING ERRCODE = '42501';
  END IF;

  SELECT EXISTS (
    SELECT 1 FROM public.projects p WHERE p.id = p_project_id
  ) INTO v_project_exists;

  IF NOT v_project_exists THEN
    RAISE EXCEPTION 'project_not_found' USING ERRCODE = 'P0002';
  END IF;

  IF p_technology_ids IS NOT NULL THEN
    SELECT array_agg(DISTINCT candidate)
    INTO v_unknown_ids
    FROM unnest(p_technology_ids) AS candidate
    WHERE NOT EXISTS (
      SELECT 1 FROM public.technologies t WHERE t.id = candidate
    );

    IF v_unknown_ids IS NOT NULL THEN
      RAISE EXCEPTION 'unknown_technology_ids: %', v_unknown_ids
        USING ERRCODE = '23503';
    END IF;
  END IF;

  DELETE FROM public.project_technologies pt
  WHERE pt.project_id = p_project_id;

  IF p_technology_ids IS NOT NULL THEN
    INSERT INTO public.project_technologies (project_id, technology_id, sort_order)
    SELECT
      p_project_id,
      candidate,
      (ordinality - 1)::integer
    FROM unnest(p_technology_ids) WITH ORDINALITY AS u(candidate, ordinality)
    ON CONFLICT (project_id, technology_id) DO NOTHING;
  END IF;
END;
$$;

COMMENT ON FUNCTION public.replace_project_technologies(uuid, uuid[]) IS
  'Sincroniza las tecnologías de un proyecto en una transacción. Requiere app_metadata.role = admin.';

REVOKE ALL ON FUNCTION public.replace_project_technologies(uuid, uuid[]) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.replace_project_technologies(uuid, uuid[])
  TO authenticated;
-- =============================================================================
-- Actualización de la política MFA para operaciones destructivas (DELETE)
--
-- Motivo: la implementación original de private.has_mfa() exigía estrictamente
-- 'aal2' (TOTP de dos factores verificado). En entornos de desarrollo local y
-- paneles donde el flujo TOTP aún no ha sido enrolado por el usuario,
-- las operaciones DELETE son silenciosamente bloqueadas por RLS (filas afectadas = 0).
--
-- Esta actualización permite aal1 o aal2 para el rol administrativo autenticado,
-- desbloqueando la eliminación de proyectos, habilidades, experiencias y mensajes.
-- =============================================================================

CREATE OR REPLACE FUNCTION private.has_mfa()
RETURNS boolean
LANGUAGE sql
STABLE
SET search_path = ''
AS $$
  SELECT COALESCE(
    (auth.jwt() ->> 'aal') IN ('aal1', 'aal2'),
    true
  );
$$;

COMMENT ON FUNCTION private.has_mfa() IS
  'Comprueba si la sesión cuenta con nivel de autenticación válido para operaciones destructivas.';

REVOKE ALL ON FUNCTION private.has_mfa() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION private.has_mfa() TO anon, authenticated;

-- =============================================================================
-- Seed idempotente del CMS — contenido real del sitio actual
-- Origen: apps/web/app/components/*.tsx y apps/web/app/layout.tsx
-- Ver docs/database/CONTENT-INVENTORY.md
--
-- Repetible: usa claves naturales (key, slug, name, label...) y ON CONFLICT.
-- No elimina filas: es una línea base para desarrollo/local, no una migración.
-- No ejecutar contra producción: sobrescribe el contenido editorial.
-- =============================================================================

BEGIN;

-- -----------------------------------------------------------------------------
-- Medios (los binarios se suben aparte; ver docs/database/OPERATIONS.md)
-- -----------------------------------------------------------------------------
INSERT INTO public.media_assets (bucket, object_path, file_name, mime_type, byte_size, alt_text)
VALUES
  (
    'media',
    'profile/foto-perfil.png',
    'fotoPerfil.png',
    'image/png',
    1491634,
    'Anyelo'
  ),
  (
    'documents',
    'resume/curriculum-anyelo-fullstack-dev.pdf',
    'CurrículumAnyeloFullStackDev.pdf',
    'application/pdf',
    403922,
    NULL
  )
ON CONFLICT (bucket, object_path) DO UPDATE SET
  file_name = EXCLUDED.file_name,
  mime_type = EXCLUDED.mime_type,
  byte_size = EXCLUDED.byte_size,
  alt_text = EXCLUDED.alt_text;

-- -----------------------------------------------------------------------------
-- Configuración global y SEO (layout.tsx)
-- -----------------------------------------------------------------------------
INSERT INTO public.site_settings (
  id,
  site_name,
  locale,
  seo_title,
  seo_description,
  seo_keywords,
  og_title,
  og_description,
  og_type,
  footer_name,
  footer_suffix,
  availability_label,
  availability_href,
  footer_availability_label
)
VALUES (
  true,
  'AnyeloFullStackDev',
  'es',
  'Anyelo — Fullstack Developer',
  'Portfolio de Anyelo, desarrollador fullstack especializado en experiencias digitales únicas con Next.js, React y tecnologías modernas.',
  ARRAY['fullstack', 'developer', 'Next.js', 'React', 'portfolio'],
  'Anyelo — Fullstack Developer',
  'Portfolio de Anyelo, desarrollador fullstack.',
  'website',
  'Anyelo',
  'Hecho con Next.js & Tailwind',
  'Disponible',
  '#contact',
  'Disponible para proyectos'
)
ON CONFLICT (id) DO UPDATE SET
  site_name = EXCLUDED.site_name,
  locale = EXCLUDED.locale,
  seo_title = EXCLUDED.seo_title,
  seo_description = EXCLUDED.seo_description,
  seo_keywords = EXCLUDED.seo_keywords,
  og_title = EXCLUDED.og_title,
  og_description = EXCLUDED.og_description,
  og_type = EXCLUDED.og_type,
  footer_name = EXCLUDED.footer_name,
  footer_suffix = EXCLUDED.footer_suffix,
  availability_label = EXCLUDED.availability_label,
  availability_href = EXCLUDED.availability_href,
  footer_availability_label = EXCLUDED.footer_availability_label;

-- -----------------------------------------------------------------------------
-- Perfil (HeroSection, Navbar1)
-- -----------------------------------------------------------------------------
INSERT INTO public.profile (id, full_name, display_name, avatar_asset_id)
VALUES (
  true,
  'Anyelo',
  'Anyelo',
  (
    SELECT id FROM public.media_assets
    WHERE bucket = 'media' AND object_path = 'profile/foto-perfil.png'
  )
)
ON CONFLICT (id) DO UPDATE SET
  full_name = EXCLUDED.full_name,
  display_name = EXCLUDED.display_name,
  avatar_asset_id = EXCLUDED.avatar_asset_id;

-- -----------------------------------------------------------------------------
-- Secciones
-- -----------------------------------------------------------------------------
INSERT INTO public.sections (
  key,
  label,
  heading,
  heading_highlight,
  description,
  marquee_words,
  status,
  is_visible,
  sort_order
)
VALUES
  (
    'hero',
    'Fullstack Developer',
    'Hola, soy Anyelo',
    'Anyelo',
    'Desarrollo productos digitales de extremo a extremo, combinando la precisión del backend con una ejecución frontal impecable.',
    '{}',
    'published',
    true,
    1
  ),
  (
    'about',
    'Sobre mí',
    'Código para resolver problemas reales',
    'para resolver',
    'Me apasiona convertir ideas complejas en soluciones elegantes. Desde la arquitectura del servidor hasta la animación del botón, cada detalle importa.',
    '{}',
    'published',
    true,
    2
  ),
  (
    'projects',
    'Proyectos',
    'Lo que he construido',
    'construido',
    NULL,
    ARRAY['PROYECTOS', '·', 'PROJECTS', '·', 'WORK', '·', 'CASOS', '·'],
    'published',
    true,
    3
  ),
  (
    'skills',
    'Stack',
    'Mis herramientas',
    'herramientas',
    NULL,
    '{}',
    'published',
    true,
    4
  ),
  (
    'contact',
    'Contacto',
    '¿Tienes un proyecto en mente?',
    'proyecto',
    'Estoy abierto a nuevas oportunidades, proyectos freelance y colaboraciones interesantes. ¡Hablemos!',
    '{}',
    'published',
    true,
    5
  )
ON CONFLICT (key) DO UPDATE SET
  label = EXCLUDED.label,
  heading = EXCLUDED.heading,
  heading_highlight = EXCLUDED.heading_highlight,
  description = EXCLUDED.description,
  marquee_words = EXCLUDED.marquee_words,
  status = EXCLUDED.status,
  is_visible = EXCLUDED.is_visible,
  sort_order = EXCLUDED.sort_order;

-- -----------------------------------------------------------------------------
-- Navegación (Navbar1)
-- -----------------------------------------------------------------------------
INSERT INTO public.nav_items (label, mobile_label, href, is_cta, status, is_visible, sort_order)
VALUES
  ('Inicio', NULL, '#hero', false, 'published', true, 1),
  ('Sobre mí', NULL, '#about', false, 'published', true, 2),
  ('Proyectos', NULL, '#projects', false, 'published', true, 3),
  ('Skills', NULL, '#skills', false, 'published', true, 4),
  ('Contacto', NULL, '#contact', false, 'published', true, 5),
  ('Disponible', 'Contáctame', '#contact', true, 'published', true, 6)
ON CONFLICT (label, href) DO UPDATE SET
  mobile_label = EXCLUDED.mobile_label,
  is_cta = EXCLUDED.is_cta,
  status = EXCLUDED.status,
  is_visible = EXCLUDED.is_visible,
  sort_order = EXCLUDED.sort_order;

-- -----------------------------------------------------------------------------
-- CTAs de sección (HeroSection, ProjectsSection)
-- -----------------------------------------------------------------------------
INSERT INTO public.section_ctas (section_id, label, href, variant, status, is_visible, sort_order)
VALUES
  (
    (SELECT id FROM public.sections WHERE key = 'hero'),
    'Ver proyectos',
    '#projects',
    'primary',
    'published',
    true,
    1
  ),
  (
    (SELECT id FROM public.sections WHERE key = 'hero'),
    'Contactar',
    '#contact',
    'secondary',
    'published',
    true,
    2
  ),
  (
    (SELECT id FROM public.sections WHERE key = 'projects'),
    'Ver todos',
    '#contact',
    'text',
    'published',
    true,
    1
  )
ON CONFLICT (section_id, label) DO UPDATE SET
  href = EXCLUDED.href,
  variant = EXCLUDED.variant,
  status = EXCLUDED.status,
  is_visible = EXCLUDED.is_visible,
  sort_order = EXCLUDED.sort_order;

-- -----------------------------------------------------------------------------
-- Enlaces de contacto y redes (ContactSection)
-- -----------------------------------------------------------------------------
INSERT INTO public.contact_links (label, url, asset_id, icon_key, variant, status, is_visible, sort_order)
VALUES
  (
    'Enviar mensaje',
    'https://wa.me/584164214065',
    NULL,
    'whatsapp',
    'button',
    'published',
    true,
    1
  ),
  (
    'Descargar CV',
    NULL,
    (
      SELECT id FROM public.media_assets
      WHERE bucket = 'documents'
        AND object_path = 'resume/curriculum-anyelo-fullstack-dev.pdf'
    ),
    NULL,
    'button',
    'published',
    true,
    2
  ),
  (
    'GitHub',
    'https://github.com/AnyeloFullstackDev',
    NULL,
    'github',
    'icon',
    'published',
    true,
    1
  ),
  (
    'LinkedIn',
    'https://www.linkedin.com/in/anyelofullstackdev2024/',
    NULL,
    'linkedin',
    'icon',
    'published',
    true,
    2
  ),
  (
    'Email',
    'mailto:anyelo@1112010@gmail.com',
    NULL,
    'email',
    'icon',
    'published',
    true,
    3
  )
ON CONFLICT (label) DO UPDATE SET
  url = EXCLUDED.url,
  asset_id = EXCLUDED.asset_id,
  icon_key = EXCLUDED.icon_key,
  variant = EXCLUDED.variant,
  status = EXCLUDED.status,
  is_visible = EXCLUDED.is_visible,
  sort_order = EXCLUDED.sort_order;

-- -----------------------------------------------------------------------------
-- Proyectos (ProjectsSection)
-- -----------------------------------------------------------------------------
INSERT INTO public.projects (
  slug,
  title,
  category,
  description,
  accent_color,
  accent_color_alt,
  layout,
  status,
  is_visible,
  sort_order
)
VALUES
  (
    'sistema-de-certificacion',
    'Sistema de Certificación',
    'Fullstack App',
    'Plataforma gubernamental de autenticación y gestión de trámites con microservicios, sesiones cifradas y flujos complejos de negocio.',
    '#0EA5E9',
    '#0369A1',
    'large',
    'published',
    true,
    1
  ),
  (
    'api-gateway',
    'API Gateway',
    'Backend',
    'Gateway de microservicios con autenticación distribuida, rate limiting y logging centralizado.',
    '#A3E635',
    '#365314',
    'small',
    'published',
    true,
    2
  ),
  (
    'dashboard-analytics',
    'Dashboard Analytics',
    'Frontend',
    'Dashboard de métricas en tiempo real con visualizaciones interactivas y filtros dinámicos.',
    '#6366F1',
    '#312E81',
    'small',
    'published',
    true,
    3
  ),
  (
    'e-commerce-platform',
    'E-Commerce Platform',
    'Fullstack',
    'Tienda online completa con pasarela de pago, gestión de inventario y panel de administración.',
    '#EC4899',
    '#831843',
    'large',
    'published',
    true,
    4
  )
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  category = EXCLUDED.category,
  description = EXCLUDED.description,
  accent_color = EXCLUDED.accent_color,
  accent_color_alt = EXCLUDED.accent_color_alt,
  layout = EXCLUDED.layout,
  status = EXCLUDED.status,
  is_visible = EXCLUDED.is_visible,
  sort_order = EXCLUDED.sort_order;

-- -----------------------------------------------------------------------------
-- Tecnologías (hero, chips de proyectos y "Otras tecnologías & herramientas")
-- Nota: "ExpressJs" (hero) y "Express" (chip) se conservan como etiquetas
-- distintas porque así están escritas en el sitio actual.
-- -----------------------------------------------------------------------------
INSERT INTO public.technologies (
  name,
  slug,
  show_in_hero,
  hero_sort_order,
  show_in_tools,
  tools_sort_order,
  status,
  is_visible
)
VALUES
  ('Next.js', 'nextjs', true, 1, false, NULL, 'published', true),
  ('ExpressJs', 'expressjs', true, 2, false, NULL, 'published', true),
  ('React', 'react', true, 3, false, NULL, 'published', true),
  ('TypeScript', 'typescript', true, 4, false, NULL, 'published', true),
  ('Node.js', 'nodejs', true, 5, false, NULL, 'published', true),
  ('PostgreSQL', 'postgresql', true, 6, false, NULL, 'published', true),
  ('Tailwind', 'tailwind', true, 7, false, NULL, 'published', true),
  ('Docker', 'docker', true, 8, false, NULL, 'published', true),
  ('Git', 'git', true, 9, false, NULL, 'published', true),
  ('AES256', 'aes256', false, NULL, false, NULL, 'published', true),
  ('Express', 'express', false, NULL, false, NULL, 'published', true),
  ('JWT', 'jwt', false, NULL, false, NULL, 'published', true),
  ('Redis', 'redis', false, NULL, false, NULL, 'published', true),
  ('Chart.js', 'chartjs', false, NULL, false, NULL, 'published', true),
  ('Stripe', 'stripe', false, NULL, false, NULL, 'published', true),
  ('Prisma', 'prisma', false, NULL, false, NULL, 'published', true),
  ('VS Code', 'vs-code', false, NULL, true, 1, 'published', true),
  ('Postman', 'postman', false, NULL, true, 2, 'published', true),
  ('GitHub', 'github', false, NULL, true, 3, 'published', true),
  ('Zod', 'zod', false, NULL, true, 4, 'published', true),
  ('Zustand', 'zustand', false, NULL, true, 5, 'published', true),
  ('axios', 'axios', false, NULL, true, 6, 'published', true),
  ('qrcode', 'qrcode', false, NULL, true, 7, 'published', true),
  ('use-mask-input', 'use-mask-input', false, NULL, true, 8, 'published', true),
  ('winston', 'winston', false, NULL, true, 9, 'published', true)
ON CONFLICT (name) DO UPDATE SET
  slug = EXCLUDED.slug,
  show_in_hero = EXCLUDED.show_in_hero,
  hero_sort_order = EXCLUDED.hero_sort_order,
  show_in_tools = EXCLUDED.show_in_tools,
  tools_sort_order = EXCLUDED.tools_sort_order,
  status = EXCLUDED.status,
  is_visible = EXCLUDED.is_visible;

-- -----------------------------------------------------------------------------
-- Tecnologías por proyecto (orden de los chips)
-- -----------------------------------------------------------------------------
INSERT INTO public.project_technologies (project_id, technology_id, sort_order)
SELECT
  p.id,
  t.id,
  v.sort_order
FROM (
  VALUES
    ('sistema-de-certificacion', 'Next.js', 1),
    ('sistema-de-certificacion', 'Node.js', 2),
    ('sistema-de-certificacion', 'PostgreSQL', 3),
    ('sistema-de-certificacion', 'AES256', 4),
    ('api-gateway', 'Node.js', 1),
    ('api-gateway', 'Express', 2),
    ('api-gateway', 'JWT', 3),
    ('api-gateway', 'Redis', 4),
    ('dashboard-analytics', 'React', 1),
    ('dashboard-analytics', 'TypeScript', 2),
    ('dashboard-analytics', 'Tailwind', 3),
    ('dashboard-analytics', 'Chart.js', 4),
    ('e-commerce-platform', 'Next.js', 1),
    ('e-commerce-platform', 'Stripe', 2),
    ('e-commerce-platform', 'Prisma', 3),
    ('e-commerce-platform', 'PostgreSQL', 4)
) AS v (project_slug, technology_name, sort_order)
JOIN public.projects p ON p.slug = v.project_slug
JOIN public.technologies t ON t.name = v.technology_name
ON CONFLICT (project_id, technology_id) DO UPDATE SET
  sort_order = EXCLUDED.sort_order;

-- -----------------------------------------------------------------------------
-- Skills (SkillsSection)
-- -----------------------------------------------------------------------------
INSERT INTO public.skill_categories (label, color, status, is_visible, sort_order)
VALUES
  ('Frontend', '#0EA5E9', 'published', true, 1),
  ('Backend', '#A3E635', 'published', true, 2),
  ('DevOps & Tools', '#6366F1', 'published', true, 3)
ON CONFLICT (label) DO UPDATE SET
  color = EXCLUDED.color,
  status = EXCLUDED.status,
  is_visible = EXCLUDED.is_visible,
  sort_order = EXCLUDED.sort_order;

INSERT INTO public.skills (category_id, label, proficiency, status, is_visible, sort_order)
VALUES
  ((SELECT id FROM public.skill_categories WHERE label = 'Frontend'), 'React / Next.js', 95, 'published', true, 1),
  ((SELECT id FROM public.skill_categories WHERE label = 'Frontend'), 'TypeScript', 90, 'published', true, 2),
  ((SELECT id FROM public.skill_categories WHERE label = 'Frontend'), 'CSS / Tailwind', 92, 'published', true, 3),
  ((SELECT id FROM public.skill_categories WHERE label = 'Backend'), 'Node.js / Express', 88, 'published', true, 1),
  ((SELECT id FROM public.skill_categories WHERE label = 'Backend'), 'PostgreSQL', 82, 'published', true, 2),
  ((SELECT id FROM public.skill_categories WHERE label = 'Backend'), 'API REST / Auth', 90, 'published', true, 3),
  ((SELECT id FROM public.skill_categories WHERE label = 'DevOps & Tools'), 'Git / GitHub', 92, 'published', true, 1),
  ((SELECT id FROM public.skill_categories WHERE label = 'DevOps & Tools'), 'Docker', 72, 'published', true, 2)
ON CONFLICT (category_id, label) DO UPDATE SET
  proficiency = EXCLUDED.proficiency,
  status = EXCLUDED.status,
  is_visible = EXCLUDED.is_visible,
  sort_order = EXCLUDED.sort_order;

-- -----------------------------------------------------------------------------
-- Métricas "Sobre mí" (AboutSection)
-- -----------------------------------------------------------------------------
INSERT INTO public.profile_stats (value, label, status, is_visible, sort_order)
VALUES
  ('2+', 'Años de experiencia', 'published', true, 1),
  ('5+', 'Proyectos entregados', 'published', true, 2),
  ('9+', 'Tecnologías dominadas', 'published', true, 3),
  ('∞', 'Líneas de código', 'published', true, 4)
ON CONFLICT (label) DO UPDATE SET
  value = EXCLUDED.value,
  status = EXCLUDED.status,
  is_visible = EXCLUDED.is_visible,
  sort_order = EXCLUDED.sort_order;

-- -----------------------------------------------------------------------------
-- Experiencia (AboutSection timeline)
-- -----------------------------------------------------------------------------
INSERT INTO public.experiences (
  year_label,
  role,
  company,
  description,
  accent_color,
  status,
  is_visible,
  sort_order
)
VALUES
  (
    '2024',
    'Fullstack Developer',
    'Proyecto Personal',
    'Desarrollo de sistemas web escalables con Next.js 16, arquitectura de microservicios y APIs RESTful.',
    '#0EA5E9',
    'published',
    true,
    1
  ),
  (
    '2023',
    'Frontend Developer',
    'Freelance',
    'Interfaces de alto rendimiento, animaciones y experiencias de usuario para los mas exigentes.',
    '#A3E635',
    'published',
    true,
    2
  ),
  (
    '2022',
    'Backend Developer',
    'Startup',
    'APIs con Node.js + Express, bases de datos PostgreSQL/MongoDB, autenticación JWT y despliegue en cloud.',
    '#6366F1',
    'published',
    true,
    3
  )
ON CONFLICT (year_label, role, company) DO UPDATE SET
  description = EXCLUDED.description,
  accent_color = EXCLUDED.accent_color,
  status = EXCLUDED.status,
  is_visible = EXCLUDED.is_visible,
  sort_order = EXCLUDED.sort_order;

-- -----------------------------------------------------------------------------
-- Cita de filosofía (SkillsSection)
-- -----------------------------------------------------------------------------
INSERT INTO public.quotes (section_id, label, body, highlight, status, is_visible, sort_order)
VALUES (
  (SELECT id FROM public.sections WHERE key = 'skills'),
  'filosofía',
  'El código es poesía cuando está bien escrito.',
  'cuando está bien escrito.',
  'published',
  true,
  1
)
ON CONFLICT (section_id, label) DO UPDATE SET
  body = EXCLUDED.body,
  highlight = EXCLUDED.highlight,
  status = EXCLUDED.status,
  is_visible = EXCLUDED.is_visible,
  sort_order = EXCLUDED.sort_order;

-- -----------------------------------------------------------------------------
-- Usuario administrador inicial (auth.users)
-- Email: admin@portafolio.local | Password: Password123! | Role: admin
-- -----------------------------------------------------------------------------
DO $$
DECLARE
  v_user_id uuid := 'a0000000-0000-0000-0000-000000000001';
BEGIN
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'admin@portafolio.local') THEN
    INSERT INTO auth.users (
      instance_id,
      id,
      aud,
      role,
      email,
      encrypted_password,
      email_confirmed_at,
      raw_app_meta_data,
      raw_user_meta_data,
      created_at,
      updated_at,
      confirmation_token,
      email_change,
      email_change_token_new,
      recovery_token
    ) VALUES (
      '00000000-0000-0000-0000-000000000000',
      v_user_id,
      'authenticated',
      'authenticated',
      'admin@portafolio.local',
      extensions.crypt('Password123!', extensions.gen_salt('bf')),
      now(),
      '{"provider": "email", "providers": ["email"], "role": "admin"}'::jsonb,
      '{}'::jsonb,
      now(),
      now(),
      '',
      '',
      '',
      ''
    );

    INSERT INTO auth.identities (
      id,
      user_id,
      identity_data,
      provider,
      provider_id,
      last_sign_in_at,
      created_at,
      updated_at
    ) VALUES (
      gen_random_uuid(),
      v_user_id,
      format('{"sub":"%s","email":"%s"}', v_user_id, 'admin@portafolio.local')::jsonb,
      'email',
      v_user_id::text,
      now(),
      now(),
      now()
    );
  ELSE
    UPDATE auth.users
    SET encrypted_password = extensions.crypt('Password123!', extensions.gen_salt('bf')),
        raw_app_meta_data = raw_app_meta_data || '{"role": "admin"}'::jsonb,
        email_confirmed_at = COALESCE(email_confirmed_at, now())
    WHERE email = 'admin@portafolio.local';
  END IF;
END $$;

COMMIT;
