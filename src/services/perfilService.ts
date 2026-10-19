import { PerfilResponse } from '../types/perfil';
import { obtenerSesion } from './authService';
import { fetchWithAuth } from '../utils/apiInterceptor';
import { throwConnectionError } from '../utils/connectionErrors';

const API_BASE_URL = 'https://apitaxi.indevsoft.com/api/AppIntranetCliente';

/**
 * Servicio para obtener datos del perfil del usuario
 */
export const obtenerPerfil = async (): Promise<PerfilResponse> => {
  const session = obtenerSesion();
  
  if (!session || !session.key || !session.idpersonal) {
    throw new Error('Sesión no válida');
  }

  try {
    const response = await fetchWithAuth(`${API_BASE_URL}/Perfilw?idpersonal=${session.idpersonal}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${session.key}`,
        'Content-Type': 'application/json',
      }
    });

    console.log('URL llamada:', `${API_BASE_URL}/Perfilw?idpersonal=${session.idpersonal}`);
    console.log('Response status:', response.status);

    if (!response.ok) {
      throw new Error(`Error HTTP: ${response.status}`);
    }

    const data: PerfilResponse = await response.json();
    console.log('Datos del perfil recibidos:', data);
    
    if (data.estatus !== 200) {
      throw new Error(data.message || 'Error al obtener datos del perfil');
    }

    return data;
  } catch (error) {
    console.error('Error al obtener perfil:', error);
    throwConnectionError(error);
  }
};