import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ChevronDown, GripVertical, Search } from 'lucide-react';

export type ColumnFilterValue = {
  text: string;
  selected: string[];
};

interface ColumnFilterProps {
  label: string;
  options: string[];
  value: ColumnFilterValue;
  onChange: (value: ColumnFilterValue) => void;
  align?: 'left' | 'center' | 'right';
  placeholder?: string;
  /** Permite arrastrar la columna para reordenar */
  columnId?: string;
  draggable?: boolean;
  onColumnDragStart?: (columnId: string) => void;
  onColumnDragOver?: (e: React.DragEvent) => void;
  onColumnDrop?: (columnId: string) => void;
}

const emptyFilter = (): ColumnFilterValue => ({ text: '', selected: [] });

export const isColumnFilterActive = (v?: ColumnFilterValue): boolean =>
  !!v && (!!v.text.trim() || v.selected.length > 0);

export const hasAnyColumnFilter = (
  filters: Record<string, ColumnFilterValue>
): boolean => Object.values(filters).some((v) => isColumnFilterActive(v));

export const matchColumnFilter = (
  cellValue: string | number | null | undefined,
  filter?: ColumnFilterValue
): boolean => {
  if (!filter || !isColumnFilterActive(filter)) return true;
  const raw = (cellValue ?? '').toString();
  const normalized = raw.toLowerCase();

  if (filter.selected.length > 0) {
    return filter.selected.some((s) => s.toLowerCase() === normalized || s === raw);
  }
  if (filter.text.trim()) {
    return normalized.includes(filter.text.trim().toLowerCase());
  }
  return true;
};

/**
 * Filtro de columna estilo Excel: input + menú con checkboxes.
 */
export const ColumnFilter: React.FC<ColumnFilterProps> = ({
  label,
  options,
  value,
  onChange,
  align = 'left',
  placeholder = 'Filtrar...',
  columnId,
  draggable = false,
  onColumnDragStart,
  onColumnDragOver,
  onColumnDrop,
}) => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [menuPos, setMenuPos] = useState<{ top: number; left: number } | null>(null);
  const rootRef = useRef<HTMLTableCellElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const updatePos = () => {
      const btn = rootRef.current?.querySelector('button');
      const rect = (btn || rootRef.current)?.getBoundingClientRect();
      if (!rect) return;
      const width = 288;
      const left = Math.min(rect.left, window.innerWidth - width - 8);
      setMenuPos({ top: rect.bottom + 4, left: Math.max(8, left) });
    };
    updatePos();
    const onDoc = (e: MouseEvent) => {
      const t = e.target as Node;
      if (!rootRef.current?.contains(t) && !menuRef.current?.contains(t)) {
        setOpen(false);
        setSearch('');
      }
    };
    window.addEventListener('scroll', updatePos, true);
    window.addEventListener('resize', updatePos);
    document.addEventListener('mousedown', onDoc);
    return () => {
      window.removeEventListener('scroll', updatePos, true);
      window.removeEventListener('resize', updatePos);
      document.removeEventListener('mousedown', onDoc);
    };
  }, [open]);

  const filteredOptions = useMemo(() => {
    const q = search.trim().toLowerCase();
    const uniq = Array.from(new Set(options.filter((o) => o != null && String(o).trim() !== '')));
    uniq.sort((a, b) => a.localeCompare(b, 'es'));
    if (!q) return uniq;
    return uniq.filter((o) => o.toLowerCase().includes(q));
  }, [options, search]);

  const alignClass =
    align === 'center' ? 'text-center' : align === 'right' ? 'text-right' : 'text-left';

  const toggle = (opt: string) => {
    const selected = value.selected.includes(opt)
      ? value.selected.filter((s) => s !== opt)
      : [...value.selected, opt];
    onChange({ ...value, selected });
  };

  const selectAll = () => {
    onChange({ ...value, selected: [...filteredOptions] });
  };

  const clear = () => {
    onChange(emptyFilter());
    setSearch('');
  };

  const active = isColumnFilterActive(value);

  return (
    <th
      ref={rootRef}
      draggable={draggable && !!columnId}
      onDragStart={() => columnId && onColumnDragStart?.(columnId)}
      onDragOver={onColumnDragOver}
      onDrop={() => columnId && onColumnDrop?.(columnId)}
      className={`relative px-1.5 py-1 align-bottom ${alignClass} bg-zinc-100/95 dark:bg-zinc-900/95 border-b border-zinc-200 dark:border-zinc-800 ${
        draggable ? 'cursor-grab active:cursor-grabbing' : ''
      }`}
    >
      <div className="mb-0.5 flex items-center gap-0.5 text-[10px] font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 whitespace-nowrap">
        {draggable && (
          <span title="Arrastra para mover columna" className="inline-flex">
            <GripVertical className="w-3 h-3 text-zinc-400 flex-shrink-0" />
          </span>
        )}
        <span>{label}</span>
      </div>
      <div className="flex items-center gap-0.5 min-w-[6.5rem]">
        <input
          type="text"
          value={value.text}
          onChange={(e) => onChange({ ...value, text: e.target.value, selected: [] })}
          placeholder={placeholder}
          onMouseDown={(e) => e.stopPropagation()}
          draggable={false}
          className={`w-full h-7 rounded-md border px-1.5 text-[11px]
            bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100
            border-zinc-200 dark:border-zinc-700
            focus:outline-none focus:ring-2 focus:ring-amber-500/25 focus:border-amber-500
            ${active ? 'border-amber-500/50' : ''}`}
        />
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          onMouseDown={(e) => e.stopPropagation()}
          className={`inline-flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-md border transition-colors
            ${
              open || value.selected.length > 0
                ? 'border-amber-500/40 bg-amber-500/10 text-amber-600 dark:text-amber-400'
                : 'border-zinc-200 dark:border-zinc-700 text-zinc-500 hover:bg-zinc-50 dark:hover:bg-zinc-800'
            }`}
          title={`Filtrar ${label}`}
        >
          <ChevronDown className={`w-3 h-3 transition-transform ${open ? 'rotate-180' : ''}`} />
        </button>
      </div>

      {open && menuPos && (
        <div
          ref={menuRef}
          style={{ top: menuPos.top, left: menuPos.left }}
          className="fixed z-[80] w-72 rounded-xl border border-zinc-700 bg-zinc-900 text-zinc-100 shadow-2xl"
        >
          <div className="p-2 border-b border-zinc-700">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-400" />
              <input
                autoFocus
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={`Buscar ${label}...`}
                className="w-full h-9 rounded-lg bg-zinc-800 border border-zinc-700 pl-8 pr-3 text-xs text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-amber-500/30"
              />
            </div>
          </div>
          <div className="max-h-56 overflow-y-auto p-1.5">
            {filteredOptions.length === 0 ? (
              <p className="px-2 py-3 text-xs text-zinc-400 text-center">Sin opciones</p>
            ) : (
              filteredOptions.map((opt) => (
                <label
                  key={opt}
                  className="flex items-start gap-2 rounded-lg px-2 py-1.5 text-xs hover:bg-zinc-800 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={value.selected.includes(opt)}
                    onChange={() => toggle(opt)}
                    className="mt-0.5 rounded border-zinc-500 text-amber-500 focus:ring-amber-500/30"
                  />
                  <span className="leading-snug break-words">{opt}</span>
                </label>
              ))
            )}
          </div>
          <div className="flex items-center gap-1.5 border-t border-zinc-700 p-2">
            <button
              type="button"
              onClick={selectAll}
              className="flex-1 h-8 rounded-lg text-xs font-medium bg-zinc-800 hover:bg-zinc-700 transition-colors"
            >
              Todos
            </button>
            <button
              type="button"
              onClick={clear}
              className="flex-1 h-8 rounded-lg text-xs font-medium bg-zinc-800 hover:bg-zinc-700 transition-colors"
            >
              Limpiar
            </button>
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                setSearch('');
              }}
              className="flex-1 h-8 rounded-lg text-xs font-semibold bg-amber-500 text-zinc-950 hover:bg-amber-400 transition-colors"
            >
              Cerrar
            </button>
          </div>
        </div>
      )}
    </th>
  );
};

export const createEmptyColumnFilters = <T extends string>(
  keys: readonly T[]
): Record<T, ColumnFilterValue> => {
  const result = {} as Record<T, ColumnFilterValue>;
  keys.forEach((k) => {
    result[k] = emptyFilter();
  });
  return result;
};
