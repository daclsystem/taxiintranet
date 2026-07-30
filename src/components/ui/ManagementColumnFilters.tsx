import React, { useMemo } from 'react';
import {
  ColumnFilter,
  ColumnFilterValue,
  createEmptyColumnFilters,
  matchColumnFilter,
} from './ColumnFilter';
import { useColumnOrder } from './useColumnOrder';

export type ColumnMeta = {
  id: string;
  label: string;
  align?: 'left' | 'center' | 'right';
  getValue: (row: Record<string, unknown> | object) => string;
};

export const applyGenericColumnFilters = <T extends object>(
  rows: T[],
  columns: ColumnMeta[],
  filters: Record<string, ColumnFilterValue>
): T[] =>
  rows.filter((row) =>
    columns.every((col) => matchColumnFilter(col.getValue(row), filters[col.id]))
  );

interface ReorderableFilterHeadProps {
  columns: ColumnMeta[];
  columnOrder: string[];
  rows: object[];
  filters: Record<string, ColumnFilterValue>;
  onChange: (key: string, value: ColumnFilterValue) => void;
  onDragStart: (id: string) => void;
  onDragOver: (e: React.DragEvent) => void;
  onDrop: (id: string) => void;
  /** Columna fija al inicio (acciones) */
  leadingLabel?: string;
}

export const ReorderableFilterHead: React.FC<ReorderableFilterHeadProps> = ({
  columns,
  columnOrder,
  rows,
  filters,
  onChange,
  onDragStart,
  onDragOver,
  onDrop,
  leadingLabel = 'Acciones',
}) => {
  const byId = useMemo(() => {
    const map = new Map(columns.map((c) => [c.id, c]));
    return map;
  }, [columns]);

  const options = useMemo(() => {
    const map: Record<string, string[]> = {};
    columns.forEach((col) => {
      map[col.id] = rows.map((r) => col.getValue(r)).filter(Boolean);
    });
    return map;
  }, [columns, rows]);

  return (
    <tr>
      <th className="px-1.5 py-1 align-bottom bg-zinc-100/95 dark:bg-zinc-900/95 border-b border-zinc-200 dark:border-zinc-800 text-center sticky left-0 z-30">
        <div className="mb-0.5 text-[10px] font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
          {leadingLabel}
        </div>
        <div className="h-7 text-[9px] font-normal normal-case text-zinc-400 flex items-center justify-center">
          fija
        </div>
      </th>
      {columnOrder.map((id) => {
        const col = byId.get(id);
        if (!col) return null;
        return (
          <ColumnFilter
            key={id}
            columnId={id}
            draggable
            onColumnDragStart={onDragStart}
            onColumnDragOver={onDragOver}
            onColumnDrop={onDrop}
            label={col.label}
            options={options[id] || []}
            value={filters[id] || { text: '', selected: [] }}
            onChange={(v) => onChange(id, v)}
            align={col.align}
          />
        );
      })}
    </tr>
  );
};

export const createFiltersFromColumns = (columns: ColumnMeta[]) =>
  createEmptyColumnFilters(columns.map((c) => c.id));

export { useColumnOrder };
