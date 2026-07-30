// Tipos para la solicitud de servicio
export interface ConfiguracionSolicitudResponse {
  detalle: string;
  aipagos: TipoPago[];
  aimovil: TipoMovil[];
  aicentrocostos: CentroCosto[];
  aiarea: Area[];
  aimotivo: Motivo[];
  aiconfiguracion: ConfiguracionOpcion[];
  airutatemporal: any[];
  oirutatemporal: RutaTemporal;
  aipersonal: Personal[];
  oidatos: DatosUsuario;
  estatus: number;
  message: string;
  msystem: string;
}

export interface TipoPago {
  tipo: string;
  logo: string;
}

export interface TipoMovil {
  tipo: string;
  foto: string;
  monto: number;
}

export interface CentroCosto {
  centrocostos: string;
}

export interface Area {
  area: string;
}

export interface Motivo {
  motivo: string;
}

export interface ConfiguracionOpcion {
  opcion: string;
  condicion: boolean;
}

export interface RutaTemporal {
  distancia: number;
  tiempo: number;
  costo: number;
}

export interface Personal {
  idpersonal: number;
  personal: string;
}

export interface DatosUsuario {
  area: string;
  centrocostos: string;
  fruc: string;
  femail: string;
  personal: string;
  courier: number;
}

export interface SolicitudFormData {
  origen: string;
  destino: string;
  tipoServicio: 'inmediato' | 'reserva';
  fechaReserva?: string;
  horaReserva?: string;
  tipoPago: string;
  tipoMovil: string;
  modoUsuario: string;
  tipoServicioDetalle: string;
  observaciones: string;
  centroCostos?: string;
  area?: string;
  motivo?: string;
  detalleMotivo?: string;
  personal?: number;
}

export interface Ubicacion {
  lat: number;
  lng: number;
  direccion: string;
}

export interface Favorito {
  titulo: string;
  direccion: string;
  referencia: string;
  latitude: number;
  longitude: number;
  lf: string;
  idfavorito: number;
}

export interface FavoritosResponse {
  detalle: string;
  aifavoritos: Favorito[];
  estatus: number;
  message: string;
  msystem: string;
}

export interface Coincidencia {
  direccion: string;
  distrito: string;
  lat: number;
  lng: number;
}

export interface BusquedaResponse {
  coincidencias: Coincidencia[];
}

export interface SolicitudRequest {
  idcliente: string;
  tservicio: string;
  idpersonal: number;
  solicitante: string;
  centrocostos: string;
  area: string;
  motivo: string;
  motivodetalle: string;
  personalt: string;
  formas: string;
  fecha: string;
  hora: string;
  pago: string;
  movil: string;
  subtotal: number;
  costototal: number;
  zorigen: string;
  latitudeorigen: number;
  longitudeorigen: number;
  direccionorigen: string;
  zdestino: string;
  latitudedestino: number;
  longitudedestino: number;
  direcciondestino: string;
  distancia: number;
  tiempo: number;
  courier: number;
  observaciones: string;
  ipproceso: string;
  operador: string;
}

export interface SolicitudResponse {
  idreserva: number;
  tclientea: string;
  tclientei: string;
  ttoken: string;
  wsmensaje: string;
  wstelefono: string;
  wspurl: string;
  wspinstancia: string;
  wspkey: string;
  tconductor: string;
  wsmensajev: string;
  wstelefonov: string;
  vservicio: boolean;
  vemail: boolean;
  estatus: number;
  message: string;
  msystem: string;
}