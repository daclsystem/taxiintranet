// Tipos para la gestión de personal
export interface Personal {
  idpersonal: number;
  tipodocumento: string;
  ndocumento: string;
  apellidos: string;
  nombres: string;
  telefono: string;
  email: string;
  emailverificador: string;
  modalidad: string;
  nservicios: number;
  monto: number;
  administrador: boolean;
  jefe: boolean;
  validador: boolean;
  credito: boolean;
  datjefe: string;
  area: string;
  centrocostos: string;
  aversion: string;
  iversion: string;
  colorcelda: string;
  colortexto: string;
  idestado: number;
  tipo: string;
  cargo: string;
}

export interface PersonalResponse {
  detalle: string;
  apersonal: Personal[];
  estatus: number;
  message: string;
  msystem: string;
}

export interface PersonalData {
  tipodocumento: string | null;
  ndocumento: string | null;
  apellidos: string | null;
  nombres: string | null;
  telefono: string | null;
  email: string | null;
  emailverificador: string | null;
  datjefe: string | null;
  area: string | null;
  centrocostos: string | null;
  administrador: boolean;
  jefe: boolean;
  validador: boolean;
  credito: boolean;
  idestado: number;
  tipo: string | null;
  cargo: string | null;
}

export interface Jefe {
  datjefe: string;
}

export interface AreaOption {
  area: string;
}

export interface CentroCostosOption {
  centrocostos: string;
}

export interface PersonalDataResponse {
  detalle: string;
  opersonaldata: PersonalData;
  apjefe: Jefe[];
  aparea: AreaOption[];
  apcentrocostos: CentroCostosOption[];
  estatus: number;
  message: string;
  msystem: string;
}

export interface PersonalFormData {
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
}