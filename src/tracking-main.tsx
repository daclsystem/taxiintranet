import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { ThemeProvider } from './contexts/ThemeContext';
import { Tracking } from './components/Tracking';
import './index.css';

/**
 * Punto de entrada para la página de tracking externa (mt.html)
 */
function TrackingApp() {
  // Obtener token desde URL
  const urlParams = new URLSearchParams(window.location.search);
  const token = urlParams.get('key') || '';

  console.log('Token obtenido de URL:', token);

  if (!token) {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="w-16 h-16 bg-red-100 dark:bg-red-900 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-zinc-900 dark:text-white mb-2">
            Token no válido
          </h2>
          <p className="text-zinc-600 dark:text-zinc-400">
            No se proporcionó un token válido para el tracking del servicio.
          </p>
        </div>
      </div>
    );
  }

  return (
    <Tracking
      token={token}
      variant="page"
      onVolver={() => window.history.back()}
    />
  );
}

const rootElement = document.getElementById('root');
if (rootElement) {
  createRoot(rootElement).render(
    <StrictMode>
      <ThemeProvider>
        <TrackingApp />
      </ThemeProvider>
    </StrictMode>
  );
}