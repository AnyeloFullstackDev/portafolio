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
