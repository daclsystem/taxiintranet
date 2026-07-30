// Tipos para el sistema de vales
export interface ValeConfiguracion {
  emailorigen: string;
  emailpuerto: number;
  emailhost: string;
  emailusuariocredencial: string;
  emailcontrasenacredencial: string;
}

export interface ValeServicio {
  fecha: string;
  hora: string;
  nombrecomercial: string;
  solicitante: string;
  personal: string;
  area: string;
  centrocostos: string;
  motivosolicitud: string;
  motivodetalle: string;
  direccionorigen: string;
  ruta: string;
  direcciondestino: string;
  subtotal: number;
  peaje: number;
  parqueo: number;
  costototal: number;
  tipo: string;
  fechorproceso: string;
  fechorfinalizado: string;
  movil: string;
  foto: string;
  nombres: string;
  nplaca: string;
  datmovil: string;
  mapaurl: string;
  idestado: number;
  estado: string;
  colorcelda: string;
  colortexto: string;
  npuntos: number;
  idservicio: number;
}

export interface ValeEmail {
  email: string;
}

export interface ValeResponse {
  detalle: string;
  ovconfiguracion: ValeConfiguracion;
  ovservicio: ValeServicio;
  avemail: ValeEmail[];
  estatus: number;
  message: string;
  msystem: string;
}