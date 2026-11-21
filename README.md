# Portafolio Headless CMS & Multi-Agente (Next.js 16 + Supabase)

Este proyecto es la evolución de un portafolio estático hacia una **plataforma CMS dinámica desacoplada**, respaldada por **Supabase (PostgreSQL + RLS + Auth + Storage)** y orquestada por un **equipo de agentes inteligentes para OpenCode**.

---

## 🎯 Visión y Arquitectura del Sistema

El sistema opera bajo un esquema de **dos aplicaciones independientes** que comparten la misma capa de datos:

1. **Sitio Público (`apps/web` - Puerto 3000):**
   - Aplicación Next.js 16 de alto rendimiento, optimizada para SEO y tiempos de carga instantáneos.
   - Acceso a base de datos de **sólo lectura** mediante credenciales anónimas (`anon_key`) de Supabase gobernadas por Row Level Security (RLS).
   - Renderiza secciones de Hero, Sobre Mí, Proyectos, Habilidades y Contacto alimentadas dinámicamente.

2. **Panel Administrativo (`apps/admin` - Puerto 3001):**
   - Aplicación Next.js 16 aislada para la gestión total del contenido sin necesidad de editar código ni desplegar nuevamente.
   - Autenticación segura mediante **Supabase Auth** (`@supabase/ssr`) con cookies seguras (`HttpOnly`, `SameSite=Strict`, `Secure`).
   - Permite crear, modificar, reordenar y ocultar secciones, proyectos, tecnologías, enlaces sociales y descargar/revisar mensajes de contacto.
   - Gestión de medios (imágenes de proyectos, foto de perfil, CV en PDF) con **Supabase Storage**.

3. **Capa de Base de Datos y Storage (`packages/db` / Supabase):**
   - Motor relacional **PostgreSQL** hospedado en Supabase.
   - Seguridad a nivel de filas (**RLS**) estricta: usuarios no autenticados solo leen registros publicados (`status = 'published'` y `is_visible = true`).
   - Buckets de Supabase Storage para almacenamiento de archivos estáticos y documentos.

---
   
## 🤖 Agentes Especializados de OpenCode (`.opencode/agents/`)

El proyecto cuenta con cuatro agentes diseñados para colaborar en su desarrollo y mantenimiento:

| Agente | Archivo | Responsabilidad Principal |
| :--- | :--- | :--- |
| **`@cms-architect`** | [`.opencode/agents/cms-architect.md`](.opencode/agents/cms-architect.md) | Arquitectura del monorepo, desarrollo de características en Next.js 16 (App Router), server actions y panel admin en puerto 3001. |
| **`@postgres-dba`** | [`.opencode/agents/postgres-dba.md`](.opencode/agents/postgres-dba.md) | Diseño del modelo relacional, políticas RLS en Supabase, migraciones, buckets de Storage y queries tipadas. |
| **`@security-pentester`** | [`.opencode/agents/security-pentester.md`](.opencode/agents/security-pentester.md) | Simulación de ataques (OWASP Top 10), auditoría de RLS con `anon_key`, verificación de fugas de `service_role` y aplicación de correcciones con PoC. |
| **`@test-runner`** | [`.opencode/agents/test-runner.md`](.opencode/agents/test-runner.md) | Configuración de tests con Vitest, pruebas de server actions, validaciones Zod y verificación de que toda la suite esté en verde. |

---

## 🛠️ Stack Tecnológico

- **Framework:** Next.js 16.2.4 (App Router, Server Components y Server Actions).
- **Frontend Core:** React 19.2.4 & React DOM 19.2.4.
- **Base de Datos & Auth:** Supabase (PostgreSQL 15+, Row Level Security, Supabase Auth y Storage).
- **Tipado:** TypeScript 5 (configuración estricta).
- **Estilos:** Tailwind CSS v4 con `@theme` tokens personalizados en CSS nativo.
- **Herramientas de Paquetes & Calidad:** pnpm (preparado para monorepo con `pnpm-workspace.yaml`), ESLint 9.

---

## 🚀 Inicio Rápido (Desarrollo Local)

### 1. Requisitos
- Node.js >= 20.x
- pnpm >= 9.x
- [Supabase CLI](https://supabase.com/docs/guides/local-development/cli) (opcional para entorno 100% local con Docker) o un proyecto creado en [supabase.com](https://supabase.com).

### 2. Instalación de dependencias
```bash
pnpm install
```

### 3. Configuración de Variables de Entorno
Crea tu archivo `.env.local` con las credenciales de Supabase:
```env
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu-anon-key
# Solo para apps/admin del lado del servidor:
SUPABASE_SERVICE_ROLE_KEY=tu-service-role-key
```

### 4. Servidores de Desarrollo
```bash
# Sitio público (puerto 3000)
pnpm dev

# Panel administrativo (puerto 3001)
pnpm dev:admin
```
