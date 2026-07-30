import { ValeResponse } from '../types/vale';
import { throwConnectionError } from '../utils/connectionErrors';

const API_BASE_URL = 'https://apiservices.zmovilidad.app/api/Generador';

/**
 * Servicio para obtener datos del vale
 */
export const obtenerVale = async (token: string): Promise<ValeResponse> => {
  try {
    const response = await fetch(`${API_BASE_URL}/Vale?idservicios=${token}&condicion=0`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
    });

    if (!response.ok) {
      throw new Error(`Error HTTP: ${response.status}`);
    }

    const data = await response.json();
    
    if (data.result.estatus !== 200) {
      throw new Error(data.result.message || 'Error al obtener vale');
    }

    return data.result;
  } catch (error) {
    console.error('Error al obtener vale:', error);
    throwConnectionError(error);
  }
};