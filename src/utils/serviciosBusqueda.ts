import { SolicitudPersonal } from '../types/serviciosPersonal';

/** Búsqueda global sobre los campos principales de una solicitud. */
export const coincideBusquedaServicio = (
  s: SolicitudPersonal,
  query: string
): boolean => {
  const q = query.trim().toLowerCase();
  if (!q) return true;

  const campos = [
    String(s.idservicio),
    s.solicitante,
    s.traslado,
    s.direccionorigen,
    s.direcciondestino,
    s.rutaadicional,
    s.area,
    s.centrocostos,
    s.motivosolicitud,
    s.motivodetalle,
    s.tservicio,
    s.tipo,
    s.estado,
    String(s.costototal ?? ''),
  ];

  return campos.some((campo) => (campo || '').toLowerCase().includes(q));
};
