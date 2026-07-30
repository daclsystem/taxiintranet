import React from 'react';
import { SolicitudPersonal } from '../../types/serviciosPersonal';
import { SERVICIOS_FILTER_KEYS, ServiciosFilterKey } from './ServiciosColumnFilters';
import { useColumnOrder } from './useColumnOrder';

const formatearMoneda = (monto: number) =>
  new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN' }).format(monto || 0);

const limpiarTexto = (texto: string) => (texto || '').replace(/<[^>]*>/g, '');

const obtenerColorEstado = (idestado: number) => {
  const map: Record<number, { bg: string; text: string }> = {
    7: { bg: 'bg-amber-100 dark:bg-amber-900/40', text: 'text-amber-800 dark:text-amber-200' },
    8: { bg: 'bg-sky-100 dark:bg-sky-900/40', text: 'text-sky-800 dark:text-sky-200' },
    9: { bg: 'bg-sky-100 dark:bg-sky-900/40', text: 'text-sky-800 dark:text-sky-200' },
    10: { bg: 'bg-sky-100 dark:bg-sky-900/40', text: 'text-sky-800 dark:text-sky-200' },
    11: { bg: 'bg-sky-100 dark:bg-sky-900/40', text: 'text-sky-800 dark:text-sky-200' },
    12: { bg: 'bg-emerald-100 dark:bg-emerald-900/40', text: 'text-emerald-800 dark:text-emerald-200' },
    13: { bg: 'bg-emerald-100 dark:bg-emerald-900/40', text: 'text-emerald-800 dark:text-emerald-200' },
    14: { bg: 'bg-red-100 dark:bg-red-900/40', text: 'text-red-800 dark:text-red-200' },
  };
  return map[idestado] || { bg: 'bg-zinc-100 dark:bg-zinc-800', text: 'text-zinc-700 dark:text-zinc-300' };
};

export const renderServiciosCell = (key: ServiciosFilterKey, s: SolicitudPersonal): React.ReactNode => {
  switch (key) {
    case 'servicio':
      return (
        <>
          <div className="font-mono text-zinc-900 dark:text-white">#{s.idservicio}</div>
          <div className="text-xs text-zinc-500">{s.tservicio}</div>
        </>
      );
    case 'fecha':
      return (
        <>
          <div className="text-zinc-900 dark:text-white">{s.fecha}</div>
          <div className="text-xs text-zinc-500">{s.hora}</div>
        </>
      );
    case 'solicitante':
      return <div className="max-w-[150px] truncate" title={s.solicitante}>{s.solicitante}</div>;
    case 'traslado':
      return (
        <div className="max-w-[150px] truncate" title={limpiarTexto(s.traslado)}>
          {limpiarTexto(s.traslado)}
        </div>
      );
    case 'origen':
      return (
        <div className="max-w-[200px] truncate text-zinc-500" title={s.direccionorigen}>
          {s.direccionorigen}
        </div>
      );
    case 'rutaAdicional':
      return <div className="max-w-[150px] truncate text-zinc-500">{s.rutaadicional || '—'}</div>;
    case 'destino':
      return (
        <div className="max-w-[200px] truncate text-zinc-500" title={s.direcciondestino}>
          {s.direcciondestino}
        </div>
      );
    case 'area':
      return (
        <div className="max-w-[120px] truncate text-zinc-500">
          {s.area && s.area !== '0' ? s.area : '—'}
        </div>
      );
    case 'centroCostos':
      return (
        <div className="max-w-[120px] truncate text-zinc-500">
          {s.centrocostos && s.centrocostos !== '0' ? s.centrocostos : '—'}
        </div>
      );
    case 'motivo':
      return <div className="max-w-[120px] truncate text-zinc-500">{s.motivosolicitud || '—'}</div>;
    case 'detalleMotivo':
      return <div className="max-w-[150px] truncate text-zinc-500">{s.motivodetalle || '—'}</div>;
    case 'tipo':
      return <div className="text-center whitespace-nowrap">{s.tipo}</div>;
    case 'costo':
      return (
        <div className="text-right whitespace-nowrap font-semibold text-zinc-900 dark:text-white">
          {formatearMoneda(s.costototal)}
        </div>
      );
    case 'estado': {
      const color = obtenerColorEstado(s.idestado);
      return (
        <div className="text-center whitespace-nowrap">
          <span className={`inline-flex items-center px-2 py-0 rounded-full text-[11px] font-medium ${color.bg} ${color.text}`}>
            {s.estado}
          </span>
        </div>
      );
    }
    default:
      return null;
  }
};

export const useServiciosColumnOrder = (storageKey: string) =>
  useColumnOrder(storageKey, SERVICIOS_FILTER_KEYS);

interface ServiciosRowCellsProps {
  solicitud: SolicitudPersonal;
  columnOrder: ServiciosFilterKey[];
  acciones?: React.ReactNode;
}

export const ServiciosRowCells: React.FC<ServiciosRowCellsProps> = ({
  solicitud,
  columnOrder,
  acciones,
}) => (
  <>
    {acciones != null && (
      <td className="whitespace-nowrap sticky left-0 bg-white dark:bg-zinc-950 z-10">{acciones}</td>
    )}
    {columnOrder.map((key) => (
      <td key={key} className="whitespace-nowrap">
        {renderServiciosCell(key, solicitud)}
      </td>
    ))}
  </>
);

export const serviciosColSpan = (showAcciones: boolean, orderLength: number) =>
  (showAcciones ? 1 : 0) + orderLength;
