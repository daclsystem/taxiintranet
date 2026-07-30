type ConnectionApi = {
  showServer: () => void;
  showOffline: () => void;
  clear: () => void;
};

declare global {
  interface Window {
    __zmovilidadConnection?: ConnectionApi;
  }
}

/** Notifica al banner global un fallo de servidor/internet */
export const notifyConnectionIssue = (kind: 'offline' | 'server'): void => {
  const api = window.__zmovilidadConnection;
  if (!api) return;
  if (kind === 'offline') api.showOffline();
  else api.showServer();
};

export const registerConnectionApi = (api: ConnectionApi): void => {
  window.__zmovilidadConnection = api;
};

export const unregisterConnectionApi = (): void => {
  delete window.__zmovilidadConnection;
};
