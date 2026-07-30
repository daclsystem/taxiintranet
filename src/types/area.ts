// Tipos para la gestión de áreas
export interface Area {
  idarea: number;
  area: string;
  modalidad: string;
  nservicios: number;
  monto: number;
  colorcelda: string;
  colortexto: string;
  idestado: number;
}

export interface AreasResponse {
  detalle: string;
  aarea: Area[];
  estatus: number;
  message: string;
  msystem: string;
}

export interface AreaFormData {
  area: string;
  modalidad: string;
  colorcelda: string;
  colortexto: string;
  idestado: number;
}