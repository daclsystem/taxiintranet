import { ConfiguracionSolicitudResponse, FavoritosResponse, BusquedaResponse, SolicitudRequest, SolicitudResponse } from '../types/solicitar';
import { obtenerSesion } from './authService';
import { fetchWithAuth } from '../utils/apiInterceptor';
import { GEO_PLACE_API_BASE, GEO_ROUTE_API_BASE } from '../config/apiEndpoints';
import { throwConnectionError } from '../utils/connectionErrors';

const API_BASE_URL = 'https://apiservices.zmovilidad.app/api/AppIntranetCliente';

/**
 * Servicio para obtener configuración de solicitud
 */
export const obtenerConfiguracionSolicitud = async (): Promise<ConfiguracionSolicitudResponse> => {
  const session = obtenerSesion();
  
  if (!session || !session.key || !session.idpersonal || !session.idcliente) {
    throw new Error('Sesión no válida');
  }

  console.log('Session data para configuración:', {
    idpersonal: session.idpersonal,
    idcliente: session.idcliente,
    key: session.key ? 'presente' : 'ausente'
  });

  try {
    const response = await fetchWithAuth(
      `${API_BASE_URL}/Configuracionsolicitud?idpersonal=${session.idpersonal}&idcliente=${session.idcliente}&tipo=1&plataforma=a`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${session.key}`,
          'Content-Type': 'application/json',
        }
      }
    );

    console.log('URL de configuración llamada:', `${API_BASE_URL}/Configuracionsolicitud?idpersonal=${session.idpersonal}&idcliente=${session.idcliente}&tipo=1&plataforma=a`);

    if (!response.ok) {
      throw new Error(`Error HTTP: ${response.status}`);
    }

    const data: ConfiguracionSolicitudResponse = await response.json();
    console.log('Respuesta de configuración:', data);
    
    if (data.estatus !== 200) {
      throw new Error(data.message || 'Error al obtener configuración de solicitud');
    }

    return data;
  } catch (error) {
    console.error('Error al obtener configuración de solicitud:', error);
    throwConnectionError(error);
  }
};

/**
 * Servicio para obtener favoritos del usuario
 */
export const obtenerFavoritos = async (): Promise<FavoritosResponse> => {
  const session = obtenerSesion();
  
  if (!session || !session.key || !session.idpersonal || !session.idcliente) {
    throw new Error('Sesión no válida');
  }

  try {
    const response = await fetchWithAuth(
      `${API_BASE_URL}/Favoritos?idpersonal=${session.idpersonal}&idcliente=${session.idcliente}&modo=0`,
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

    const data: FavoritosResponse = await response.json();
    
    if (data.estatus !== 200) {
      throw new Error(data.message || 'Error al obtener favoritos');
    }

    return data;
  } catch (error) {
    console.error('Error al obtener favoritos:', error);
    throwConnectionError(error);
  }
};

/**
 * Servicio para buscar direcciones (geo.taximonterrico.com)
 * Ejemplo: /api/v3/place/plaza%20de%20armas%20de%20cusc/0/udemo
 */
export const buscarDirecciones = async (query: string): Promise<BusquedaResponse> => {
  if (!query || query.trim().length < 2) {
    return { coincidencias: [] };
  }

  try {
    const encodedQuery = encodeURIComponent(query.trim());
    const response = await fetch(
      `${GEO_PLACE_API_BASE}/${encodedQuery}/0/udemo`,
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

    const data = await response.json();
    const coincidencias = Array.isArray(data?.coincidencias) ? data.coincidencias : [];

    return {
      coincidencias: coincidencias.map(
        (item: { direccion?: string; distrito?: string; lat?: number; lng?: number }) => ({
          direccion: item.direccion || '',
          distrito: item.distrito || '',
          lat: Number(item.lat) || 0,
          lng: Number(item.lng) || 0,
        })
      ),
    };
  } catch (error) {
    console.error('Error al buscar direcciones:', error);
    // No romper la UI del autocomplete
    return { coincidencias: [] };
  }
};

/**
 * Servicio para detectar zona basada en coordenadas
 */
export const detectarZona = async (latitude: number, longitude: number) => {
  const session = obtenerSesion();
  
  if (!session || !session.key) {
    throw new Error('Sesión no válida');
  }

  try {
    const response = await fetchWithAuth(
      `https://apiservices.zmovilidad.app/api/AppIntranetcliente/Zona?latitude=${latitude}&longitude=${longitude}`,
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

    const data = await response.json();
    
    if (data.estatus !== 200) {
      throw new Error(data.message || 'Error al detectar zona');
    }

    return data;
  } catch (error) {
    console.error('Error al detectar zona:', error);
    throwConnectionError(error);
  }
};

/**
 * Servicio para calcular ruta / distancia / tiempo entre dos puntos
 * Ejemplo: /api/v3/route/-12.10,-76.93/-12.08,-76.96/-1/demo
 */
export const calcularRuta = async (
  origenLat: number,
  origenLng: number,
  destinoLat: number,
  destinoLng: number
) => {
  try {
    const origin = `${origenLat},${origenLng}`;
    const destination = `${destinoLat},${destinoLng}`;
    const response = await fetch(
      `${GEO_ROUTE_API_BASE}/${origin}/${destination}/-1/demo`,
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

    const data = await response.json();

    const ok =
      data.status === 200 ||
      data.estatus === 200 ||
      (data.time != null && data.distance != null);
    if (!ok) {
      throw new Error('Error al calcular ruta');
    }

    return {
      time: Number(data.time) || 0,
      distance: Number(data.distance) || 0,
      route: Array.isArray(data.route) ? data.route : [],
      status: data.status ?? 200,
      server: data.server,
      latency: data.latency,
    };
  } catch (error) {
    console.error('Error al calcular ruta:', error);
    throwConnectionError(error);
  }
};

/**
 * Servicio para calcular tarifa del servicio
 */
export const calcularTarifa = async (tarifaData: {
  modalidad: string;
  idcliente: number;
  tpago: string;
  fecha: string;
  hora: string;
  nusuarios: number;
  zorigen: string;
  zdestino: string;
  tipomovil: string;
  tservicio: number;
  ttarifario: string;
  plataforma: string;
  distancia: number;
  tiempo: number;
}): Promise<{ tarifa: number; courier: number; estatus: number; message: string; msystem: string }> => {
  const session = obtenerSesion();
  
  if (!session || !session.key) {
    throw new Error('Sesión no válida');
  }

  try {
    const response = await fetchWithAuth('https://apiservices.zmovilidad.app/api/AppIntranetCliente/Tarifario', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${session.key}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(tarifaData)
    });

    if (!response.ok) {
      throw new Error(`Error HTTP: ${response.status}`);
    }

    const data = await response.json();
    
    if (data.estatus !== 200) {
      throw new Error(data.message || 'Error al calcular tarifa');
    }

    return data;
  } catch (error) {
    console.error('Error al calcular tarifa:', error);
    throwConnectionError(error);
  }
};

/**
 * Solicitar permisos de geolocalización
 */
export const solicitarPermisoUbicacion = (): Promise<GeolocationPosition> => {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocalización no soportada por este navegador'));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve(position);
      },
      (error) => {
        let mensaje = 'Error al obtener ubicación';
        
        switch (error.code) {
          case error.PERMISSION_DENIED:
            mensaje = 'Permiso de ubicación denegado. Por favor, habilita la ubicación en tu navegador.';
            break;
          case error.POSITION_UNAVAILABLE:
            mensaje = 'Información de ubicación no disponible.';
            break;
          case error.TIMEOUT:
            mensaje = 'Tiempo de espera agotado al obtener ubicación.';
            break;
        }
        
        reject(new Error(mensaje));
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000
      }
    );
  });
};

/**
 * Convertir coordenadas a dirección (geocodificación inversa)
 */
export const obtenerDireccionDesdeCoordenadas = async (lat: number, lng: number): Promise<string> => {
  try {
    // Usando un servicio de geocodificación gratuito
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
      {
        headers: {
          'User-Agent': 'ZMovilidad/1.0'
        }
      }
    );

    if (!response.ok) {
      throw new Error('Error al obtener dirección');
    }

    const data = await response.json();
    return data.display_name || `${lat}, ${lng}`;
  } catch (error) {
    console.error('Error en geocodificación inversa:', error);
    return `${lat}, ${lng}`;
  }
};

/**
 * Servicio para guardar solicitud de servicio
 */
export const guardarSolicitud = async (solicitudData: SolicitudRequest): Promise<SolicitudResponse> => {
  const session = obtenerSesion();
  
  if (!session || !session.key) {
    throw new Error('Sesión no válida');
  }

  try {
    console.log('Enviando solicitud:', solicitudData);
    
    const response = await fetchWithAuth(`${API_BASE_URL}/Straslado`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${session.key}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(solicitudData)
    });

    console.log('Response status:', response.status);

    if (!response.ok) {
      throw new Error(`Error HTTP: ${response.status}`);
    }

    const data: SolicitudResponse = await response.json();
    console.log('Respuesta de solicitud:', data);
    
    if (data.estatus !== 200) {
      throw new Error(data.message || 'Error al guardar solicitud');
    }

    return data;
  } catch (error) {
    console.error('Error al guardar solicitud:', error);
    throwConnectionError(error);
  }
};