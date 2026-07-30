// Tipos para el dashboard y API principal
export interface OaiPrincipal {
  foto: string;
  datcliente: string;
  telefono: string;
  idcliente: number;
  nombrecomercial: string;
  credito: boolean;
  administrador: boolean;
  condicion: boolean;
  idestado: number;
  jefe: boolean;
  validador: boolean;
  verificador: boolean;
}

export interface MesAnio {
  mesanio: string;
}

export interface PrincipalResponse {
  detalle: string;
  oaiprincipal: OaiPrincipal;
  aaimesanio: MesAnio[];
  aaihistoriald: any[];
  aaiprocesod: any[];
  estatus: number;
  message: string;
  msystem: string;
}

export interface MenuOption {
  id: string;
  titulo: string;
  descripcion: string;
  icono: any;
  color: string;
  categoria: 'principal' | 'admin' | 'validador' | 'verificador' | 'jefe' | 'contacto';
}

export interface HistorialServicio {
  idservicio: number;
  tservicio: string;
  hora: string;
  fecha: string;
  direccionorigen: string;
  tipo: string;
  costototal: number;
  estado: string;
  colorcelda: string;
  colortexto: string;
}

export interface ReporteData {
  dia: number;
  total: number;
  cuenta: number;
}

export interface ReporteResponse {
  detalle: string;
  areported: ReporteData[];
  estatus: number;
  message: string;
  msystem: string;
}