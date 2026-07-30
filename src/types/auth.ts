// Tipos para la autenticación
export interface LoginByEmailData {
  email: string;
  password: string;
}

export interface LoginByPhoneData {
  telefono: string;
}

export interface VerifyCodeData {
  telefono: string;
  codigo: string;
  vapp: string;
  notificacion: string;
  plataforma: string;
}

export interface CodigoResponse {
  wsmensaje: string;
  wspurl: string;
  wspinstancia: string;
  wspkey: string;
  codigo: string;
  estatus: number;
  message: string;
  msystem: string;
}

export interface AccesoResponse {
  idpersonal: number;
  idcliente: number;
  key: string | null;
  estatus: number;
  message: string;
  msystem: string;
}

export interface RecuperarPasswordResponse {
  idpersonal: number;
  estatus: number;
  message: string;
  msystem: string;
}

export interface ActualizarPasswordResponse {
  estatus: number;
  message: string;
  msystem: string;
}

export interface CambiarContrasenaData {
  idpersonal: number;
  condicion: number;
  contrasena: string;
}

export interface CambiarContrasenaResponse {
  estatus: number;
  message: string;
  msystem: string;
}

export interface UserSession {
  idpersonal: number;
  idcliente: number;
  key: string;
}

export type LoginMethod = 'email' | 'phone';
export type AuthStep = 'login' | 'verify-code';