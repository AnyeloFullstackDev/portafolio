# AGENTS.md

## Reglas globales del repositorio

<!-- BEGIN:nextjs-agent-rules -->
**# This is NOT the Next.js you know**

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

Estas reglas aplican a todos los agentes que trabajen en este repositorio. Las instrucciones específicas de cada agente complementan este documento, pero no pueden contradecir sus reglas de propiedad, seguridad y colaboración.

## 1. Principios de trabajo

1. Inspecciona la estructura y el estado actual del repositorio antes de modificar archivos.
2. No asumas que la implementación, las dependencias o las convenciones siguen versiones anteriores de la documentación.
3. Consulta la documentación instalada y vigente antes de utilizar APIs o patrones de Next.js, React, Supabase u otras dependencias.
4. No reemplaces implementaciones existentes sin comprender su propósito y sus dependencias.
5. Evita cambios fuera del alcance de la tarea asignada.
6. No introduzcas dependencias nuevas sin justificar su necesidad.
7. No inventes resultados de pruebas, validaciones ni auditorías.
8. Si encuentras un problema fuera de tu responsabilidad, documenta el hallazgo y comunícalo al agente propietario.
9. No realices cambios destructivos, migraciones remotas ni operaciones sobre producción sin autorización explícita.
10. Prioriza soluciones simples, tipadas, mantenibles y coherentes con la arquitectura existente.

## 2. Estructura del proyecto

El repositorio utiliza pnpm y está organizado como monorepo.

- `apps/web/`: sitio público del portafolio.
- `apps/admin/`: panel administrativo del CMS.
- `packages/db/`: acceso tipado a Supabase y PostgreSQL.
- `supabase/`: configuración, migraciones SQL, seed y recursos de Supabase.
- `tests/`: pruebas compartidas, integración y end-to-end.
- `security/`: reportes, evidencias y documentación de auditoría.
- `docs/`: arquitectura y documentación técnica.

Antes de crear una carpeta o archivo, comprueba si ya existe una ubicación apropiada.

## 3. Propiedad de archivos

La propiedad define qué agente puede modificar directamente cada parte del repositorio.

| Agente | Propiedad principal |
|---|---|
| `cms-architect` | `apps/web/**`, `apps/admin/**`, `docs/ARCHITECTURE.md` |
| `postgres-dba` | `packages/db/**`, `supabase/**`, `docs/database/**` |
| `security-pentester` | `security/**` |
| `test-runner` | `tests/**`, configuración e infraestructura de testing |

### 3.1 Reglas de propiedad

1. Cada agente debe respetar su allowlist y denylist.
2. Ningún agente puede modificar archivos fuera de su alcance por iniciativa propia.
3. La propiedad de un archivo no se transfiere automáticamente por delegación.
4. Si una tarea requiere modificar archivos de otro propietario, se debe solicitar su intervención.
5. El agente propietario implementa las correcciones en sus archivos.
6. El agente que detecta un defecto debe aportar evidencia suficiente para reproducirlo.
7. Los cambios transversales requieren coordinación con el `cms-architect`.

### 3.2 Archivos compartidos y excepciones

Los siguientes archivos requieren coordinación explícita:

- `AGENTS.md`
- `package.json` de la raíz.
- `pnpm-workspace.yaml`
- Configuraciones globales de TypeScript y ESLint.
- Configuraciones de CI/CD.
- Archivos de configuración compartidos.

No se debe asumir que un agente puede editarlos por ser el orquestador.

Si un archivo no está asignado explícitamente, el agente debe solicitar autorización antes de modificarlo.

## 4. Colaboración y delegación

### 4.1 Arquitecto y orquestación

El `cms-architect` es el agente principal y coordina el trabajo.

Sus responsabilidades son:

- Descomponer las tareas en unidades independientes.
- Identificar qué agentes deben participar.
- Definir criterios de aceptación.
- Asignar responsables.
- Evitar modificaciones simultáneas sobre los mismos archivos.
- Integrar los resultados.
- Resolver conflictos de arquitectura.
- Verificar que el resultado final cumpla los requisitos.

El arquitecto no debe asumir la propiedad de los archivos del DBA, pentester o test-runner.

### 4.2 Protocolo de delegación

Toda tarea delegada debe incluir:

1. Objetivo.
2. Contexto técnico necesario.
3. Archivos o directorios que pueden modificarse.
4. Restricciones y dependencias.
5. Criterios de aceptación.
6. Validaciones que deben ejecutarse.
7. Evidencias que deben entregarse.

### 4.3 Entrega de resultados

Al terminar una tarea, el agente debe informar:

- Qué implementó.
- Qué archivos modificó.
- Qué decisiones técnicas tomó.
- Qué pruebas ejecutó.
- Resultado de las pruebas.
- Problemas pendientes.
- Riesgos o dependencias detectadas.

No se considera terminada una tarea únicamente porque se hayan modificado archivos.

### 4.4 Conflictos

Si dos agentes necesitan modificar el mismo archivo:

1. Se detienen las modificaciones concurrentes.
2. El arquitecto coordina el orden de trabajo.
3. El propietario del archivo conserva la responsabilidad de integrarlo.
4. Se ejecutan las pruebas afectadas después de integrar los cambios.

## 5. Contrato técnico

### 5.1 Stack tecnológico

- Next.js 16.
- React 19.
- TypeScript en modo estricto.
- Tailwind CSS 4.
- pnpm.
- Supabase PostgreSQL.
- Supabase Auth.
- Supabase Storage.
- ESLint 9.
- Vitest y Testing Library.
- Playwright.

Las versiones reales instaladas en los archivos de dependencias son la referencia del proyecto.

### 5.2 Aplicaciones

`apps/web`:

- Contiene el sitio público.
- Muestra contenido publicado y visible.
- No debe exponer operaciones administrativas.
- No debe contener secretos ni credenciales privilegiadas.

`apps/admin`:

- Contiene el panel de administración.
- Requiere autenticación.
- Debe validar permisos en el servidor.
- Permite administrar el contenido autorizado del CMS.

### 5.3 Base de datos

`packages/db` es la capa compartida de acceso a datos.

- Mantener tipos explícitos.
- Evitar consultas duplicadas.
- Centralizar las operaciones compartidas cuando corresponda.
- No introducir acceso privilegiado desde componentes cliente.
- Mantener separada la lógica de persistencia de la presentación.

### 5.4 Migraciones

Supabase CLI y las migraciones SQL de `supabase/migrations/` son la fuente de verdad del esquema.

- No introducir un segundo historial de migraciones con Drizzle.
- Toda modificación del esquema debe tener una migración versionada.
- Las migraciones deben ser reproducibles.
- No modificar manualmente una base de datos remota como sustituto de una migración.
- Regenerar los tipos cuando cambie el esquema.
- Verificar las migraciones contra Supabase Local.

### 5.5 Supabase

El proyecto utiliza:

- PostgreSQL.
- Row Level Security (RLS).
- Supabase Auth.
- Supabase Storage.

Las políticas RLS deben acompañarse de los permisos SQL correspondientes. La existencia de RLS no sustituye la revisión de GRANT, USING y WITH CHECK.

La clave `SUPABASE_SERVICE_ROLE_KEY`:

- Es exclusivamente server-side.
- Nunca debe exponerse al navegador.
- No debe incluirse en variables `NEXT_PUBLIC_*`.
- Debe utilizarse únicamente cuando exista una necesidad privilegiada justificada.

La clave pública de Supabase tampoco sustituye las políticas de autorización.

### 5.6 Autenticación y autorización

- La autenticación identifica al usuario.
- La autorización determina qué puede hacer.
- Un usuario autenticado no es automáticamente administrador.
- Los privilegios administrativos deben validarse en el servidor.
- Los roles confiables deben provenir de claims controlados por el servidor, como `app_metadata`, no de `user_metadata` modificable por el usuario.
- Cada Server Action y Route Handler sensible debe verificar permisos.
- `proxy.ts` no debe considerarse la única barrera de autorización.
- Las operaciones de escritura deben validar datos en el servidor.

### 5.7 Next.js

- Preferir Server Components cuando no se necesite interactividad en cliente.
- Utilizar Client Components solo cuando sean necesarios.
- Mantener secretos y operaciones privilegiadas en el servidor.
- Validar entradas en Server Actions y Route Handlers.
- No confiar en validaciones realizadas exclusivamente en el navegador.
- Seguir las convenciones vigentes de Next.js 16.
- Consultar la documentación instalada antes de implementar APIs o patrones.

## 6. Seguridad

La seguridad es una responsabilidad transversal.

### 6.1 Reglas generales

1. No exponer secretos, tokens ni credenciales.
2. No registrar contraseñas ni tokens en logs.
3. Validar todas las entradas externas.
4. Aplicar autorización en el servidor.
5. Evitar SQL inseguro y consultas construidas mediante concatenación.
6. Controlar los tipos, tamaños y formatos de los archivos cargados.
7. Evitar redirecciones abiertas.
8. Aplicar límites de frecuencia a operaciones expuestas públicamente cuando corresponda.
9. No confiar en valores enviados desde el cliente para determinar permisos.
10. No desactivar controles de seguridad para hacer pasar una prueba.

### 6.2 RLS

Toda tabla que contenga datos protegidos debe tener una estrategia de acceso definida.

Las políticas deben contemplar:

- Usuarios anónimos.
- Usuarios autenticados.
- Administradores.
- Lectura.
- Inserción.
- Actualización.
- Eliminación.

Las operaciones de actualización e inserción deben revisar tanto las condiciones de acceso como los valores nuevos mediante `USING` y `WITH CHECK`, según corresponda.

### 6.3 Storage

Las políticas de Storage deben contemplar:

- Quién puede cargar archivos.
- Quién puede consultar archivos.
- Quién puede reemplazarlos.
- Quién puede eliminarlos.
- Tamaño máximo.
- Tipos MIME permitidos.
- Acceso público o privado.

Los documentos sensibles, como un CV privado, no deben publicarse automáticamente.

### 6.4 Auditoría de seguridad

El `security-pentester` debe actuar como auditor independiente.

- No debe modificar unilateralmente el código de producción para corregir los hallazgos.
- Debe registrar evidencia reproducible.
- Debe distinguir vulnerabilidades confirmadas de recomendaciones.
- Debe identificar impacto, condiciones de explotación y responsable de remediación.
- Debe realizar retest después de la corrección.

Las pruebas destructivas, escaneos agresivos y herramientas de explotación requieren autorización explícita.

Nunca ejecutar pruebas contra producción sin autorización.

### 6.5 Entorno de pruebas

Antes de ejecutar pruebas de seguridad contra una base de datos:

1. Confirmar que se trata de Supabase Local.
2. Verificar la URL y las variables de entorno.
3. Confirmar que no existe conexión a una base de datos remota.
4. Detener la prueba si no se puede demostrar que el entorno es local.

## 7. Calidad y testing

### 7.1 Tipado

- Mantener TypeScript strict.
- Evitar `any`.
- No utilizar aserciones de tipos para ocultar errores.
- Validar datos externos en tiempo de ejecución.
- Mantener los tipos de Supabase sincronizados con el esquema.

### 7.2 Pruebas unitarias y de componentes

Utilizar Vitest y Testing Library.

Probar:

- Funciones de negocio.
- Validaciones.
- Componentes interactivos.
- Estados de error.
- Estados de carga.
- Casos límite.

Los mocks pueden utilizarse para dependencias externas, pero no deben sustituir la prueba de la unidad que se está evaluando.

### 7.3 Integración

Las pruebas de integración que involucren PostgreSQL, Auth, RLS o Storage deben ejecutarse contra Supabase Local cuando corresponda.

Los mocks no son evidencia suficiente para afirmar que una política RLS funciona correctamente.

### 7.4 End-to-end

Playwright debe cubrir como mínimo los flujos críticos:

- Acceso al panel administrativo.
- Rechazo de usuarios no autorizados.
- Creación o edición de contenido.
- Publicación de contenido.
- Verificación del contenido publicado en el sitio público.
- Restricciones de acceso a contenido no publicado.

### 7.5 Cobertura

La cobertura debe medirse y reportarse por:

- Líneas.
- Funciones.
- Ramas.
- Sentencias.

El objetivo inicial es alcanzar al menos un 80% en el código relevante, sin convertir el porcentaje en sustituto de la calidad de las pruebas.

No se deben excluir archivos ni reducir umbrales únicamente para hacer pasar el pipeline.

### 7.6 Ejecución de pruebas

Antes de ejecutar comandos globales:

- Revisar los scripts disponibles.
- Verificar las dependencias necesarias.
- Comprobar las variables de entorno.
- Confirmar que los servicios requeridos están activos.

No asumir que todos los paquetes del monorepo tienen los mismos scripts.

### 7.7 Criterios de aceptación

Una tarea se considera terminada cuando:

- Cumple el objetivo solicitado.
- Respeta la arquitectura y propiedad de archivos.
- No introduce errores de TypeScript.
- Pasa las pruebas aplicables.
- No introduce regresiones conocidas.
- Documenta los cambios relevantes.
- Informa claramente las validaciones que no pudieron ejecutarse.

## 8. Documentación

Los cambios que afecten la arquitectura, la base de datos, la seguridad o los flujos principales deben documentarse.

- `docs/ARCHITECTURE.md`: arquitectura general y decisiones técnicas.
- `docs/database/`: esquema, migraciones y decisiones de persistencia.
- `security/`: hallazgos, evidencias y retests.

No documentar funcionalidades como terminadas si todavía no están implementadas.

No dejar placeholders, instrucciones temporales o secciones pendientes en documentación presentada como final.

## 9. Gestión de errores y bloqueos

Cuando un agente no pueda continuar:

1. Describir el bloqueo.
2. Indicar qué intentó.
3. Mostrar el error o evidencia.
4. Identificar qué decisión o intervención necesita.
5. No improvisar cambios fuera de su alcance.

Si existe una discrepancia entre estas reglas, las instrucciones específicas de un agente y la configuración de permisos efectiva, prevalece la restricción de seguridad más estricta. Se debe solicitar autorización al responsable del repositorio.