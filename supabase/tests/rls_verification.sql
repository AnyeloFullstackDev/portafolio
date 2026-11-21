-- =============================================================================
-- Verificación de RLS, GRANTs, Auth y Storage contra PostgreSQL real.
--
-- Uso (Supabase Local ya iniciado y migraciones aplicadas). El usuario debe ser
-- superusuario para poder desactivar temporalmente el trigger de Storage:
--   psql "postgresql://supabase_admin:postgres@127.0.0.1:54322/postgres" \
--        -v ON_ERROR_STOP=1 -f supabase/tests/rls_verification.sql
--
-- Requiere superusuario (supabase_admin en Supabase Local) porque cambia de rol
-- y desactiva un trigger de storage.objects dentro de la transacción.
-- Todo ocurre dentro de una transacción que termina en ROLLBACK: no deja datos.
--
-- No sustituye una prueba de integración desde el cliente Supabase: valida el
-- comportamiento de PostgreSQL/RLS, no la capa HTTP de PostgREST ni la API de
-- Storage.
-- =============================================================================

\set ON_ERROR_STOP on

BEGIN;

-- -----------------------------------------------------------------------------
-- Helpers de aserción (se eliminan con el ROLLBACK final)
-- -----------------------------------------------------------------------------
CREATE SCHEMA verify_helpers;
GRANT USAGE ON SCHEMA verify_helpers TO anon, authenticated;

CREATE FUNCTION verify_helpers.expect_int(p_actual bigint, p_expected bigint, p_label text)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  IF p_actual IS DISTINCT FROM p_expected THEN
    RAISE EXCEPTION 'FAIL: % (esperado %, obtenido %)', p_label, p_expected, p_actual;
  END IF;
  RAISE NOTICE 'OK: % = %', p_label, p_actual;
END;
$$;

CREATE FUNCTION verify_helpers.expect_min(p_actual bigint, p_min bigint, p_label text)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  IF p_actual < p_min THEN
    RAISE EXCEPTION 'FAIL: % (mínimo %, obtenido %)', p_label, p_min, p_actual;
  END IF;
  RAISE NOTICE 'OK: % = % (>= %)', p_label, p_actual, p_min;
END;
$$;

CREATE FUNCTION verify_helpers.expect_true(p_value boolean, p_label text)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  IF p_value IS DISTINCT FROM true THEN
    RAISE EXCEPTION 'FAIL: %', p_label;
  END IF;
  RAISE NOTICE 'OK: %', p_label;
END;
$$;

CREATE FUNCTION verify_helpers.expect_error(p_sql text, p_sqlstate text, p_label text)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  BEGIN
    EXECUTE p_sql;
  EXCEPTION WHEN OTHERS THEN
    IF SQLSTATE = p_sqlstate THEN
      RAISE NOTICE 'OK: % bloqueado con SQLSTATE %', p_label, SQLSTATE;
      RETURN;
    END IF;
    RAISE EXCEPTION 'FAIL: % lanzó SQLSTATE % (esperado %)', p_label, SQLSTATE, p_sqlstate;
  END;
  RAISE EXCEPTION 'FAIL: % NO fue bloqueado', p_label;
END;
$$;

CREATE FUNCTION verify_helpers.expect_dml_rows(p_sql text, p_expected bigint, p_label text)
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
  v_rows bigint;
BEGIN
  EXECUTE p_sql;
  GET DIAGNOSTICS v_rows = ROW_COUNT;
  IF v_rows IS DISTINCT FROM p_expected THEN
    RAISE EXCEPTION 'FAIL: % (filas esperadas %, obtenidas %)', p_label, p_expected, v_rows;
  END IF;
  RAISE NOTICE 'OK: % afectó % fila(s)', p_label, v_rows;
END;
$$;

-- -----------------------------------------------------------------------------
-- Fixtures creados como superusuario (bypass de RLS), visibles en el rollback
-- -----------------------------------------------------------------------------
SELECT set_config('request.jwt.claims', '{}', true);

INSERT INTO public.projects (
  slug, title, category, description, accent_color, accent_color_alt,
  layout, status, is_visible, sort_order
)
VALUES
  (
    'rls-check-draft', 'Borrador de verificación', 'Backend',
    'Proyecto en borrador que nunca debe ser visible para anon.',
    '#111111', '#222222', 'small', 'draft', true, 90
  ),
  (
    'rls-check-hidden', 'Publicado pero oculto', 'Backend',
    'Proyecto publicado con is_visible = false; tampoco debe ser visible.',
    '#111111', '#222222', 'small', 'published', false, 91
  );

INSERT INTO public.technologies (name, slug, status, is_visible)
VALUES ('Tecnología Borrador', 'tecnologia-borrador', 'draft', true);

INSERT INTO public.project_technologies (project_id, technology_id, sort_order)
SELECT p.id, t.id, 1
FROM public.projects p, public.technologies t
WHERE p.slug = 'sistema-de-certificacion'
  AND t.slug = 'tecnologia-borrador';

-- =============================================================================
-- A. anon: lectura de contenido publicado y visible
-- =============================================================================
SELECT set_config(
  'request.jwt.claims',
  '{"role":"anon","iss":"supabase-db-verify"}',
  true
);
SET LOCAL ROLE anon;

SELECT verify_helpers.expect_int((SELECT count(*) FROM public.projects), 4, 'anon ve proyectos publicados');
SELECT verify_helpers.expect_int(
  (SELECT count(*) FROM public.projects WHERE slug IN ('rls-check-draft', 'rls-check-hidden')),
  0,
  'anon no ve borradores ni ocultos'
);
SELECT verify_helpers.expect_int((SELECT count(*) FROM public.sections), 5, 'anon ve secciones');
SELECT verify_helpers.expect_int((SELECT count(*) FROM public.nav_items), 6, 'anon ve navegación');
SELECT verify_helpers.expect_int((SELECT count(*) FROM public.section_ctas), 3, 'anon ve CTAs de sección');
SELECT verify_helpers.expect_int((SELECT count(*) FROM public.contact_links), 5, 'anon ve enlaces de contacto');
SELECT verify_helpers.expect_int((SELECT count(*) FROM public.skill_categories), 3, 'anon ve categorías de skills');
SELECT verify_helpers.expect_int((SELECT count(*) FROM public.skills), 8, 'anon ve skills');
SELECT verify_helpers.expect_int((SELECT count(*) FROM public.experiences), 3, 'anon ve experiencia');
SELECT verify_helpers.expect_int((SELECT count(*) FROM public.profile_stats), 4, 'anon ve métricas');
SELECT verify_helpers.expect_int((SELECT count(*) FROM public.quotes), 1, 'anon ve cita');
SELECT verify_helpers.expect_int((SELECT count(*) FROM public.site_settings), 1, 'anon ve configuración');
SELECT verify_helpers.expect_int((SELECT count(*) FROM public.profile), 1, 'anon ve perfil');
SELECT verify_helpers.expect_int((SELECT count(*) FROM public.media_assets), 2, 'anon ve metadatos de medios');
SELECT verify_helpers.expect_int(
  (SELECT count(*) FROM public.technologies WHERE show_in_hero),
  9,
  'anon ve 9 tags del hero'
);
SELECT verify_helpers.expect_int(
  (SELECT count(*) FROM public.project_technologies WHERE technology_id = (
    SELECT id FROM public.technologies WHERE slug = 'tecnologia-borrador'
  )),
  0,
  'anon no ve la relación con una tecnología en borrador'
);

-- =============================================================================
-- B. anon: sin escritura y sin acceso a mensajes/auditoría
-- =============================================================================
SELECT verify_helpers.expect_error(
  $sql$INSERT INTO public.projects (slug, title, category, description, accent_color, accent_color_alt)
       VALUES ('anon-intento', 'x', 'x', 'x', '#111111', '#222222')$sql$,
  '42501',
  'anon INSERT en projects'
);
SELECT verify_helpers.expect_error(
  $sql$UPDATE public.projects SET title = 'hackeado' WHERE slug = 'api-gateway'$sql$,
  '42501',
  'anon UPDATE en projects'
);
SELECT verify_helpers.expect_error(
  $sql$DELETE FROM public.projects WHERE slug = 'api-gateway'$sql$,
  '42501',
  'anon DELETE en projects'
);
SELECT verify_helpers.expect_error(
  $sql$SELECT count(*) FROM public.contact_messages$sql$,
  '42501',
  'anon SELECT en contact_messages'
);
SELECT verify_helpers.expect_error(
  $sql$INSERT INTO public.contact_messages (name, email, message)
       VALUES ('Anon', 'anon@example.com', 'Mensaje directo sin pasar por el RPC')$sql$,
  '42501',
  'anon INSERT directo en contact_messages'
);
SELECT verify_helpers.expect_error(
  $sql$SELECT count(*) FROM public.audit_log$sql$,
  '42501',
  'anon SELECT en audit_log'
);

-- =============================================================================
-- C. anon: RPC de contacto (única vía de inserción)
-- =============================================================================
SELECT verify_helpers.expect_true(
  (
    SELECT public.submit_contact_message(
      'Visitante Anónimo',
      'Visitante@Example.com',
      'Consulta',
      'Mensaje de prueba válido enviado desde el sitio público.',
      '/contacto'
    )
  ) IS NOT NULL,
  'anon ejecuta submit_contact_message'
);

SELECT verify_helpers.expect_error(
  $sql$SELECT public.submit_contact_message('X', 'no-es-email', NULL, 'Mensaje suficientemente largo')$sql$,
  '22023',
  'RPC rechaza email inválido'
);
SELECT verify_helpers.expect_error(
  $sql$SELECT public.submit_contact_message('X', 'corto@example.com', NULL, 'corto')$sql$,
  '22023',
  'RPC rechaza mensaje demasiado corto'
);

-- Límite: 3 mensajes por correo cada 10 minutos.
SELECT public.submit_contact_message('Rate Limit', 'rate@example.com', NULL, 'Mensaje de prueba para el límite 1');
SELECT public.submit_contact_message('Rate Limit', 'rate@example.com', NULL, 'Mensaje de prueba para el límite 2');
SELECT public.submit_contact_message('Rate Limit', 'rate@example.com', NULL, 'Mensaje de prueba para el límite 3');
SELECT verify_helpers.expect_error(
  $sql$SELECT public.submit_contact_message('Rate Limit', 'rate@example.com', NULL, 'Mensaje de prueba para el límite 4')$sql$,
  'P0001',
  'RPC aplica rate limit por correo'
);

RESET ROLE;

-- =============================================================================
-- D. authenticated SIN claim admin: mismo alcance de lectura que anon, sin escritura
-- =============================================================================
SELECT set_config(
  'request.jwt.claims',
  '{"sub":"11111111-1111-4111-8111-111111111111","role":"authenticated","email":"user@example.com","app_metadata":{}}',
  true
);
SET LOCAL ROLE authenticated;

SELECT verify_helpers.expect_int((SELECT count(*) FROM public.projects), 4, 'usuario autenticado no-admin ve solo publicados');
SELECT verify_helpers.expect_int(
  (SELECT count(*) FROM public.contact_messages),
  0,
  'usuario autenticado no-admin no lee contact_messages'
);
SELECT verify_helpers.expect_int(
  (SELECT count(*) FROM public.audit_log),
  0,
  'usuario autenticado no-admin no lee audit_log'
);
SELECT verify_helpers.expect_error(
  $sql$INSERT INTO public.projects (slug, title, category, description, accent_color, accent_color_alt)
       VALUES ('auth-intento', 'x', 'x', 'x', '#111111', '#222222')$sql$,
  '42501',
  'usuario autenticado no-admin no puede insertar'
);

RESET ROLE;

-- =============================================================================
-- E. authenticated CON claim admin (app_metadata.role = admin), aal1
-- =============================================================================
SELECT set_config(
  'request.jwt.claims',
  '{"sub":"22222222-2222-4222-8222-222222222222","role":"authenticated","email":"admin@example.com","app_metadata":{"role":"admin"},"aal":"aal1"}',
  true
);
SET LOCAL ROLE authenticated;

SELECT verify_helpers.expect_dml_rows(
  $sql$INSERT INTO public.projects (slug, title, category, description, accent_color, accent_color_alt, layout, status, is_visible, sort_order)
       VALUES ('admin-created', 'Creado por admin', 'Backend', 'Proyecto insertado por un administrador en la verificación.', '#123456', '#654321', 'small', 'draft', true, 92)$sql$,
  1,
  'admin INSERT en projects'
);
SELECT verify_helpers.expect_dml_rows(
  $sql$UPDATE public.projects SET status = 'published' WHERE slug = 'admin-created'$sql$,
  1,
  'admin UPDATE y publicación en projects'
);
SELECT verify_helpers.expect_min(
  (SELECT count(*) FROM public.contact_messages),
  1,
  'admin lee contact_messages'
);
SELECT verify_helpers.expect_min(
  (SELECT count(*) FROM public.audit_log),
  1,
  'admin lee audit_log'
);
SELECT verify_helpers.expect_dml_rows(
  $sql$DELETE FROM public.projects WHERE slug = 'admin-created'$sql$,
  0,
  'admin sin aal2 NO puede borrar'
);
SELECT verify_helpers.expect_min(
  (SELECT count(*) FROM public.projects WHERE slug = 'admin-created'),
  1,
  'el proyecto sigue existiendo tras el DELETE bloqueado'
);

RESET ROLE;

-- =============================================================================
-- F. authenticated CON claim admin y aal2 (MFA verificado)
-- =============================================================================
SELECT set_config(
  'request.jwt.claims',
  '{"sub":"22222222-2222-4222-8222-222222222222","role":"authenticated","email":"admin@example.com","app_metadata":{"role":"admin"},"aal":"aal2"}',
  true
);
SET LOCAL ROLE authenticated;

SELECT verify_helpers.expect_dml_rows(
  $sql$DELETE FROM public.projects WHERE slug = 'admin-created'$sql$,
  1,
  'admin con aal2 borra projects'
);

-- =============================================================================
-- G. Reemplazo atómico de tecnologías de un proyecto
-- =============================================================================
RESET ROLE;
SELECT set_config(
  'request.jwt.claims',
  '{"role":"anon","iss":"supabase-db-verify"}',
  true
);
SET LOCAL ROLE anon;

SELECT verify_helpers.expect_error(
  $sql$SELECT public.replace_project_technologies(
         (SELECT id FROM public.projects WHERE slug = 'api-gateway'),
         '{}'::uuid[]
       )$sql$,
  '42501',
  'anon no ejecuta replace_project_technologies'
);

RESET ROLE;
SELECT set_config(
  'request.jwt.claims',
  '{"sub":"11111111-1111-4111-8111-111111111111","role":"authenticated","email":"user@example.com","app_metadata":{}}',
  true
);
SET LOCAL ROLE authenticated;

SELECT verify_helpers.expect_error(
  $sql$SELECT public.replace_project_technologies(
         (SELECT id FROM public.projects WHERE slug = 'api-gateway'),
         '{}'::uuid[]
       )$sql$,
  '42501',
  'usuario no-admin no ejecuta replace_project_technologies'
);

RESET ROLE;
SELECT set_config(
  'request.jwt.claims',
  '{"sub":"22222222-2222-4222-8222-222222222222","role":"authenticated","email":"admin@example.com","app_metadata":{"role":"admin"},"aal":"aal1"}',
  true
);
SET LOCAL ROLE authenticated;

SELECT public.replace_project_technologies(
  (SELECT id FROM public.projects WHERE slug = 'api-gateway'),
  ARRAY[
    (SELECT id FROM public.technologies WHERE slug = 'nodejs'),
    (SELECT id FROM public.technologies WHERE slug = 'redis')
  ]
);

SELECT verify_helpers.expect_int(
  (
    SELECT count(*)
    FROM public.project_technologies
    WHERE project_id = (
      SELECT id FROM public.projects WHERE slug = 'api-gateway'
    )
  ),
  2,
  'replace_project_technologies deja exactamente 2 tecnologías'
);

SELECT verify_helpers.expect_error(
  $sql$SELECT public.replace_project_technologies(
         (SELECT id FROM public.projects WHERE slug = 'api-gateway'),
         ARRAY['00000000-0000-4000-8000-000000000000'::uuid]
       )$sql$,
  '23503',
  'replace_project_technologies rechaza una tecnología inexistente'
);

RESET ROLE;

-- Supabase protege storage.objects con un trigger que impide DELETE directo.
-- Se desactiva SOLO dentro de esta transacción para poder verificar la política
-- RLS de DELETE; en producción la vía soportada es la Storage API.
ALTER TABLE storage.objects DISABLE TRIGGER protect_objects_delete;

SELECT set_config(
  'request.jwt.claims',
  '{"sub":"22222222-2222-4222-8222-222222222222","role":"authenticated","email":"admin@example.com","app_metadata":{"role":"admin"},"aal":"aal2"}',
  true
);
SET LOCAL ROLE authenticated;

-- =============================================================================
-- H. Storage: lectura pública de ambos buckets, escritura solo admin
-- =============================================================================
SELECT verify_helpers.expect_dml_rows(
  $sql$INSERT INTO storage.objects (bucket_id, name) VALUES ('media', 'profile/verify.png')$sql$,
  1,
  'admin sube objeto en media/profile'
);
SELECT verify_helpers.expect_error(
  $sql$INSERT INTO storage.objects (bucket_id, name) VALUES ('media', 'secreto/verify.png')$sql$,
  '42501',
  'admin no puede usar una ruta fuera de media/{profile,projects}'
);
SELECT verify_helpers.expect_dml_rows(
  $sql$INSERT INTO storage.objects (bucket_id, name) VALUES ('documents', 'resume/verify.pdf')$sql$,
  1,
  'admin sube objeto en documents/resume'
);
SELECT verify_helpers.expect_error(
  $sql$INSERT INTO storage.objects (bucket_id, name) VALUES ('documents', 'privado/verify.pdf')$sql$,
  '42501',
  'admin no puede usar una ruta fuera de documents/resume'
);
SELECT verify_helpers.expect_dml_rows(
  $sql$DELETE FROM storage.objects WHERE name = 'resume/verify.pdf'$sql$,
  1,
  'admin con aal2 borra objeto de Storage'
);

RESET ROLE;

SELECT set_config(
  'request.jwt.claims',
  '{"role":"anon","iss":"supabase-db-verify"}',
  true
);
SET LOCAL ROLE anon;

SELECT verify_helpers.expect_int(
  (SELECT count(*) FROM storage.objects WHERE bucket_id IN ('media', 'documents')),
  1,
  'anon lee objetos de buckets públicos'
);
SELECT verify_helpers.expect_error(
  $sql$INSERT INTO storage.objects (bucket_id, name) VALUES ('media', 'profile/anon.png')$sql$,
  '42501',
  'anon no puede subir objetos'
);
SELECT verify_helpers.expect_dml_rows(
  $sql$DELETE FROM storage.objects WHERE name = 'profile/verify.png'$sql$,
  0,
  'anon no borra objetos (0 filas afectadas)'
);
SELECT verify_helpers.expect_int(
  (SELECT count(*) FROM storage.objects WHERE name = 'profile/verify.png'),
  1,
  'el objeto sigue existiendo tras el DELETE anónimo'
);

RESET ROLE;

\echo ''
\echo '=============================================================='
\echo ' TODAS LAS VERIFICACIONES RLS/GRANT/STORAGE PASARON'
\echo '=============================================================='

ROLLBACK;
