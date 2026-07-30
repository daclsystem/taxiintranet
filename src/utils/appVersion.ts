const envVersion =
  typeof import.meta !== 'undefined'
    ? (import.meta.env.VITE_APP_VERSION as string | undefined)
    : undefined;

/** En dev a veces llega 0.0.0; usar package como respaldo. */
export const APP_VERSION =
  envVersion && envVersion !== '0.0.0' ? envVersion : '1.0.7';

const STORAGE_KEY = 'zmovilidad_app_version';

export const getStoredAppVersion = (): string | null => {
  try {
    return localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
};

export const storeAppVersion = (version: string): void => {
  try {
    localStorage.setItem(STORAGE_KEY, version);
  } catch {
    // ignore
  }
};

export interface RemoteVersionInfo {
  version: string;
  builtAt?: string;
}

/**
 * Consulta version.json del servidor (sin caché) para detectar actualizaciones.
 */
export const fetchRemoteVersion = async (): Promise<RemoteVersionInfo | null> => {
  try {
    const response = await fetch(`${import.meta.env.BASE_URL}version.json?t=${Date.now()}`, {
      cache: 'no-store',
      headers: { 'Cache-Control': 'no-cache' },
    });
    if (!response.ok) return null;
    const data = await response.json();
    if (!data || typeof data.version !== 'string') return null;
    return data as RemoteVersionInfo;
  } catch {
    return null;
  }
};
