/**
 * Rutas reales de la intranet (aparecen en la barra de direcciones).
 * Usar siempre estas constantes — no hardcodear paths sueltos.
 */
export const PATHS = {
  root: '/',
  login: '/login',
  home: '/dashboard',
  solicitar: '/solicitar',
  misServicios: '/mis-servicios',
  historial: '/historial',
  perfil: '/perfil',
  serviciosPersonal: '/servicios-personal',
  historialPersonal: '/historial-personal',
  validarServicios: '/validar-servicios',
  verificarServicios: '/verificar-servicios',
  personal: '/personal',
  centroCostos: '/centro-costos',
  area: '/area',
} as const;

export type AppPath = (typeof PATHS)[keyof typeof PATHS];

/** id de tarjeta del dashboard → URL real */
export const MENU_PATHS: Record<string, AppPath> = {
  solicitar: PATHS.solicitar,
  'mis-servicios': PATHS.misServicios,
  historial: PATHS.historial,
  perfil: PATHS.perfil,
  'servicios-personal': PATHS.serviciosPersonal,
  'historial-personal': PATHS.historialPersonal,
  'validar-servicios': PATHS.validarServicios,
  'verificar-servicios': PATHS.verificarServicios,
  personal: PATHS.personal,
  'centro-costos': PATHS.centroCostos,
  area: PATHS.area,
};
