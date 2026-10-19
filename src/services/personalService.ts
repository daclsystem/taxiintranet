import { PersonalResponse, PersonalDataResponse } from '../types/personal';
import { obtenerSesion } from './authService';
import { fetchWithAuth } from '../utils/apiInterceptor';
import { utils, writeFile } from 'xlsx';
import { throwConnectionError } from '../utils/connectionErrors';

const API_BASE_URL = 'https://apitaxi.indevsoft.com/api/AppIntranetCliente';

/**
 * Servicio para crear o actualizar personal
 */
export const guardarPersonal = async (personalData: {
  idpersonal: number;
  tipodocumento: string;
  ndocumento: string;
  apellidos: string;
  nombres: string;
  telefono: string;
  email: string;
  emailverificador: string;
  datjefe: string;
  area: string;
  centrocostos: string;
  administrador: boolean;
  jefe: boolean;
  validador: boolean;
  credito: boolean;
  idestado: number;
  tipo: string;
  cargo: string;
}): Promise<any> => {
  const session = obtenerSesion();
  
  if (!session || !session.key || !session.idcliente) {
    throw new Error('Sesión no válida');
  }

  try {
    const body = {
      idpersonal: personalData.idpersonal,
      idcliente: session.idcliente,
      tipodocumento: personalData.tipodocumento,
      ndocumento: personalData.ndocumento,
      apellidos: personalData.apellidos,
      nombres: personalData.nombres,
      telefono: personalData.telefono,
      email: personalData.email,
      emailv: personalData.emailverificador,
      djefe: personalData.datjefe,
      area: personalData.area,
      centrocostos: personalData.centrocostos,
      administrador: personalData.administrador,
      jefe: personalData.jefe,
      validador: personalData.validador,
      corporativo: personalData.credito,
      idestado: personalData.idestado,
      operador: "intranet",
      ipproceso: "0.0.0.0",
      tipo: personalData.tipo,
      cargo: personalData.cargo
    };

    const response = await fetchWithAuth(`${API_BASE_URL}/Personalra`, {
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
    
    if (data.estatus !== 200 && data.estatus !== 201) {
      throw new Error(data.message || 'Error al guardar personal');
    }

    return data;
  } catch (error) {
    console.error('Error al guardar personal:', error);
    throwConnectionError(error);
  }
};

/**
 * Servicio para obtener personal registrado
 */
export const obtenerPersonal = async (): Promise<PersonalResponse> => {
  const session = obtenerSesion();
  
  if (!session || !session.key || !session.idcliente) {
    throw new Error('Sesión no válida');
  }

  try {
    const response = await fetchWithAuth(
      `${API_BASE_URL}/Personalregistrados?idestado=3&idcliente=${session.idcliente}`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${session.key}`,
          'Content-Type': 'application/json',
        }
      }
    );

    console.log('URL llamada:', `${API_BASE_URL}/Personalregistrados?idestado=3&idcliente=${session.idcliente}`);
    console.log('Response status:', response.status);
    
    if (!response.ok) {
      throw new Error(`Error HTTP: ${response.status}`);
    }

    const data: PersonalResponse = await response.json();
    console.log('Datos recibidos:', data);
    
    if (data.estatus !== 200) {
      throw new Error(data.message || 'Error al obtener personal');
    }

    return data;
  } catch (error) {
    console.error('Error al obtener personal:', error);
    throwConnectionError(error);
  }
};

/**
 * Servicio para obtener datos de configuración (jefes, áreas, centros de costos)
 */
export const obtenerDatosPersonal = async (): Promise<PersonalDataResponse> => {
  const session = obtenerSesion();
  
  if (!session || !session.key || !session.idcliente) {
    throw new Error('Sesión no válida');
  }

  try {
    const response = await fetchWithAuth(
      `${API_BASE_URL}/data?idpersonal=0&idcliente=${session.idcliente}`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${session.key}`,
          'Content-Type': 'application/json',
        }
      }
    );

    console.log('URL llamada:', `${API_BASE_URL}/data?idpersonal=0&idcliente=${session.idcliente}`);
    console.log('Response status:', response.status);
    
    if (!response.ok) {
      throw new Error(`Error HTTP: ${response.status}`);
    }

    const data: PersonalDataResponse = await response.json();
    console.log('Datos de configuración recibidos:', data);
    
    if (data.estatus !== 200) {
      throw new Error(data.message || 'Error al obtener datos de configuración');
    }

    return data;
  } catch (error) {
    console.error('Error al obtener datos de configuración:', error);
    throwConnectionError(error);
  }
};

/**
 * Exportar personal a XLS
 */
export const exportarPersonalXLS = (personal: any[]) => {
  const headers = [
    'Nombres', 'Apellidos', 'Documento', 'Teléfono', 'Email',
    'Tipo', 'Área', 'Centro Costos', 'Cargo', 'N° Servicios', 'Monto', 'Estado'
  ];

  const rows = personal.map((p) => [
    p.nombres ?? '',
    p.apellidos ?? '',
    p.ndocumento ?? '',
    p.telefono ?? '',
    p.email ?? '',
    p.tipo ?? '',
    p.area ?? '',
    p.centrocostos ?? '',
    p.cargo ?? '',
    p.nservicios ?? 0,
    (typeof p.monto === 'number' ? p.monto.toFixed(2) : p.monto ?? ''),
    p.idestado === 1 ? 'Activo' : 'Inactivo'
  ]);

  const worksheet = utils.aoa_to_sheet([headers, ...rows]);
  const workbook = utils.book_new();
  utils.book_append_sheet(workbook, worksheet, 'Personal');
  writeFile(workbook, `personal_${new Date().toISOString().split('T')[0]}.xlsx`);
};