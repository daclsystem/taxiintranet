// Tipos para la gestión de centros de costos
export interface CentroCostos {
  idcentrocostos: number;
  centrocostos: string;
  modalidad: string;
  nservicios: number;
  monto: number;
  colorcelda: string;
  colortexto: string;
  idestado: number;
}

export interface CentroCostosResponse {
  detalle: string;
  acentrocostos: CentroCostos[];
  estatus: number;
  message: string;
  msystem: string;
}

export interface CentroCostosFormData {
  centrocostos: string;
  modalidad: string;
  colorcelda: string;
  colortexto: string;
  idestado: number;
}