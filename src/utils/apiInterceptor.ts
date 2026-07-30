import { limpiarSesion } from '../services/authService';
import {
  ConnectionError,
  isOffline,
  MSG_SERVIDOR_NO_RESPONDE,
} from './connectionErrors';
import { notifyConnectionIssue } from './connectionEvents';

const clearConnectionBanner = () => {
  window.__zmovilidadConnection?.clear();
};

/**
 * Mostrar toast de expiración de sesión
 */
const mostrarToastExpiracion = () => {
  const toast = document.createElement('div');
  toast.className =
    'fixed top-4 right-4 z-50 max-w-sm w-full bg-red-500 text-white p-4 rounded-lg shadow-lg transform transition-all duration-300 ease-in-out';
  toast.innerHTML = `
    <div class="flex items-center">
      <svg class="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
        <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd"></path>
      </svg>
      <div>
        <p class="font-medium">Sesión expirada</p>
        <p class="text-sm opacity-90">Inicia sesión nuevamente</p>
      </div>
    </div>
  `;

  document.body.appendChild(toast);

  setTimeout(() => {
    if (toast.parentNode) {
      toast.parentNode.removeChild(toast);
    }
  }, 3000);
};

/**
 * Interceptor global para manejar respuestas de API
 */
export const handleApiResponse = async (response: Response): Promise<Response> => {
  if (response.status === 401) {
    console.log('Token expirado - redirigiendo al login');
    mostrarToastExpiracion();
    limpiarSesion();
    setTimeout(() => {
      window.location.href = `${import.meta.env.BASE_URL}login`;
    }, 1000);
    throw new Error('Sesión expirada. Por favor, inicia sesión nuevamente.');
  }

  if (response.status >= 500) {
    notifyConnectionIssue('server');
    throw new ConnectionError('server', MSG_SERVIDOR_NO_RESPONDE);
  }

  if (response.ok) {
    try {
      const data = await response.clone().json();

      if (
        data.estatus === 401 ||
        data.estatus === 403 ||
        (data.message && data.message.toLowerCase().includes('token')) ||
        (data.message && data.message.toLowerCase().includes('sesión')) ||
        (data.message && data.message.toLowerCase().includes('autorización'))
      ) {
        console.log('Token expirado detectado en respuesta - redirigiendo al login');
        mostrarToastExpiracion();
        limpiarSesion();
        setTimeout(() => {
          window.location.href = `${import.meta.env.BASE_URL}login`;
        }, 1000);
        throw new Error('Sesión expirada. Por favor, inicia sesión nuevamente.');
      }
    } catch (jsonError) {
      if (jsonError instanceof Error && jsonError.message.includes('Sesión expirada')) {
        throw jsonError;
      }
      if (jsonError instanceof ConnectionError) {
        throw jsonError;
      }
    }
  }

  return response;
};

/**
 * Wrapper para fetch con manejo de sesión, internet y servidor
 */
export const fetchWithAuth = async (
  url: string,
  options: RequestInit = {}
): Promise<Response> => {
  if (isOffline()) {
    notifyConnectionIssue('offline');
    throw new ConnectionError('offline');
  }

  try {
    const response = await fetch(url, options);
    const handled = await handleApiResponse(response);
    if (handled.ok || (handled.status > 0 && handled.status < 500)) {
      clearConnectionBanner();
    }
    return handled;
  } catch (error) {
    if (error instanceof ConnectionError) {
      notifyConnectionIssue(error.kind);
      throw error;
    }

    if (error instanceof Error && error.message.includes('Sesión expirada')) {
      throw error;
    }

    if (isOffline()) {
      notifyConnectionIssue('offline');
      throw new ConnectionError('offline');
    }

    notifyConnectionIssue('server');
    throw new ConnectionError('server');
  }
};
