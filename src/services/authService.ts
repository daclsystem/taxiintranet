import { CodigoResponse, AccesoResponse, VerifyCodeData, UserSession, RecuperarPasswordResponse, ActualizarPasswordResponse, CambiarContrasenaResponse } from '../types/auth';
import { fetchWithAuth } from '../utils/apiInterceptor';
import { throwConnectionError } from '../utils/connectionErrors';
import { APP_VERSION } from '../utils/appVersion';

const API_BASE_URL = 'https://apitaxi.indevsoft.com/api/AppIntranetCliente';

/**
 * Servicio para login por email
 */
export const loginPorEmail = async (email: string, password: string): Promise<AccesoResponse> => {
  try {
    const response = await fetchWithAuth(`${API_BASE_URL}/Accesoemail`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
        clave: password,
        vapp: APP_VERSION,
        notificacion: '',
        plataforma: 'Intranet'
      })
    });

    if (!response.ok) {
      throw new Error(`Error HTTP: ${response.status}`);
    }

    const data: AccesoResponse = await response.json();
    return data;
  } catch (error) {
    console.error('Error al hacer login por email:', error);
    throwConnectionError(error);
  }
};

/**
 * Servicio para solicitar código de verificación por SMS
 */
export const solicitarCodigo = async (telefono: string): Promise<CodigoResponse> => {
  try {
    const response = await fetchWithAuth(`${API_BASE_URL}/Codigo`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        telefono,
        condicion: 0
      })
    });

    if (!response.ok) {
      throw new Error(`Error HTTP: ${response.status}`);
    }

    const data: CodigoResponse = await response.json();
    return data;
  } catch (error) {
    console.error('Error al solicitar código:', error);
    throwConnectionError(error);
  }
};

/**
 * Servicio para verificar código y acceder al sistema
 */
export const verificarCodigo = async (data: {
  telefono: string;
  codigo: string;
  vapp: string;
  notificacion: string;
  plataforma: string;
}): Promise<AccesoResponse> => {
  try {
    const response = await fetchWithAuth(`${API_BASE_URL}/Acceso`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      throw new Error(`Error HTTP: ${response.status}`);
    }

    const result: AccesoResponse = await response.json();
    return result;
  } catch (error) {
    console.error('Error al verificar código:', error);
    throwConnectionError(error);
  }
};

/**
 * Servicio para solicitar recuperación de contraseña
 */
export const recuperarPassword = async (email: string): Promise<RecuperarPasswordResponse> => {
  try {
    const response = await fetchWithAuth(`${API_BASE_URL}/Accesoemailrecupera`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email
      })
    });

    if (!response.ok) {
      throw new Error(`Error HTTP: ${response.status}`);
    }

    const data: RecuperarPasswordResponse = await response.json();
    return data;
  } catch (error) {
    console.error('Error al solicitar recuperación de contraseña:', error);
    throwConnectionError(error);
  }
};

/**
 * Servicio para actualizar contraseña con código
 */
export const actualizarPassword = async (idpersonal: number, codigo: string, contrasena: string): Promise<ActualizarPasswordResponse> => {
  try {
    const response = await fetchWithAuth(`${API_BASE_URL}/Contrasenaa`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        idpersonal,
        codigo: parseInt(codigo),
        contrasena
      })
    });

    if (!response.ok) {
      throw new Error(`Error HTTP: ${response.status}`);
    }

    const data: ActualizarPasswordResponse = await response.json();
    return data;
  } catch (error) {
    console.error('Error al actualizar contraseña:', error);
    throwConnectionError(error);
  }
};

/**
 * Servicio para cambiar contraseña directamente (sin código de verificación)
 */
export const cambiarContrasena = async (idpersonal: number, contrasena: string): Promise<CambiarContrasenaResponse> => {
  try {
    // Obtener la sesión actual para el token
    const session = obtenerSesion();
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    
    // Agregar el token de autorización si existe
    if (session && session.key) {
      headers['Authorization'] = `Bearer ${session.key}`;
    }

    const response = await fetch(`${API_BASE_URL}/Contrasenar`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        idpersonal,
        condicion: 1,
        contrasena
      })
    });

    if (!response.ok) {
      throw new Error(`Error HTTP: ${response.status}`);
    }

    const data: CambiarContrasenaResponse = await response.json();
    return data;
  } catch (error) {
    console.error('Error al cambiar contraseña:', error);
    throwConnectionError(error);
  }
};

/**
 * Guardar sesión del usuario en localStorage
 */
export const guardarSesion = (session: UserSession): void => {
  try {
    localStorage.setItem('zmovilidad_session', JSON.stringify(session));
  } catch (error) {
    console.error('Error al guardar sesión:', error);
  }
};

/**
 * Obtener sesión del usuario desde localStorage
 */
export const obtenerSesion = (): UserSession | null => {
  try {
    const sessionData = localStorage.getItem('zmovilidad_session');
    return sessionData ? JSON.parse(sessionData) : null;
  } catch (error) {
    console.error('Error al obtener sesión:', error);
    return null;
  }
};

/**
 * Cerrar sesión: limpia todo el localStorage del navegador.
 */
export const limpiarSesion = (): void => {
  try {
    localStorage.clear();
  } catch (error) {
    console.error('Error al limpiar sesión:', error);
    try {
      localStorage.removeItem('zmovilidad_session');
    } catch {
      // ignore
    }
  }
};