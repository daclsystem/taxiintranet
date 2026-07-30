import React, { useMemo } from 'react';
import { SolicitudPersonal } from '../../types/serviciosPersonal';
import {
  ColumnFilter,
  ColumnFilterValue,
  createEmptyColumnFilters,
  matchColumnFilter,
} from './ColumnFilter';

export const SERVICIOS_FILTER_KEYS = [
  'servicio',
  'fecha',
  'solicitante',
  'traslado',
  'origen',
  'rutaAdicional',
  'destino',
  'area',
  'centroCostos',
  'motivo',
  'detalleMotivo',
  'tipo',
  'costo',
  'estado',
] as const;

export type ServiciosFilterKey = (typeof SERVICIOS_FILTER_KEYS)[number];
export type ServiciosColumnFiltersState = Record<ServiciosFilterKey, ColumnFilterValue>;

export const createServiciosColumnFilters = (): ServiciosColumnFiltersState =>
  createEmptyColumnFilters(SERVICIOS_FILTER_KEYS);

export const cellValueForServicio = (s: SolicitudPersonal, key: ServiciosFilterKey): string => {
  switch (key) {
    case 'servicio':
      return String(s.idservicio);
    case 'fecha':
      return `${s.fecha} ${s.hora}`.trim();
    case 'solicitante':
      return s.solicitante || '';
    case 'traslado':
      return (s.traslado || '').replace(/<[^>]*>/g, '');
    case 'origen':
      return s.direccionorigen || '';
    case 'rutaAdicional':
      return s.rutaadicional || '';
    case 'destino':
      return s.direcciondestino || '';
    case 'area':
      return s.area && s.area !== '0' ? s.area : '';
    case 'centroCostos':
      return s.centrocostos && s.centrocostos !== '0' ? s.centrocostos : '';
    case 'motivo':
      return s.motivosolicitud || '';
    case 'detalleMotivo':
      return s.motivodetalle || '';
    case 'tipo':
      return s.tipo || s.tservicio || '';
    case 'costo':
      return String(s.costototal ?? '');
    case 'estado':
      return s.estado || '';
    default:
      return '';
  }
};

export const applyServiciosColumnFilters = (
  rows: SolicitudPersonal[],
  filters: ServiciosColumnFiltersState
): SolicitudPersonal[] =>
  rows.filter((s) =>
    SERVICIOS_FILTER_KEYS.every((key) => matchColumnFilter(cellValueForServicio(s, key), filters[key]))
  );

const COLUMN_META: Record<
  ServiciosFilterKey,
  { label: string; align?: 'left' | 'center' | 'right' }
> = {
  servicio: { label: 'Servicio' },
  fecha: { label: 'Fecha/Hora' },
  solicitante: { label: 'Solicitante' },
  traslado: { label: 'Traslado' },
  origen: { label: 'Origen' },
  rutaAdicional: { label: 'Ruta adicional' },
  destino: { label: 'Destino' },
  area: { label: 'Área' },
  centroCostos: { label: 'Centro costos' },
  motivo: { label: 'Motivo' },
  detalleMotivo: { label: 'Detalle' },
  tipo: { label: 'Tipo', align: 'center' },
  costo: { label: 'Costo', align: 'right' },
  estado: { label: 'Estado', align: 'center' },
};

interface ServiciosColumnFiltersHeadProps {
  rows: SolicitudPersonal[];
  filters: ServiciosColumnFiltersState;
  onChange: (key: ServiciosFilterKey, value: ColumnFilterValue) => void;
  showAcciones?: boolean;
  columnOrder: ServiciosFilterKey[];
  onDragStart: (id: ServiciosFilterKey) => void;
  onDragOver: (e: React.DragEvent) => void;
  onDrop: (id: ServiciosFilterKey) => void;
}

/**
 * Encabezados con filtro por columna + arrastrar para reordenar.
 */
export const ServiciosColumnFiltersHead: React.FC<ServiciosColumnFiltersHeadProps> = ({
  rows,
  filters,
  onChange,
  showAcciones = true,
  columnOrder,
  onDragStart,
  onDragOver,
  onDrop,
}) => {
  const options = useMemo(() => {
    const map = {} as Record<ServiciosFilterKey, string[]>;
    SERVICIOS_FILTER_KEYS.forEach((key) => {
      map[key] = rows.map((s) => cellValueForServicio(s, key)).filter(Boolean);
    });
    return map;
  }, [rows]);

  return (
    <tr>
      {showAcciones && (
        <th className="px-1.5 py-1 align-bottom bg-zinc-100/95 dark:bg-zinc-900/95 border-b border-zinc-200 dark:border-zinc-800 text-center sticky left-0 z-30">
          <div className="mb-0.5 text-[10px] font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
            Acciones
          </div>
          <div className="h-7 text-[9px] font-normal normal-case text-zinc-400 flex items-center justify-center">
            fija
          </div>
        </th>
      )}
      {columnOrder.map((key) => {
        const meta = COLUMN_META[key];
        return (
          <ColumnFilter
            key={key}
            columnId={key}
            draggable
            onColumnDragStart={(id) => onDragStart(id as ServiciosFilterKey)}
            onColumnDragOver={onDragOver}
            onColumnDrop={(id) => onDrop(id as ServiciosFilterKey)}
            label={meta.label}
            options={options[key]}
            value={filters[key]}
            onChange={(v) => onChange(key, v)}
            align={meta.align}
          />
        );
      })}
    </tr>
  );
};
