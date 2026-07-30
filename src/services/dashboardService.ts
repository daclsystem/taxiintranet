import { PrincipalResponse, ReporteResponse } from '../types/dashboard';
import { obtenerSesion } from './authService';
import { fetchWithAuth } from '../utils/apiInterceptor';
import { throwConnectionError } from '../utils/connectionErrors';

const API_BASE_URL = 'https://apiservices.zmovilidad.app/api/AppIntranetCliente';

/**
 * Servicio para obtener datos principales del dashboard
 */
export const obtenerDatosPrincipales = async (): Promise<PrincipalResponse> => {
  const session = obtenerSesion();
  
  if (!session || !session.key || !session.idpersonal) {
    throw new Error('Sesión no válida');
  }

  try {
    const response = await fetchWithAuth(`${API_BASE_URL}/Principal?idpersonal=${session.idpersonal}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${session.key}`,
        'Content-Type': 'application/json',
      }
    });

    if (!response.ok) {
      throw new Error(`Error HTTP: ${response.status}`);
    }

    const data: PrincipalResponse = await response.json();
    
    if (data.estatus !== 200) {
      throw new Error(data.message || 'Error al obtener datos principales');
    }

    return data;
  } catch (error) {
    console.error('Error al obtener datos principales:', error);
    throwConnectionError(error);
  }
};

/**
 * Servicio para obtener reporte por mes/año
 */
export const obtenerReporte = async (consulta: string): Promise<ReporteResponse> => {
  const session = obtenerSesion();
  
  if (!session || !session.key || !session.idpersonal) {
    throw new Error('Sesión no válida');
  }

  try {
    const response = await fetchWithAuth(
      `${API_BASE_URL}/DReporte?consulta=${encodeURIComponent(consulta)}&idpersonal=${session.idpersonal}`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${session.key}`,
          'Content-Type': 'application/json',
        }
      }
    );

    if (!response.ok) {
      throw new Error(`Error HTTP: ${response.status}`);
    }

    const data: ReporteResponse = await response.json();
    
    if (data.estatus !== 200) {
      throw new Error(data.message || 'Error al obtener reporte');
    }

    return data;
  } catch (error) {
    console.error('Error al obtener reporte:', error);
    throwConnectionError(error);
  }
};