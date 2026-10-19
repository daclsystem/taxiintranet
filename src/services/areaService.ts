import { AreasResponse } from '../types/area';
import { obtenerSesion } from './authService';
import { fetchWithAuth } from '../utils/apiInterceptor';
import { utils, writeFile } from 'xlsx';
import { throwConnectionError } from '../utils/connectionErrors';

const API_BASE_URL = 'https://apitaxi.indevsoft.com/api/AppIntranetCliente';

/**
 * Servicio para crear o actualizar área
 */
export const guardarArea = async (areaData: {
  idarea: number;
  area: string;
  idestado: number;
}): Promise<any> => {
  const session = obtenerSesion();
  
  if (!session || !session.key || !session.idcliente) {
    throw new Error('Sesión no válida');
  }

  try {
    const body = {
      idarea: areaData.idarea,
      idcliente: session.idcliente,
      area: areaData.area,
      idestado: areaData.idestado,
      operador: "intranet",
      ipproceso: "0.0.0.0"
    };

    const response = await fetchWithAuth(`${API_BASE_URL}/Areara`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${session.key}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      throw new Error(`Error HTTP: ${response.status}`);
    }

    const data = await response.json();
    
    if (data.estatus !== 200) {
      throw new Error(data.message || 'Error al guardar área');
    }

    return data;
  } catch (error) {
    console.error('Error al guardar área:', error);
    throwConnectionError(error);
  }
};

/**
 * Servicio para obtener áreas registradas
 */
export const obtenerAreas = async (): Promise<AreasResponse> => {
  const session = obtenerSesion();
  
  if (!session || !session.key || !session.idcliente) {
    throw new Error('Sesión no válida');
  }

  try {
    const response = await fetchWithAuth(
      `${API_BASE_URL}/Arearegistrados?idestado=3&idcliente=${session.idcliente}`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${session.key}`,
          'Content-Type': 'application/json',
        }
      }
    );

    console.log('URL llamada:', `${API_BASE_URL}/Arearegistrados?idestado=3&idcliente=${session.idcliente}`);
    console.log('Response status:', response.status);
    
    if (!response.ok) {
      throw new Error(`Error HTTP: ${response.status}`);
    }

    const data: AreasResponse = await response.json();
    console.log('Datos recibidos:', data);
    
    if (data.estatus !== 200) {
      throw new Error(data.message || 'Error al obtener áreas');
    }

    return data;
  } catch (error) {
    console.error('Error al obtener áreas:', error);
    throwConnectionError(error);
  }
};

/**
 * Exportar áreas a XLS
 */
export const exportarAreasXLS = (areas: any[]) => {
  const headers = ['Área', 'Modalidad', 'N° Servicios', 'Monto', 'Estado'];

  const rows = areas.map((area) => [
    area.area ?? '',
    area.modalidad ?? '',
    area.nservicios ?? 0,
    (typeof area.monto === 'number' ? area.monto.toFixed(2) : area.monto ?? ''),
    area.idestado === 1 ? 'Activo' : 'Inactivo'
  ]);

  const worksheet = utils.aoa_to_sheet([headers, ...rows]);
  const workbook = utils.book_new();
  utils.book_append_sheet(workbook, worksheet, 'Áreas');
  writeFile(workbook, `areas_${new Date().toISOString().split('T')[0]}.xlsx`);
};