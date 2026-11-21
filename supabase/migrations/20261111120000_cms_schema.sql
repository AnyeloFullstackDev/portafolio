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
