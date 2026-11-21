# Inventario de contenido del portafolio

Documento de origen para el modelo de datos del CMS. Se elaboró leyendo el sitio
actual antes de diseñar el esquema:

- `apps/web/app/layout.tsx`
- `apps/web/app/page.tsx`
- `apps/web/app/components/Navbar1.tsx`
- `apps/web/app/components/HeroSection.tsx`
- `apps/web/app/components/AboutSection.tsx`
- `apps/web/app/components/ProjectsSection.tsx`
- `apps/web/app/components/SkillsSection.tsx`
- `apps/web/app/components/ContactSection.tsx`
- `apps/web/public/` (`fotoPerfil.png`, `CurrículumAnyeloFullStackDev.pdf`)

Cada dato que hoy está hardcodeado tiene una columna o una fila en PostgreSQL.
Los binarios viven en Supabase Storage y sus metadatos en `public.media_assets`.

## 1. Layout global y SEO

Origen: `layout.tsx`.

| Campo del sitio | Tipo | Origen actual | Obligatorio | Destino |
|---|---|---|---|---|
| `lang` | texto (`es`) | `layout.tsx` | Sí | `site_settings.locale` |
| Título SEO | texto | `metadata.title` | Sí | `site_settings.seo_title` |
| Descripción SEO | texto | `metadata.description` | Sí | `site_settings.seo_description` |
| Keywords | texto[] | `metadata.keywords` | No (array vacío) | `site_settings.seo_keywords` |
| Título Open Graph | texto | `metadata.openGraph.title` | Sí | `site_settings.og_title` |
| Descripción Open Graph | texto | `metadata.openGraph.description` | Sí | `site_settings.og_description` |
| Tipo Open Graph | texto | `metadata.openGraph.type` | Sí | `site_settings.og_type` |
| Nombre en navbar | texto | `Navbar1.tsx` | Sí | `site_settings.site_name` |
| Nombre corto en móvil | texto | `Navbar1.tsx` | Sí | `profile.display_name` |
| Nombre completo | texto | `HeroSection.tsx` | Sí | `profile.full_name` |
| Foto de perfil | imagen | `/fotoPerfil.png` | No | `profile.avatar_asset_id` → Storage `media/profile/` |
| Nombre del footer | texto | `ContactSection.tsx` | Sí | `site_settings.footer_name` |
| Sufijo del footer | texto | `ContactSection.tsx` | Sí | `site_settings.footer_suffix` |
| Etiqueta «Disponible» | texto | `Navbar1.tsx` | Sí | `site_settings.availability_label` |
| Enlace de disponibilidad | texto | `Navbar1.tsx` | Sí | `site_settings.availability_href` |
| Disponibilidad del footer | texto | `ContactSection.tsx` | Sí | `site_settings.footer_availability_label` |

## 2. Navegación

Origen: `Navbar1.tsx`.

| Campo | Tipo | Ejemplo actual | Obligatorio | Destino |
|---|---|---|---|---|
| Etiqueta | texto | `Inicio`, `Sobre mí` | Sí | `nav_items.label` |
| Etiqueta móvil | texto | `Contáctame` (solo CTA) | No | `nav_items.mobile_label` |
| Destino | texto | `#hero`, `#contact` | Sí | `nav_items.href` |
| Es CTA | booleano | `Disponible` | Sí | `nav_items.is_cta` |
| Orden | entero | 1..6 | Sí | `nav_items.sort_order` |

Regla de negocio: como máximo un elemento con `is_cta = true` (índice único
parcial `nav_items_single_cta_idx`).

## 3. Hero

Origen: `HeroSection.tsx`.

| Campo | Tipo | Valor actual | Obligatorio | Destino |
|---|---|---|---|---|
| Etiqueta superior | texto | `Fullstack Developer` | Sí | `sections[key='hero'].label` |
| Título | texto | `Hola, soy Anyelo` | Sí | `sections.heading` |
| Fragmento resaltado | texto | `Anyelo` | No | `sections.heading_highlight` |
| Descripción | texto | «Desarrollo productos digitales…» | No | `sections.description` |
| CTA principal | texto + href | `Ver proyectos` → `#projects` | Sí | `section_ctas` (`primary`) |
| CTA secundario | texto + href | `Contactar` → `#contact` | Sí | `section_ctas` (`secondary`) |
| Etiquetas de tecnologías | texto[] | 9 etiquetas | No | `technologies` con `show_in_hero = true` |

El número decorativo «DEV» y los gradientes son presentación, no contenido
editable: permanecen en el componente.

## 4. Sobre mí

Origen: `AboutSection.tsx`.

| Campo | Tipo | Valor actual | Obligatorio | Destino |
|---|---|---|---|---|
| Etiqueta | texto | `Sobre mí` | Sí | `sections[key='about'].label` |
| Título | texto | `Código para resolver problemas reales` | Sí | `sections.heading` |
| Fragmento resaltado | texto | `para resolver` | No | `sections.heading_highlight` |
| Descripción | texto | «Me apasiona convertir ideas…» | No | `sections.description` |
| Métricas | valor + etiqueta | `2+`, `5+`, `9+`, `∞` | Sí | `profile_stats` |
| Experiencia | año, rol, empresa, descripción, color | 3 entradas | Sí | `experiences` |

`experiences.year_label` es texto para admitir `2024`, `2023-2024` o `Actualidad`.

## 5. Proyectos

Origen: `ProjectsSection.tsx`.

| Campo | Tipo | Valor actual | Obligatorio | Destino |
|---|---|---|---|---|
| Etiqueta | texto | `Proyectos` | Sí | `sections[key='projects'].label` |
| Título | texto | `Lo que he construido` | Sí | `sections.heading` |
| Fragmento resaltado | texto | `construido` | No | `sections.heading_highlight` |
| Cinta decorativa | texto[] | `PROYECTOS · PROJECTS · WORK · CASOS ·` | No | `sections.marquee_words` |
| CTA «Ver todos» | texto + href | `Ver todos` → `#contact` | Sí | `section_ctas` (`text`) |
| Proyecto | slug, título, categoría, descripción | 4 proyectos | Sí | `projects` |
| Color principal | `#RRGGBB` | `#0EA5E9` | Sí | `projects.accent_color` |
| Color secundario | `#RRGGBB` | `#0369A1` | Sí | `projects.accent_color_alt` |
| Tamaño de tarjeta | `large` / `small` | 2 grandes, 2 pequeñas | Sí | `projects.layout` |
| Tecnologías del proyecto | texto[] ordenado | 4 chips por proyecto | Sí | `project_technologies` + `technologies` |
| Número decorativo `01`..`04` | derivado | `id` del array | No | Se deriva de `sort_order`; no se almacena |
| Imagen de portada | imagen | No existe hoy | No | `projects.cover_asset_id` |

La numeración de las tarjetas se calcula en la vista a partir del orden; no es
contenido editorial.

## 6. Skills y herramientas

Origen: `SkillsSection.tsx`.

| Campo | Tipo | Valor actual | Obligatorio | Destino |
|---|---|---|---|---|
| Etiqueta | texto | `Stack` | Sí | `sections[key='skills'].label` |
| Título | texto | `Mis herramientas` | Sí | `sections.heading` |
| Fragmento resaltado | texto | `herramientas` | No | `sections.heading_highlight` |
| Categoría | etiqueta + color | `Frontend`, `Backend`, `DevOps & Tools` | Sí | `skill_categories` |
| Skill | etiqueta + porcentaje | `React / Next.js` 95 % | Sí | `skills` |
| Cita de filosofía | etiqueta + cuerpo + resaltado | «El código es poesía…» | No | `quotes` |
| Herramientas | texto[] | 9 herramientas | No | `technologies` con `show_in_tools = true` |

El porcentaje es contenido editorial (`0..100`), no una medición objetiva.

## 7. Contacto y footer

Origen: `ContactSection.tsx`.

| Campo | Tipo | Valor actual | Obligatorio | Destino |
|---|---|---|---|---|
| Etiqueta | texto | `Contacto` | Sí | `sections[key='contact'].label` |
| Título | texto | `¿Tienes un proyecto en mente?` | Sí | `sections.heading` |
| Fragmento resaltado | texto | `proyecto` | No | `sections.heading_highlight` |
| Descripción | texto | «Estoy abierto a nuevas oportunidades…» | No | `sections.description` |
| Botón WhatsApp | etiqueta + URL + icono | `Enviar mensaje` → `https://wa.me/584164214065` | Sí | `contact_links` (`button`, `whatsapp`) |
| Botón CV | etiqueta + PDF | `Descargar CV` | Sí | `contact_links` (`button`, `asset_id`) + `media_assets` |
| Redes | etiqueta + URL + icono | GitHub, LinkedIn, Email | Sí | `contact_links` (`icon`) |
| Mensaje entrante | nombre, email, asunto, mensaje, página | Formulario | — | `contact_messages` (solo RPC) |

El CV es público por decisión del responsable del repositorio: ya se ofrece como
descarga abierta en el sitio. Se almacena en el bucket público `documents` bajo
`resume/`. Ver justificación y riesgos en `SCHEMA.md`.

## 8. Activos binarios

| Activo | Origen | Bucket | Ruta | MIME | Tamaño |
|---|---|---|---|---|---|
| Foto de perfil | `public/fotoPerfil.png` | `media` | `profile/foto-perfil.png` | `image/png` | 1 491 634 B |
| Currículum | `public/CurrículumAnyeloFullStackDev.pdf` | `documents` | `resume/curriculum-anyelo-fullstack-dev.pdf` | `application/pdf` | 403 922 B |

Los binarios no se versionan en las migraciones ni en el seed. Se suben con la
Storage API o el dashboard; ver `OPERATIONS.md`.

## 9. Textos que se conservan tal cual

El seed reproduce el contenido actual, incluidas sus inconsistencias, para que
la primera versión del CMS no cambie el sitio visible:

- «ExpressJs» (etiqueta del hero) y «Express» (chip de proyecto) son dos
  tecnologías distintas porque así aparecen hoy.
- «…para los mas exigentes.» conserva la ausencia de tilde.
- El correo `anyelo@1112010@gmail.com` y el teléfono `+58 416 421 4065`
  (`wa.me/584164214065`) son los datos publicados actualmente.

Corregirlos es una decisión editorial posterior, no un cambio de esquema.

## 10. Correspondencia resumida

| Bloque del sitio | Tablas |
|---|---|
| SEO, footer, disponibilidad | `site_settings` |
| Identidad y foto | `profile`, `media_assets` |
| Encabezados de sección | `sections` |
| Navegación | `nav_items` |
| Botones internos | `section_ctas` |
| Redes y CV | `contact_links`, `media_assets` |
| Proyectos y chips | `projects`, `technologies`, `project_technologies` |
| Skills | `skill_categories`, `skills` |
| Métricas y trayectoria | `profile_stats`, `experiences` |
| Cita | `quotes` |
| Formulario | `contact_messages` |
| Cambios administrativos | `audit_log` |
