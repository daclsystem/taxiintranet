import { SolicitudesPersonalResponse } from '../types/serviciosPersonal';
import { CancelacionResponse } from '../types/serviciosPersonal';
import { obtenerSesion } from './authService';
import { fetchWithAuth } from '../utils/apiInterceptor';
import { utils, writeFile } from 'xlsx';
import { throwConnectionError } from '../utils/connectionErrors';

const API_BASE_URL = 'https://apiservices.zmovilidad.app/api/AppIntranetCliente';

/**
 * Servicio para obtener motivos de cancelación
 */
export const obtenerMotivosCancelacion = async (idservicio: number): Promise<CancelacionResponse> => {
  const session = obtenerSesion();
  
  if (!session || !session.key) {
    throw new Error('Sesión no válida');
  }

  try {
    const url = `${API_BASE_URL}/Cancelar?idtipo=1&plataforma=1&idservicio=${idservicio}`;
    
    console.log('URL llamada:', url);
    
    const response = await fetchWithAuth(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${session.key}`,
        'Content-Type': 'application/json',
      }
    });

    console.log('Response status:', response.status);
    
    if (!response.ok) {
      throw new Error(`Error HTTP: ${response.status}`);
    }

    const data: CancelacionResponse = await response.json();
    console.log('Datos recibidos:', data);
    
    if (data.estatus !== 200) {
      throw new Error(data.message || 'Error al obtener motivos de cancelación');
    }

    return data;
  } catch (error) {
    console.error('Error al obtener motivos de cancelación:', error);
    throwConnectionError(error);
  }
};

/**
 * Servicio para obtener solicitudes del personal
 */
export const obtenerSolicitudesPersonal = async (
  condicion: number = 3,
  consulta: string = '""'
): Promise<SolicitudesPersonalResponse> => {
  const session = obtenerSesion();
  
  if (!session || !session.key || !session.idpersonal || !session.idcliente) {
    throw new Error('Sesión no válida');
  }

  try {
    const url = `${API_BASE_URL}/Solicitudes?idpersonal=${session.idpersonal}&idcliente=${session.idcliente}&condicion=${condicion}&consulta=${encodeURIComponent(consulta)}`;
    
    console.log('URL llamada:', url);
    
    const response = await fetchWithAuth(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${session.key}`,
        'Content-Type': 'application/json',
      }
    });

    console.log('Response status:', response.status);
    
    if (!response.ok) {
      throw new Error(`Error HTTP: ${response.status}`);
    }

    const data: SolicitudesPersonalResponse = await response.json();
    console.log('Datos recibidos:', data);
    
    if (data.estatus !== 200) {
      throw new Error(data.message || 'Error al obtener solicitudes del personal');
    }

    return data;
  } catch (error) {
    console.error('Error al obtener solicitudes del personal:', error);
    throwConnectionError(error);
  }
};

/**
 * Exportar solicitudes a XLS
 */
export const exportarSolicitudesXLS = (solicitudes: any[]) => {
  const headers = [
    'ID Servicio', 'Tipo', 'Fecha', 'Hora', 'Solicitante', 'Traslado', 'Origen',
    'Ruta Adicional', 'Destino', 'Área', 'Centro Costos', 'Motivo Solicitud',
    'Motivo Detalle', 'Tipo Servicio', 'Puntos', 'Costo', 'Estado'
  ];

  const rows = solicitudes.map((s) => [
    s.idservicio ?? '',
    s.tservicio ?? '',
    s.fecha ?? '',
    s.hora ?? '',
    s.solicitante ?? '',
    (s.traslado ? String(s.traslado).replace(/&#x0D;\n/g, '').trim() : ''),
    s.direccionorigen ?? '',
    s.rutaadicional ?? '',
    s.direcciondestino ?? '',
    s.area && s.area !== '0' ? s.area : '',
    s.centrocostos && s.centrocostos !== '0' ? s.centrocostos : '',
    s.motivosolicitud ?? '',
    s.motivodetalle ?? '',
    s.tipo ?? '',
    s.npuntos ?? 0,
    (typeof s.costototal === 'number' ? s.costototal.toFixed(2) : s.costototal ?? ''),
    s.estado ?? ''
  ]);

  const worksheet = utils.aoa_to_sheet([headers, ...rows]);
  const workbook = utils.book_new();
  utils.book_append_sheet(workbook, worksheet, 'Solicitudes');
  writeFile(workbook, `servicios_personal_${new Date().toISOString().split('T')[0]}.xlsx`);
};