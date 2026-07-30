import React, { useEffect, useState } from 'react';
import { WifiOff, ServerCrash, X } from 'lucide-react';
import { isOffline } from '../utils/connectionErrors';
import {
  registerConnectionApi,
  unregisterConnectionApi,
} from '../utils/connectionEvents';

type BannerKind = 'offline' | 'server' | null;

/**
 * Banner global de estado de conexión (internet / servidor).
 */
export const ConnectionStatus: React.FC = () => {
  const [banner, setBanner] = useState<BannerKind>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const handleOffline = () => {
      setBanner('offline');
      setDismissed(false);
    };

    const handleOnline = () => {
      // Al recuperar internet, ocultar banner de offline
      setBanner((current) => (current === 'offline' ? null : current));
      setDismissed(false);
    };

    window.addEventListener('offline', handleOffline);
    window.addEventListener('online', handleOnline);

    if (isOffline()) {
      setBanner('offline');
    }

    return () => {
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('online', handleOnline);
    };
  }, []);

  useEffect(() => {
    registerConnectionApi({
      showServer: () => {
        if (!isOffline()) {
          setBanner('server');
          setDismissed(false);
        }
      },
      showOffline: () => {
        setBanner('offline');
        setDismissed(false);
      },
      clear: () => setBanner(null),
    });

    return () => unregisterConnectionApi();
  }, []);

  if (!banner || dismissed) return null;

  const isOfflineBanner = banner === 'offline';

  return (
    <div
      className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-4 sm:max-w-md z-[60] animate-slide-up"
      role="alert"
    >
      <div
        className={`
          flex items-start gap-3 rounded-xl px-4 py-3 shadow-xl border backdrop-blur-md
          ${isOfflineBanner
            ? 'bg-amber-50/95 dark:bg-amber-950/90 border-amber-300 dark:border-amber-700 text-amber-900 dark:text-amber-100'
            : 'bg-red-50/95 dark:bg-red-950/90 border-red-300 dark:border-red-700 text-red-900 dark:text-red-100'
          }
        `}
      >
        <div className="flex-shrink-0 mt-0.5">
          {isOfflineBanner ? (
            <WifiOff className="w-5 h-5" />
          ) : (
            <ServerCrash className="w-5 h-5" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold">
            {isOfflineBanner ? 'Sin conexión a internet' : 'Problema con el servidor'}
          </p>
          <p className="text-xs mt-0.5 opacity-90">
            {isOfflineBanner
              ? 'Verifica tu Wi‑Fi o datos móviles e intenta nuevamente.'
              : 'No pudimos comunicarnos con el servidor. Revisa en unos momentos.'}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setDismissed(true)}
          className="flex-shrink-0 p-1 rounded-md hover:bg-black/5 dark:hover:bg-white/10"
          aria-label="Cerrar"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
