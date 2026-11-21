import { ContentError } from './errors';

/**
 * Forma mínima de error de PostgREST. `PostgrestError` es asignable a esta
 * interfaz, de modo que los helpers no dependen del cliente en tiempo de
 * ejecución ni filtran el tipo generado.
 */
export interface PostgrestLikeError {
  message: string;
  code?: string;
}

export interface PostgrestLikeResult<T> {
  data: T | null;
  error: PostgrestLikeError | null;
}

/** Devuelve `data` o lanza `ContentError` si hubo error o no hay datos. */
export function unwrapResult<T>(
  operation: string,
  result: PostgrestLikeResult<T>,
): T {
  if (result.error !== null) {
    throw new ContentError(
      operation,
      result.error.message,
      result.error.code ?? null,
    );
  }

  if (result.data === null) {
    throw new ContentError(
      operation,
      'La operación no devolvió datos.',
    );
  }

  return result.data;
}

/** Devuelve `data` o `null`; solo lanza si PostgREST reportó un error. */
export function unwrapMaybe<T>(
  operation: string,
  result: PostgrestLikeResult<T>,
): T | null {
  if (result.error !== null) {
    throw new ContentError(
      operation,
      result.error.message,
      result.error.code ?? null,
    );
  }

  return result.data;
}

/** Comprueba que una operación sin retorno terminó sin error. */
export function unwrapVoid(
  operation: string,
  result: { error: PostgrestLikeError | null },
): void {
  if (result.error !== null) {
    throw new ContentError(
      operation,
      result.error.message,
      result.error.code ?? null,
    );
  }
}
