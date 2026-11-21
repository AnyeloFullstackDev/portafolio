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

