import React, { useEffect, useState, useCallback } from 'react';
import { RefreshCw, Sparkles, X } from 'lucide-react';
import {
  APP_VERSION,
  fetchRemoteVersion,
  getStoredAppVersion,
  storeAppVersion,
} from '../utils/appVersion';

/**
 * Detecta nueva versión publicada y ofrece recargar la aplicación.
 */
export const UpdateBanner: React.FC = () => {
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [remoteVersion, setRemoteVersion] = useState<string | null>(null);
  const [dismissed, setDismissed] = useState(false);

  const checkVersion = useCallback(async () => {
    const remote = await fetchRemoteVersion();
    if (!remote?.version) return;

    const current = APP_VERSION;
    storeAppVersion(current);

    if (remote.version !== current) {
      setRemoteVersion(remote.version);
      setUpdateAvailable(true);
      setDismissed(false);
    }
  }, []);

  useEffect(() => {
    // Primera carga: recordar versión local
    const stored = getStoredAppVersion();
    if (!stored) {
      storeAppVersion(APP_VERSION);
    }

    void checkVersion();

    const interval = setInterval(() => {
      void checkVersion();
    }, 60_000);

    const onFocus = () => {
      void checkVersion();
    };
    window.addEventListener('focus', onFocus);
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') void checkVersion();
    });

    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', onFocus);
    };
  }, [checkVersion]);

  const handleUpdate = () => {
    storeAppVersion(remoteVersion || APP_VERSION);
    window.location.reload();
  };

  if (!updateAvailable || dismissed) return null;

  return (
    <div className="fixed top-4 left-4 right-4 sm:left-1/2 sm:right-auto sm:-translate-x-1/2 sm:max-w-lg z-[60] animate-fade-in">
      <div className="flex items-start gap-3 rounded-xl px-4 py-3 shadow-xl border border-primary-300 dark:border-primary-700 bg-white/95 dark:bg-gray-900/95 backdrop-blur-md text-zinc-900 dark:text-white">
        <div className="flex-shrink-0 mt-0.5 text-primary-600 dark:text-primary-400">
          <Sparkles className="w-5 h-5" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold">Nueva versión disponible</p>
          <p className="text-xs mt-0.5 text-gray-600 dark:text-gray-300">
            Hay una actualización ({remoteVersion}). Recarga para obtener las mejoras.
          </p>
          <button
            type="button"
            onClick={handleUpdate}
            className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-primary-600 hover:bg-primary-700 text-white transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Actualizar ahora
          </button>
        </div>
        <button
          type="button"
          onClick={() => setDismissed(true)}
          className="flex-shrink-0 p-1 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800 text-gray-500"
          aria-label="Cerrar"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
