import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { AlertTriangle, HelpCircle, Trash2, Loader2, X } from 'lucide-react';

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
  isLoading?: boolean;
  type?: 'info' | 'warning' | 'danger';
}

/**
 * Diálogo de confirmación centrado en el viewport (portal a body).
 */
export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  title,
  message,
  confirmText,
  cancelText = 'Cancelar',
  onConfirm,
  onCancel,
  isLoading = false,
  type = 'info',
}) => {
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isLoading) onCancel();
    };
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [isOpen, isLoading, onCancel]);

  if (!isOpen || typeof document === 'undefined') return null;

  const styles = {
    info: {
      icon: HelpCircle,
      wrap: 'bg-amber-500/15 text-amber-600 dark:text-amber-400',
      btn: 'bg-zinc-900 hover:bg-zinc-800 dark:bg-amber-500 dark:hover:bg-amber-400 dark:text-zinc-950',
    },
    warning: {
      icon: AlertTriangle,
      wrap: 'bg-amber-500/15 text-amber-600 dark:text-amber-400',
      btn: 'bg-amber-600 hover:bg-amber-500 text-white',
    },
    danger: {
      icon: Trash2,
      wrap: 'bg-red-500/15 text-red-600 dark:text-red-400',
      btn: 'bg-red-600 hover:bg-red-500 text-white',
    },
  }[type];

  const Icon = styles.icon;

  return createPortal(
    <div className="fixed inset-0 z-[70]">
      <div
        className="absolute inset-0 bg-zinc-950/60 backdrop-blur-sm"
        onClick={!isLoading ? onCancel : undefined}
      />
      <div className="absolute inset-0 flex items-center justify-center p-4 pointer-events-none">
        <div
          className="pointer-events-auto relative w-full max-w-md rounded-2xl border border-zinc-200 dark:border-zinc-800
            bg-white dark:bg-zinc-900 shadow-2xl overflow-hidden"
          role="dialog"
          aria-modal="true"
          aria-labelledby="confirm-dialog-title"
        >
          <button
            type="button"
            onClick={onCancel}
            disabled={isLoading}
            className="absolute right-3 top-3 rounded-xl p-2 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700
              dark:hover:bg-zinc-800 dark:hover:text-zinc-200 disabled:opacity-40"
            aria-label="Cerrar"
          >
            <X className="h-4 w-4" />
          </button>

          <div className="px-6 pt-7 pb-6 sm:px-8">
            <div className={`mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl ${styles.wrap}`}>
              <Icon className="h-7 w-7" />
            </div>

            <h3
              id="confirm-dialog-title"
              className="text-center font-display text-xl font-semibold tracking-tight text-zinc-900 dark:text-white"
            >
              {title}
            </h3>
            <p className="mt-2 text-center text-sm leading-relaxed text-zinc-500 dark:text-zinc-400">
              {message}
            </p>

            <div className="mt-7 grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={onCancel}
                disabled={isLoading}
                className="h-11 rounded-xl border border-zinc-200 dark:border-zinc-700 text-sm font-semibold
                  text-zinc-700 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-800
                  transition-colors disabled:opacity-50"
              >
                {cancelText}
              </button>
              <button
                type="button"
                onClick={onConfirm}
                disabled={isLoading}
                className={`h-11 rounded-xl text-sm font-semibold text-white transition-colors
                  disabled:opacity-50 flex items-center justify-center ${styles.btn}`}
              >
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : confirmText}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};
