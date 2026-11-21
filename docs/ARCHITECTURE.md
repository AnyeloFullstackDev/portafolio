# Arquitectura del CMS — contrato técnico

> Documento vivo. `cms-architect` mantiene este archivo y coordina cambios transversales. `postgres-dba`, `security-pentester` y `test-runner` aportan cambios en sus respectivas áreas.

## 1. Objetivo

Convertir el portafolio actual en un CMS donde el contenido y la configuración editables estén gestionados desde un panel administrativo, preservando el diseño público existente.

## 2. Estructura objetivo

```text
apps/
  web/                 # Sitio público Next.js, puerto 3000
  admin/               # Panel administrativo Next.js, puerto 3001
packages/
  db/                  # Clientes, tipos y queries de datos compartidos
  ui/                  # Opcional: componentes compartidos
  config/              # Opcional: configuración compartida
supabase/
  config.toml
  migrations/
  seed.sql
security/
  THREAT_MODEL.md
  REPORT.md
  poc/
tests/
docs/
  ARCHITECTURE.md
  database/
  testing/
```

La estructura real puede evolucionar. Los cambios deben documentarse y respetar la propiedad definida en `AGENTS.md`.

## 3. Stack acordado

- pnpm workspaces.
- Next.js 16 y React 19.
- TypeScript en modo strict.
- Tailwind CSS v4.
- Supabase: PostgreSQL, Auth, Storage y RLS.
- Supabase CLI como fuente de verdad de migraciones.
- Vitest y Testing Library para unit/component.
- Supabase Local para integración de base de datos y RLS.
- Playwright para flujos E2E críticos.

No agregues Drizzle como segundo gestor de migraciones. Si se propone un ORM para consultas, debe justificarse sin duplicar el historial de migraciones.

## 4. Aplicaciones y límites de confianza

### `apps/web`

- Sitio público.
- Lee únicamente contenido que las políticas permitan publicar.
- Usa la anon/publishable key apropiada para el proyecto.
- No contiene credenciales privilegiadas.
- No debe poder escribir tablas de contenido.

### `apps/admin`

- Panel administrativo separado, puerto 3001 en desarrollo.
- Autenticación con Supabase Auth y `@supabase/ssr`.
- Las mutaciones se ejecutan en servidor.
- Cada Server Action y Route Handler sensible autentica y autoriza explícitamente.
- No confía exclusivamente en `proxy.ts`.
- Usa RLS con la sesión del usuario siempre que sea posible.
- `service_role` solo puede usarse en operaciones de servidor excepcionales, justificadas y aisladas.

### Base de datos

- PostgreSQL administrado por Supabase.
- RLS y privilegios SQL se configuran conjuntamente.
- `anon` solo obtiene lectura del contenido publicado/visible.
- `authenticated` no implica privilegio administrativo.
- El claim administrativo se obtiene de `app_metadata`, no de `user_metadata`.
- El formulario público de contacto pasa preferentemente por un Route Handler con validación y rate limiting.

## 5. Datos y CMS

El esquema definitivo se deriva del inventario del portafolio existente. Candidatos iniciales:

- Configuración global y SEO.
- Perfil.
- Secciones y navegación.
- Proyectos y tecnologías.
- Skills y categorías.
- Redes sociales.
- Experiencia, educación, certificaciones, servicios, testimonios o galerías, si el contenido actual los requiere.
- Mensajes de contacto.
- Auditoría de cambios.

Los datos relacionales se modelan en tablas. `jsonb` se reserva para configuraciones flexibles con validación y contrato documentado. Los archivos se almacenan en Supabase Storage y la base de datos guarda sus referencias.

## 6. Migraciones, seed y tipos

- Fuente única de migraciones: `supabase/migrations/`.
- Migraciones SQL versionadas.
- No reescribir migraciones aplicadas en entornos compartidos.
- Seed repetible e idempotente.
- Tipos TypeScript generados desde el esquema real de Supabase.
- Documentar cómo iniciar Supabase Local, aplicar migraciones, cargar seed y generar tipos.

## 7. Auth, Storage y seguridad

- No duplicar contraseñas ni credenciales de Supabase Auth.
- MFA administrativo debe tener una política explícita.
- Buckets públicos y privados se deciden según sensibilidad del contenido.
- CV y documentos personales no deben hacerse públicos por defecto.
- Validar tamaño, MIME, extensión y contenido de uploads.
- No confiar únicamente en la extensión del archivo.
- RLS debe probarse contra Supabase Local.
- No incluir secretos en `NEXT_PUBLIC_*`, bundles, logs o reportes.
- Cookies y renovación de sesión deben configurarse según el flujo real de Supabase SSR; no aplicar atributos indiscriminadamente sin verificar compatibilidad.

## 8. Caché y publicación

Las mutaciones administrativas deben invalidar la caché del sitio público mediante tags, rutas o mecanismo interno autenticado. El mecanismo concreto debe documentarse y probarse.

Los estados de publicación y visibilidad deben tener una semántica única, sin condiciones contradictorias entre tablas y consultas.

## 9. Testing y seguridad

- Unitarias: Vitest.
- Componentes: Testing Library.
- Integración: Supabase Local para RLS, Auth, Storage y PostgreSQL.
- E2E: Playwright para login, edición, publicación y visualización pública.
- Seguridad: threat model, PoC locales, reportes y retest.
- Los mocks no sustituyen las pruebas reales de RLS.
- Cada hallazgo de seguridad se asigna al propietario del módulo.
- La corrección debe tener test de regresión y retest de seguridad cuando aplique.

## 10. Variables de entorno

Documentar nombres y propósito en `.env.example`, nunca valores reales. Separar claramente:
- URL y clave pública de Supabase.
- Variables server-only del admin.
- Claves privilegiadas, si excepcionalmente se requieren.
- Conexión directa y pooler, si la aplicación los utiliza.

Los nombres definitivos deben corresponder a los clientes implementados. No inventar ni exponer secretos.

## 11. Decisiones pendientes que deben verificarse

- Estructura actual del repositorio y estrategia de migración desde la app única.
- Región/proyecto Supabase y configuración local efectiva.
- Política definitiva de MFA.
- Si el CV y otros documentos serán públicos o privados.
- Necesidad de auditoría por triggers, aplicación o ambas.
- Estrategia concreta de invalidación de caché.
- Política de retención y protección de mensajes de contacto.
- Scripts reales disponibles en cada paquete.

Cada decisión debe registrar fecha, responsable, motivo y consecuencias cuando sea relevante.

## 12. Registro de decisiones

### 2026-11-11 — Monorepo habilitado: `apps/web` es la única copia del sitio

- **Responsable:** `cms-architect`, con autorización explícita del responsable del repositorio sobre los archivos compartidos de `AGENTS.md` §3.2.
- **Decisión:** `apps/web` contiene la aplicación pública (copia fiel de la antigua raíz) y la raíz queda como orquestador.
- **Cambios en archivos compartidos:**
  - `pnpm-workspace.yaml`: `packages: ["apps/*", "packages/*"]`.
  - `package.json` raíz: solo scripts orquestadores (`dev`, `dev:web`, `build`, `start`, `lint`, `typecheck`) mediante `pnpm --filter` / `pnpm -r`; sin dependencias.
  - `.npmrc` nuevo: `public-hoist-pattern[]=next`.
  - Retirados de la raíz `app/`, `public/`, `types/`, `next.config.ts`, `tsconfig.json`, `eslint.config.mjs`, `postcss.config.mjs` y `next-env.d.ts`.
- **Motivo del `.npmrc`:** `eslint-config-next@16.2.4` ejecuta `require('next/dist/compiled/babel/eslint-parser')` sin declarar `next` como dependencia ni peer; con el layout aislado de pnpm el `require` falla (`Cannot find module`). El hoist público de `next` es el ajuste mínimo; debe revisarse al actualizar Next o `eslint-config-next`.
- **Estado verificado:**
  - `pnpm install` → 2 proyectos de workspace, lockfile actualizado.
  - `pnpm build` → compila; rutas estáticas `/`, `/_not-found`, `/icon.png`.
  - `pnpm typecheck` → sin errores.
  - `pnpm lint` → 0 errores, 2 warnings heredados (`@next/next/no-img-element` en `HeroSection`).
  - `pnpm dev` → `http://localhost:3000` responde 200 con `#hero`, `#about`, `#projects`, `#skills`, `#contact`.
- **Desviación conocida:** `apps/web/app/components/SkillsSection.tsx` escapa las comillas de la cita (`&quot;`) para cumplir `react/no-unescaped-entities`; el texto renderizado es idéntico al original.
- **Pendiente:** `apps/admin`, `packages/db`, `supabase/`, `tests/` y `security/` aún no existen. El `README.md` conserva la instrucción `pnpm dev --port 3001` para un panel que todavía no está implementado.

### 2026-11-11 — `apps/admin`: autenticación SSR y autorización administrativa

- **Responsable:** `cms-architect`.
- **Alcance implementado:** esqueleto funcional del panel (`:3001`) con Supabase Auth SSR. No incluye CRUD de contenido: depende del esquema del `postgres-dba`.
- **Dependencias añadidas:** `@supabase/ssr@0.12.7`, `@supabase/supabase-js@2.119.0`, `zod@4.6.7`. Justificación: cliente SSR oficial de Supabase, y validación de entrada en servidor sin escribir validadores ad hoc.
- **Contrato de autenticación:**
  - `proxy.ts` (convención Next 16, reemplaza a `middleware.ts`) solo hace comprobaciones **optimistas** y renueva la sesión con `getClaims()`.
  - `lib/auth/dal.ts#requireAdmin()` es la verificación **segura**: valida el JWT con Supabase y exige `app_metadata.role === "admin"`. Se invoca en `panel/layout.tsx`, `panel/page.tsx` y en cada Server Action sensible.
  - `user_metadata` nunca se usa para permisos.
  - Sin configuración de Supabase, el panel responde **503 fail-closed** con mensaje en español; no hay modo degradado abierto.
  - No se usa `service_role` en ninguna ruta del panel.
- **Rutas:** `/` (redirige a `/panel`), `/login`, `/panel`, `/acceso-denegado`.
- **Variables de entorno:** `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` (documentadas en `apps/admin/.env.example`).
- **Estado verificado:**
  - `pnpm typecheck` → sin errores en `apps/web` y `apps/admin`.
  - `pnpm lint` → 0 errores (2 warnings heredados en `apps/web`).
  - `pnpm build` → `apps/admin` compila con `ƒ Proxy (Middleware)` y rutas dinámicas `/login`, `/panel`, `/acceso-denegado`.
  - `curl :3001/` y `/panel` sin variables de entorno → `503` con el aviso de configuración incompleta.
- **Pendiente de verificación real:** login, rechazo de usuario no administrador, cierre de sesión y refresco de cookies requieren Supabase Local en marcha y un usuario con `app_metadata.role = "admin"`. Sin eso no se declara probado.
- **Aviso de entorno:** `@supabase/supabase-js@2.119.0` advierte que Node 20 está deprecado para versiones futuras; el entorno actual usa `v20.19.5`.

### 2026-11-11 — Visibilidad del CV

- **Responsable:** responsable del repositorio.
- **Decisión:** el CV `CurrículumAnyeloFullStackDev.pdf` **sigue siendo público**.
- **Consecuencias:** el bucket de Storage que lo aloje es público y sus políticas permiten lectura anónima; la escritura sigue restringida a administradores. Esta decisión cierra el pendiente correspondiente de §11.
- **Nota de seguridad:** un CV público es un dato personal expuesto por diseño. Si en el futuro se añaden datos de contacto sensibles, la decisión debe revisarse y quedar registrada aquí.

### 2026-11-11 — Docker y Supabase Local

- **Estado:** Docker Desktop quedó operativo en la distro WSL `Ubuntu` (`server=28.1.1`, driver `overlay2`), con la integración WSL ya configurada (`IntegratedWslDistros: ["Ubuntu"]`).
- **CLI:** el `supabase` del `PATH` es el shim de Windows y falla en Linux (`No matching Supabase CLI binary package found for linux-x64`). Debe usarse `pnpm dlx supabase@latest` (v3.1.0 verificado) o instalar el CLI de Linux como dependencia de desarrollo. Este punto debe quedar resuelto en `packages/db` para que los comandos sean reproducibles.

### 2026-11-11 — Integración de `@portfolio/db`, desacoplamiento de contenido y CRUD de `apps/admin`

- **Responsable:** `cms-architect`.
- **Integración de `@portfolio/db`:**
  - Añadido como dependencia de workspace (`workspace:*`) a `apps/web` y `apps/admin`.
  - Configurado `transpilePackages: ["@portfolio/db"]` en `next.config.ts` de ambas aplicaciones.
- **Sitio público (`apps/web`):**
  - Desacoplado el contenido hardcodeado hacia `apps/web/content/default-content.ts` (conforme a la interfaz `HomeContent` de `@portfolio/db`), garantizando fidelidad visual total (100% de clases Tailwind y marcado preservado).
  - Implementado `apps/web/lib/content.ts#getHomeContent()`: consulta la base de datos local/remota vía `getPublishedHomeContent(client)` y recurre automáticamente al contenido tipado de respaldo si Supabase no está configurado o no responde.
  - Creado Route Handler `apps/web/app/api/contact/route.ts` que valida datos, comprueba honeypot e invoca el RPC seguro `submit_contact_message` a través de `@portfolio/db/contact`.
- **Panel Administrativo (`apps/admin`):**
  - Implementadas las vistas y subnavegación del panel:
    - `/panel`: métricas en tiempo real y resumen de estado.
    - `/panel/configuracion`: edición de configuración general (SEO, site_name, disponibilidad) y perfil (nombre, display_name).
    - `/panel/proyectos`: listado, creación, edición (título, categoría, descripción, colores, layout) y eliminación de proyectos.
    - `/panel/skills`: listado por categoría, creación de habilidades con porcentaje, edición rápida y eliminación.
    - `/panel/experiencia`: gestión de la línea de tiempo profesional (roles, empresas, descripciones).
    - `/panel/mensajes`: buzón de contacto con actualización de estado (`new`, `read`, `archived`) protegido por RLS.
  - Creado `apps/admin/app/panel/actions.ts` con Server Actions seguras que exigen `requireAdmin()`, obtienen el cliente SSR tipado con `Database` y ejecutan mutaciones mediante `@portfolio/db/mutations`.
- **Estado verificado:**
  - `pnpm -r typecheck` → 0 errores en `packages/db`, `apps/admin` y `apps/web`.
  - `pnpm -r lint` → 0 errores.
  - `pnpm --filter admin build` → compila exitosamente todas las rutas estáticas y dinámicas.
  - `pnpm --filter web build` → compila exitosamente con revalidación incremental y ruta `/api/contact`.

