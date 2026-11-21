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
