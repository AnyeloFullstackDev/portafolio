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
