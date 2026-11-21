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
