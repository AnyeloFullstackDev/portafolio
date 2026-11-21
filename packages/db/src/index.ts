/**
 * @portfolio/db — contrato tipado del CMS del portafolio.
 *
 * Este paquete no crea clientes ni lee variables de entorno. Quien consume
 * decide el cliente:
 *   - `apps/web`: `createClient` con la clave anónima (solo lectura pública).
 *   - `apps/admin`: cliente SSR con la sesión del administrador.
 *
 * Nunca importar este paquete en el navegador con `service_role`.
 */

export * from './database.types';
export * from './publication';
export * from './models';
export * from './queries';
export * from './mutations';
export * from './contact';
export { ContentError } from './errors';
