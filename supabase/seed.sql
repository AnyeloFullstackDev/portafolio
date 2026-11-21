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
