// Tipos para la gestión de servicios del personal
export interface SolicitudPersonal {
  idservicio: number;
  tservicio: string;
  hora: string;
  fecha: string;
  solicitante: string;
  traslado: string;
  area: string;
  centrocostos: string;
  motivosolicitud: string;
  motivodetalle: string;
  direccionorigen: string;
  rutaadicional: string;
  direcciondestino: string;
  tipo: string;
  npuntos: number;
  costototal: number;
  estado: string;
  colorcelda: string;
  colortexto: string;
  tokeng: string;
  validacion: boolean;
  idestado: number;
  estadorevision: string;
}

export interface SolicitudesPersonalResponse {
  detalle: string;
  aisolicitudes: SolicitudPersonal[];
  estatus: number;
  message: string;
  msystem: string;
}

export interface FiltrosSolicitudes {
  busqueda: string;
  fechaDesde: string;
  fechaHasta: string;
  solicitante: string;
  estado?: 'todos' | 'pendiente' | 'aprobado' | 'rechazado' | 'completado';
  tipoServicio?: 'todos' | 'Traslado' | 'Delivery' | 'Espera';
  mesAnio?: string;
}

export interface MotivoCancelacion {
  cancelar: string;
}

export interface CancelacionResponse {
  detalle: string;
  aocancelar: MotivoCancelacion[];
  estatus: number;
  message: string;
  msystem: string;
}