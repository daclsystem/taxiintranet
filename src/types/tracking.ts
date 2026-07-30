// Tipos para el sistema de tracking
export interface TrackingServicio {
  idservicio: number;
  fecha: string;
  hora: string;
  idestado: number;
  estado: string;
  direccionorigen: string;
  radicional: string;
  direcciondestino: string;
  npuntos: number;
  foto: string;
  nombres: string;
  telefonoprincipal: string;
  nplaca: string;
  datmovil: string;
  latitude: number;
  longitude: number;
  angulo: number;
  tipo: string;
  costototal: number;
  colorcelda: string;
  colortexto: string;
}

export interface TrackingPunto {
  item: number;
  direccion: string;
  latitude: number;
  longitude: number;
}

export interface TrackingRutaGPS {
  latitude: number;
  longitude: number;
  direccion: string;
  zona: string;
  fechor: string;
  velocidad: number;
}

export interface TrackingResponse {
  detalle: string;
  otservicio: TrackingServicio;
  aotpuntos: TrackingPunto[];
  asrutagps: TrackingRutaGPS[];
  estatus: number;
  message: string;
  msystem: string;
}

export interface RutaPoint {
  x: number; // longitude
  y: number; // latitude
}

export interface RutaResponse {
  time: number;
  distance: number;
  route: RutaPoint[];
  server: string;
  status: number;
}