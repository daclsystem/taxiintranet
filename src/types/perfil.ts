// Tipos para el perfil de usuario
export interface PerfilUsuario {
  foto: string;
  tipodocumento: string;
  ndocumento: string;
  apellidos: string;
  nombres: string;
  telefono: string;
  email: string;
  datjefe: string;
  area: string;
  centrocostos: string;
  administrador: boolean;
  jefe: boolean;
  validador: boolean;
  verificador: boolean;
  credito: boolean;
  nombrecomercial: string;
}

export interface PerfilResponse {
  detalle: string;
  operfilu: PerfilUsuario;
  estatus: number;
  message: string;
  msystem: string;
}

export interface ActualizarPasswordData {
  codigoVerificacion: string;
  nuevaPassword: string;
  confirmarPassword: string;
}