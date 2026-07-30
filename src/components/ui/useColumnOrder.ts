import { useCallback, useRef, useState, type DragEvent } from 'react';

const loadOrder = <T extends string>(key: string, defaults: readonly T[]): T[] => {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return [...defaults];
    const parsed = JSON.parse(raw) as string[];
    if (!Array.isArray(parsed)) return [...defaults];
    const valid = parsed.filter((id): id is T => defaults.includes(id as T));
    const missing = defaults.filter((id) => !valid.includes(id));
    return [...valid, ...missing];
  } catch {
    return [...defaults];
  }
};

/**
 * Orden de columnas persistente + drag & drop entre encabezados.
 */
export function useColumnOrder<T extends string>(storageKey: string, defaultOrder: readonly T[]) {
  const [order, setOrder] = useState<T[]>(() => loadOrder(storageKey, defaultOrder));
  const dragFrom = useRef<T | null>(null);

  const persist = useCallback(
    (next: T[]) => {
      setOrder(next);
      try {
        localStorage.setItem(storageKey, JSON.stringify(next));
      } catch {
        // ignore
      }
    },
    [storageKey]
  );

  const onDragStart = useCallback((id: T) => {
    dragFrom.current = id;
  }, []);

  const onDragOver = useCallback((e: DragEvent) => {
    e.preventDefault();
  }, []);

  const onDrop = useCallback(
    (targetId: T) => {
      const from = dragFrom.current;
      dragFrom.current = null;
      if (!from || from === targetId) return;
      setOrder((prev) => {
        const next = [...prev];
        const fromIdx = next.indexOf(from);
        const toIdx = next.indexOf(targetId);
        if (fromIdx < 0 || toIdx < 0) return prev;
        next.splice(fromIdx, 1);
        next.splice(toIdx, 0, from);
        try {
          localStorage.setItem(storageKey, JSON.stringify(next));
        } catch {
          // ignore
        }
        return next;
      });
    },
    [storageKey]
  );

  const resetOrder = useCallback(() => {
    persist([...defaultOrder]);
  }, [defaultOrder, persist]);

  return { order, onDragStart, onDragOver, onDrop, resetOrder };
}
