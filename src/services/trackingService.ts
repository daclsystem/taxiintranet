import { TrackingResponse, RutaResponse } from '../types/tracking';
import { GEO_ROUTE_API_BASE } from '../config/apiEndpoints';
import { throwConnectionError } from '../utils/connectionErrors';

const API_BASE_URL = 'https://apiservices.zmovilidad.app/api/Operaciones';

/**
 * Servicio para obtener datos de tracking
 */
export const obtenerTracking = async (token: string): Promise<TrackingResponse> => {
  try {
    const response = await fetch(`${API_BASE_URL}/Tracking?tokens=${token}&tservicio=1`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
    });

    if (!response.ok) {
      throw new Error(`Error HTTP: ${response.status}`);
    }

    const data: TrackingResponse = await response.json();
    
    if (data.estatus !== 200) {
      throw new Error(data.message || 'Error al obtener tracking');
    }

    return data;
  } catch (error) {
    console.error('Error al obtener tracking:', error);
    throwConnectionError(error);
  }
};

/**
 * Servicio para obtener ruta entre conductor y primer punto
 * Ejemplo: /api/v3/route/lat,lng/lat,lng/1/udemo
 */
export const obtenerRuta = async (
  conductorLat: number, 
  conductorLng: number, 
  destinoLat: number, 
  destinoLng: number
): Promise<RutaResponse> => {
  try {
    const origin = `${conductorLat},${conductorLng}`;
    const destination = `${destinoLat},${destinoLng}`;
    const response = await fetch(
      `${GEO_ROUTE_API_BASE}/${origin}/${destination}/1/udemo`,
      {
        method: 'GET',
        headers: {
          Accept: 'application/json',
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Error HTTP: ${response.status}`);
    }

    const data: RutaResponse = await response.json();

    const ok =
      data.status === 200 ||
      (data as RutaResponse & { estatus?: number }).estatus === 200 ||
      (data.time != null && data.distance != null);
    if (!ok) {
      throw new Error('Error al obtener ruta');
    }

    return data;
  } catch (error) {
    console.error('Error al obtener ruta:', error);
    throwConnectionError(error);
  }
};