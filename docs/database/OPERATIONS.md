# Operaciones de base de datos y Storage

Comandos reproducibles para el entorno local, generación de tipos y tareas
administrativas. Todo lo descrito aquí se ejecutó contra **Supabase Local** el
2026-11-11 salvo lo marcado explícitamente como remoto.

## 1. Requisitos

- Docker operativo en la distro WSL.
- Node.js y pnpm (el repositorio usa pnpm).
- CLI de Supabase para Linux. El shim de Windows del PATH
  (`/mnt/c/Users/.../npm/supabase`) falla con
  `No matching Supabase CLI binary package found for linux-x64`; no lo uses.
  En este repositorio se invocó con:

  ```bash
  pnpm dlx supabase@3.1.0 <comando>
  ```

  Si se prefiere instalarlo como dependencia de desarrollo, debe hacerse en
  `packages/db` y coordinarse porque modifica archivos compartidos.

## 2. Arranque y parada

```bash
pnpm dlx supabase@3.1.0 start
pnpm dlx supabase@3.1.0 status
pnpm dlx supabase@3.1.0 status -o env
pnpm dlx supabase@3.1.0 stop
```

`start` aplica las migraciones pendientes y ejecuta el seed si la base se creó
desde cero. En la primera ejecución real de este repositorio la salida incluyó:

```text
Applying migration 20261111120000_cms_schema.sql...
Applying migration 20261111120100_rls_and_grants.sql...
Applying migration 20261111120200_contact_intake.sql...
Applying migration 20261111120300_storage_buckets.sql...
Applying migration 20261111120400_cms_functions.sql...
Seeding data from supabase/seed.sql...
```

Servicios locales:

| Servicio | URL |
|---|---|
| API / REST | `http://127.0.0.1:54321` |
| PostgreSQL directo | `127.0.0.1:54322` |
| Studio | `http://127.0.0.1:54323` |
| Mailpit | `http://127.0.0.1:54324` |

## 3. Reset reproducible

```bash
pnpm dlx supabase@3.1.0 db reset --yes
```

`db reset` **borra la base local** y vuelve a aplicar todas las migraciones y el
seed. Es seguro únicamente en local. No lo ejecutes contra un proyecto remoto ni
sin confirmar que la URL apunta a `127.0.0.1`.

Salida real resumida:

```text
Target: local stack (127.0.0.1:54322)
Recreating database...
Applying migration 20261111120000_cms_schema.sql...
Applying migration 20261111120100_rls_and_grants.sql...
Applying migration 20261111120200_contact_intake.sql...
Applying migration 20261111120300_storage_buckets.sql...
Applying migration 20261111120400_cms_functions.sql...
Seeding data from supabase/seed.sql...
Finished supabase db reset on branch release-V1.1.
```

## 4. Seed idempotente

`supabase/seed.sql` usa claves naturales y `ON CONFLICT ... DO UPDATE`. No borra
filas. Se ejecutó dos veces seguidas contra Supabase Local sin cambiar los
conteos:

```bash
psql "postgresql://postgres:postgres@127.0.0.1:54322/postgres" \
  -v ON_ERROR_STOP=1 -f supabase/seed.sql
```

Resultado antes y después de dos ejecuciones:

```text
projects=4
technologies=25
project_technologies=16
sections=5
skills=8
```

El seed es una línea base de desarrollo. No debe ejecutarse contra producción:
sobrescribe el contenido editorial con los textos actuales.

## 5. Verificación de RLS, GRANT, Auth y Storage

El script cambia de rol y desactiva temporalmente un trigger de
`storage.objects`, por lo que requiere un superusuario. En Supabase Local el rol
`postgres` **no** es superusuario; usa `supabase_admin`:

```bash
PGPASSWORD=postgres psql \
  "postgresql://supabase_admin:postgres@127.0.0.1:54322/postgres" \
  -v ON_ERROR_STOP=1 \
  -f supabase/tests/rls_verification.sql
```

Resultado real: **50 aserciones OK** y el mensaje final:

```text
==============================================================
 TODAS LAS VERIFICACIONES RLS/GRANT/STORAGE PASARON
==============================================================
```

Evidencia destacada:

```text
OK: anon ve proyectos publicados = 4
OK: anon no ve borradores ni ocultos = 0
OK: anon SELECT en contact_messages bloqueado con SQLSTATE 42501
OK: anon INSERT directo en contact_messages bloqueado con SQLSTATE 42501
OK: admin INSERT en projects afectó 1 fila(s)
OK: admin lee contact_messages = 4 (>= 1)
OK: admin sin aal2 NO puede borrar afectó 0 fila(s)
OK: admin con aal2 borra projects afectó 1 fila(s)
OK: anon no ejecuta replace_project_technologies bloqueado con SQLSTATE 42501
OK: usuario no-admin no ejecuta replace_project_technologies bloqueado con SQLSTATE 42501
OK: replace_project_technologies deja exactamente 2 tecnologías = 2
OK: replace_project_technologies rechaza una tecnología inexistente bloqueado con SQLSTATE 23503
OK: anon lee objetos de buckets públicos = 1
OK: anon no puede subir objetos bloqueado con SQLSTATE 42501
```

La transacción termina en `ROLLBACK`: no deja fixtures ni cambios.

### 5.1 Por qué se desactiva un trigger de Storage

Supabase instala `storage.protect_objects_delete`, que impide `DELETE` directo
sobre `storage.objects`:

```text
ERROR: Direct deletion from storage tables is not allowed. Use the Storage API instead.
```

Para verificar la política RLS de `DELETE` sin saltarse la seguridad de la API,
el script ejecuta dentro de su transacción:

```sql
ALTER TABLE storage.objects DISABLE TRIGGER protect_objects_delete;
```

La transacción hace `ROLLBACK`, por lo que el trigger queda activo al terminar.
En producción, borrar objetos se hace con la Storage API.

## 6. Pruebas de integración del paquete tipado

Se ejecutaron scripts ad-hoc con `tsx` contra Supabase Local usando
`@portfolio/db`:

```bash
PATH="$HOME/.nvm/versions/node/v24.14.0/bin:$PATH" \
  pnpm dlx tsx /tmp/opencode/verify-db-integration.mts

PATH="$HOME/.nvm/versions/node/v24.14.0/bin:$PATH" \
  pnpm dlx tsx /tmp/opencode/verify-mfa.mts
```

Cubren:

- `getPublishedHomeContent`: 4 proyectos, 5 secciones, 6 ítems de navegación,
  3 CTAs, 5 enlaces, 9 tecnologías del hero, 9 herramientas, 3 categorías,
  4 métricas, 3 experiencias y 1 cita.
- Resolución de la URL pública del CV en `contact_links`.
- `anon` no lee ni inserta directamente en `contact_messages`.
- `submitContactMessage` crea un mensaje vía RPC.
- Un administrador real creado con `app_metadata.role = 'admin'` crea un
  borrador, no es visible para `anon`, lo publica y pasa a ser visible.
- `replaceProjectTechnologies` deja exactamente las tecnologías indicadas.
- `deleteProject` con `aal1` devuelve `false`.
- Enrolamiento TOTP real, elevación a `aal2` y `deleteProject` devuelve `true`.
- `audit_log` registra `INSERT` y `UPDATE` del proyecto.
- Limpieza de fixtures con `service_role` (solo pruebas).

Los scripts viven en `/tmp` y no se versionan. `test-runner` debe portarlos a
`tests/` con fixtures propios; requieren Node 22+ por el WebSocket nativo de
`@supabase/supabase-js` (con Node 20 falla al crear el cliente).

## 7. Generación de tipos

El esquema es la fuente de verdad. Tras aplicar una migración:

```bash
pnpm dlx supabase@3.1.0 gen types typescript --local --schema public \
  > /tmp/database.types.ts
pnpm dlx oxfmt@latest /tmp/database.types.ts
cp /tmp/database.types.ts packages/db/src/database.types.ts
pnpm --filter @portfolio/db typecheck
```

El generador v3 emite TypeScript sin formato (relaciones y objetos en una sola
línea); `oxfmt` es necesario para que el archivo sea revisable. El resultado
incluye `submit_contact_message` y `replace_project_technologies` en
`Database['public']['Functions']`.

## 8. Subida de binarios a Storage

La CLI de Storage requiere `--experimental` en la versión 3.1.0:

```bash
pnpm dlx supabase@3.1.0 storage cp --experimental \
  apps/web/public/fotoPerfil.png \
  ss:///media/profile/foto-perfil.png

pnpm dlx supabase@3.1.0 storage cp --experimental \
  "apps/web/public/CurrículumAnyeloFullStackDev.pdf" \
  ss:///documents/resume/curriculum-anyelo-fullstack-dev.pdf
```

Verificación real con la URL pública:

```bash
curl -s -o /dev/null -w "%{http_code} %{content_type} %{size_download}\n" \
  http://127.0.0.1:54321/storage/v1/object/public/media/profile/foto-perfil.png
# 200 image/png 1491634

curl -s -o /dev/null -w "%{http_code} %{content_type} %{size_download}\n" \
  http://127.0.0.1:54321/storage/v1/object/public/documents/resume/curriculum-anyelo-fullstack-dev.pdf
# 200 application/pdf 403922
```

Reglas:

- `media`: máximo 5 MiB; PNG, JPEG, WebP o AVIF; rutas `profile/…` o
  `projects/…`.
- `documents`: máximo 10 MiB; solo PDF; rutas `resume/…`.
- No subas SVG ni HTML.
- La subida requiere sesión administrativa (`app_metadata.role = 'admin'`).
- El reemplazo de un archivo debe conservar la misma ruta para no romper
  `media_assets.object_path`; si cambia la ruta, actualiza el metadato.
- Borrar un objeto requiere `aal2`.
- Borrar un `media_assets` no borra el objeto: la limpieza de huérfanos es una
  tarea separada con la Storage API.

## 9. Alta de administradores

El claim administrativo se asigna solo desde un backend confiable. Ejemplo con
la Admin API (nunca desde el navegador ni con `user_metadata`):

```bash
curl -s -X POST "http://127.0.0.1:54321/auth/v1/admin/users" \
  -H "apikey: $SERVICE_ROLE_KEY" \
  -H "Authorization: Bearer $SERVICE_ROLE_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "una-contraseña-larga-y-única",
    "email_confirm": true,
    "app_metadata": { "role": "admin" }
  }'
```

Comprobación del claim:

```sql
SELECT id, email, raw_app_meta_data
FROM auth.users
WHERE email = 'admin@example.com';
```

`raw_app_meta_data` debe contener `{"role":"admin"}`. No uses
`raw_user_meta_data` para autorizar.

### 9.1 MFA

`supabase/config.toml` habilita TOTP en local:

```toml
[auth.mfa.totp]
enroll_enabled = true
verify_enabled = true
```

Flujo esperado en `apps/admin`:

1. Iniciar sesión (aal1).
2. Enrolar un factor TOTP con `supabase.auth.mfa.enroll`.
3. Resolver el desafío con `challenge` + `verify`.
4. A partir de ahí, el JWT tiene `aal: "aal2"` y las operaciones de borrado
   pasan RLS.

En el proyecto hospedado, habilita TOTP y exige enrolamiento a los
administradores. Sin `aal2`, los botones de borrado deben mostrarse
deshabilitados o explicar que se requiere verificación en dos pasos.

## 10. Variables de entorno

`apps/web`:

```bash
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon key de `supabase status -o env`>
```

`apps/admin` (SSR):

```bash
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon key>
```

`SUPABASE_SERVICE_ROLE_KEY` solo debe existir en el servidor y para tareas
administrativas concretas. No debe llevar el prefijo `NEXT_PUBLIC_` ni
importarse en componentes cliente.

## 11. Problemas conocidos

| Síntoma | Causa | Acción |
|---|---|---|
| `No matching Supabase CLI binary package found for linux-x64` | Se invocó el shim de Windows | Usa `pnpm dlx supabase@3.1.0` |
| `DockerLifecycleInspectError` | Docker no estaba operativo | Inicia Docker y reintenta |
| `must be owner of table objects` | `postgres` no es owner de `storage.objects` | Ejecuta el test RLS como `supabase_admin` |
| `Direct deletion from storage tables is not allowed` | Trigger de protección de Supabase | Usa la Storage API; en el test se desactiva dentro de la transacción |
| `Node.js detected but native WebSocket not found` | Node 20 con `@supabase/supabase-js` 2.119 | Usa Node 22+ para los scripts de integración |
| `supabase storage ...` pide flag | Comando experimental en CLI 3.1.0 | Añade `--experimental` |

## 12. Pendientes de coordinación

- `cms-architect`: añadir `@portfolio/db` a `apps/web` y `apps/admin`, configurar
  `transpilePackages`, variables de entorno, caché e invalidación.
- `test-runner`: portar los scripts de integración y MFA a `tests/`, con
  fixtures y limpieza propios.
- Responsable del repositorio: crear el proyecto Supabase remoto, definir región
  y ejecutar `supabase link` + `supabase db push` cuando corresponda. Este
  agente no ha tocado ningún entorno remoto.
