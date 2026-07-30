/**
 * Utilidades para distinguir fallos de internet vs servidor.
 */

export const MSG_SIN_INTERNET =
  'Sin conexión a internet. Verifica tu red e intenta nuevamente.';

export const MSG_ERROR_SERVIDOR =
  'No se pudo conectar al servidor. Intenta nuevamente en unos momentos.';

export const MSG_SERVIDOR_NO_RESPONDE =
  'El servidor no responde correctamente. Intenta nuevamente.';

export class ConnectionError extends Error {
  readonly kind: 'offline' | 'server';

  constructor(kind: 'offline' | 'server', message?: string) {
    super(
      message ||
        (kind === 'offline' ? MSG_SIN_INTERNET : MSG_ERROR_SERVIDOR)
    );
    this.name = 'ConnectionError';
    this.kind = kind;
  }
}

export const isOffline = (): boolean =>
  typeof navigator !== 'undefined' && navigator.onLine === false;

const isNetworkFailure = (error: unknown): boolean => {
  if (error instanceof ConnectionError) return true;
  if (!(error instanceof Error)) return false;

  const msg = error.message.toLowerCase();
  return (
    error.name === 'TypeError' ||
    msg.includes('failed to fetch') ||
    msg.includes('networkerror') ||
    msg.includes('network request failed') ||
    msg.includes('load failed') ||
    msg === 'error de conexión. intenta nuevamente.' ||
    msg.includes('sin conexión') ||
    msg.includes('no se pudo conectar al servidor') ||
    msg.includes('el servidor no responde')
  );
};

/**
 * Convierte solo fallos de red/servidor; preserva errores de negocio.
 */
export const resolveConnectionError = (error: unknown): Error => {
  if (error instanceof ConnectionError) {
    return error;
  }

  if (error instanceof Error && error.message.toLowerCase().includes('sesión expirada')) {
    return error;
  }

  if (isOffline()) {
    return new ConnectionError('offline');
  }

  if (isNetworkFailure(error)) {
    return new ConnectionError('server');
  }

  if (error instanceof Error) {
    return error;
  }

  return new ConnectionError('server');
};

/**
 * Lanza el error apropiado (para usar en catch de services).
 */
export const throwConnectionError = (error: unknown): never => {
  throw resolveConnectionError(error);
};
