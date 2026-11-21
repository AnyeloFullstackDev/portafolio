# Manual de Despliegue Local con Base de Datos

Este manual detalla paso a paso cómo iniciar y conectar el entorno local del portafolio, incluyendo **Supabase Local (PostgreSQL, Auth, Storage, RLS)**, el **sitio público (`apps/web`)** y el **panel administrativo (`apps/admin`)**.

---

## 1. Requisitos Previos

1. **Docker Desktop**:
   - Debe estar en ejecución.
   - En Windows con WSL2, confirma que la integración esté habilitada para tu distribución en:
     *Docker Desktop → Settings → Resources → WSL Integration → Habilitar Ubuntu*.
   - Verifica en tu terminal:
     ```bash
     docker info
     ```
2. **Node.js y pnpm**:
   - Node.js 20+ (recomendado Node 22+).
   - pnpm (`pnpm -v`).

> [!NOTE]
> No uses el comando `supabase` directo si en tu PATH se encuentra el ejecutable de Windows. En este proyecto se utiliza siempre `pnpm dlx supabase@3.1.0 <comando>` para garantizar reproducibilidad en Linux/WSL.

---

## 2. Levantar la Base de Datos Local (Supabase)

Desde la raíz del repositorio ejecuta:

```bash
pnpm dlx supabase@3.1.0 start
```

Este comando descargará los contenedores de Supabase, aplicará automáticamente las migraciones de `supabase/migrations/` y cargará los datos iniciales de `supabase/seed.sql`.

### Comprobar el estado y obtener credenciales

```bash
pnpm dlx supabase@3.1.0 status
```

Verás una salida similar a esta:

```text
API URL: http://127.0.0.1:54321
GraphQL URL: http://127.0.0.1:54321/graphql/v1
DB URL: postgresql://postgres:postgres@127.0.0.1:54322/postgres
Studio URL: http://127.0.0.1:54323
Inbucket URL: http://127.0.0.1:54324
anon key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
service_role key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Puertos de los servicios locales

| Servicio | URL | Descripción |
|---|---|---|
| **API / REST** | `http://127.0.0.1:54321` | Endpoint de Supabase para las apps |
| **PostgreSQL** | `127.0.0.1:54322` | Conexión directa a base de datos |
| **Studio** | `http://127.0.0.1:54323` | Interfaz gráfica web de Supabase |
| **Inbucket (Emails)** | `http://127.0.0.1:54324` | Capturador de correos de confirmación |

---

## 3. Configurar Variables de Entorno

Copia la clave `anon key` que devolvió el comando `status` anterior.

### A. Para el sitio público (`apps/web/.env.local`)
Crea el archivo `apps/web/.env.local`:
```env
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=TU_ANON_KEY_AQUI
```

### B. Para el panel administrativo (`apps/admin/.env.local`)
Crea el archivo `apps/admin/.env.local`:
```env
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=TU_ANON_KEY_AQUI
```

---

## 4. Crear el Usuario Administrador

El panel administrativo exige estrictamente que el usuario tenga el rol de administrador en sus metadatos del servidor (`app_metadata.role = "admin"`).

Tienes dos métodos para crearlo:

### Opción A: Mediante cURL (Rápido)
Sustituye `$SERVICE_ROLE_KEY` por la clave `service_role key` de `supabase status`:

```bash
curl -s -X POST "http://127.0.0.1:54321/auth/v1/admin/users" \
  -H "apikey: TU_SERVICE_ROLE_KEY" \
  -H "Authorization: Bearer TU_SERVICE_ROLE_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@portafolio.local",
    "password": "Password123!",
    "email_confirm": true,
    "app_metadata": { "role": "admin" }
  }'
```

### Opción B: Desde Supabase Studio
1. Entra a `http://localhost:54323` en tu navegador.
2. Ve a la sección **Authentication** → **Users** → **Add User** → **Create User**.
3. Ingresa:
   - Email: `admin@portafolio.local`
   - Password: `Password123!`
   - Activa **Auto Confirm User?**
4. Abre la consola SQL en Studio y asigna el claim de administrador:
   ```sql
   UPDATE auth.users
   SET raw_app_meta_data = raw_app_meta_data || '{"role": "admin"}'::jsonb
   WHERE email = 'admin@portafolio.local';
   ```

---

## 5. Subir Archivos a Supabase Storage (Opcional)

Para cargar los archivos estáticos (foto de perfil y CV) en los buckets correspondientes de Supabase:

```bash
# Foto de perfil
pnpm dlx supabase@3.1.0 storage cp --experimental \
  apps/web/public/fotoPerfil.png \
  ss:///media/profile/foto-perfil.png

# Currículum en PDF
pnpm dlx supabase@3.1.0 storage cp --experimental \
  "apps/web/public/CurrículumAnyeloFullStackDev.pdf" \
  ss:///documents/resume/curriculum-anyelo-fullstack-dev.pdf
```

---

## 6. Arrancar las Aplicaciones

Instala las dependencias en la raíz:

```bash
pnpm install
```

### Iniciar el Sitio Público (Puerto 3000)
```bash
pnpm dev
```
Abre en tu navegador: [http://localhost:3000](http://localhost:3000)

### Iniciar el Panel Administrativo (Puerto 3001)
En una segunda terminal:
```bash
pnpm dev:admin
```
Abre en tu navegador: [http://localhost:3001](http://localhost:3001)

---

## 7. Comprobación del Sistema

1. **Sitio Público (`http://localhost:3000`)**:
   - Observa que las secciones Hero, Sobre Mí, Proyectos, Habilidades y Contacto se cargan desde PostgreSQL.
   - En la sección Contacto, envía un mensaje de prueba con el formulario directo.
2. **Panel Administrativo (`http://localhost:3001`)**:
   - Ingresa con `admin@portafolio.local` y la contraseña elegida.
   - Entra a **Mensajes** (`/panel/mensajes`) y verifica la llegada del mensaje que enviaste.
   - Modifica un proyecto en `/panel/proyectos` y refresca el sitio público para validar la actualización instantánea.

---

## 8. Comandos Útiles de Mantenimiento

- **Reiniciar la base y re-aplicar migraciones + seed**:
  ```bash
  pnpm dlx supabase@3.1.0 db reset --yes
  ```
- **Detener los servicios de Supabase**:
  ```bash
  pnpm dlx supabase@3.1.0 stop
  ```
- **Verificar tipos y linters en todo el monorepo**:
  ```bash
  pnpm -r typecheck
  pnpm -r lint
  ```

