import { CentroCostosResponse } from '../types/centroCostos';
import { obtenerSesion } from './authService';
import { fetchWithAuth } from '../utils/apiInterceptor';
import { utils, writeFile } from 'xlsx';
import { throwConnectionError } from '../utils/connectionErrors';

const API_BASE_URL = 'https://apitaxi.indevsoft.com/api/AppIntranetCliente';

/**
 * Servicio para crear o actualizar centro de costos
 */
export const guardarCentroCostos = async (centroCostosData: {
  idcentrocostos: number;
  centrocostos: string;
  idestado: number;
}): Promise<any> => {
  const session = obtenerSesion();
  
  if (!session || !session.key || !session.idcliente) {
    throw new Error('Sesión no válida');
  }

  try {
    const body = {
      idcentrocostos: centroCostosData.idcentrocostos,
      idcliente: session.idcliente,
      centrocostos: centroCostosData.centrocostos,
      idestado: centroCostosData.idestado,
      operador: "intranet",
      ipproceso: "0.0.0.0"
    };

    const response = await fetchWithAuth(`${API_BASE_URL}/Centrocostosra`, {
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
      throw new Error(data.message || 'Error al guardar centro de costos');
    }

    return data;
  } catch (error) {
    console.error('Error al guardar centro de costos:', error);
    throwConnectionError(error);
  }
};

/**
 * Servicio para obtener centros de costos registrados
 */
export const obtenerCentrosCostos = async (): Promise<CentroCostosResponse> => {
  const session = obtenerSesion();
  
  if (!session || !session.key || !session.idcliente) {
    throw new Error('Sesión no válida');
  }

  try {
    const response = await fetchWithAuth(
      `${API_BASE_URL}/Centrocostosregistrados?idestado=3&idcliente=${session.idcliente}`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${session.key}`,
          'Content-Type': 'application/json',
        }
      }
    );

    console.log('URL llamada:', `${API_BASE_URL}/Centrocostosregistrados?idestado=3&idcliente=${session.idcliente}`);
    console.log('Response status:', response.status);
    
    if (!response.ok) {
      throw new Error(`Error HTTP: ${response.status}`);
    }

    const data: CentroCostosResponse = await response.json();
    console.log('Datos recibidos:', data);
    
    if (data.estatus !== 200) {
      throw new Error(data.message || 'Error al obtener centros de costos');
    }

    return data;
  } catch (error) {
    console.error('Error al obtener centros de costos:', error);
    throwConnectionError(error);
  }
};

/**
 * Exportar centros de costos a XLS
 */
export const exportarCentrosCostosXLS = (centrosCostos: any[]) => {
  const headers = ['Centro de Costos', 'Modalidad', 'N° Servicios', 'Monto', 'Estado'];

  const rows = centrosCostos.map((centro) => [
    centro.centrocostos ?? '',
    centro.modalidad ?? '',
    centro.nservicios ?? 0,
    (typeof centro.monto === 'number' ? centro.monto.toFixed(2) : centro.monto ?? ''),
    centro.idestado === 1 ? 'Activo' : 'Inactivo'
  ]);

  const worksheet = utils.aoa_to_sheet([headers, ...rows]);
  const workbook = utils.book_new();
  utils.book_append_sheet(workbook, worksheet, 'CentrosCostos');
  writeFile(workbook, `centros_costos_${new Date().toISOString().split('T')[0]}.xlsx`);
};