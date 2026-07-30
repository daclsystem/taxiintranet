import React, { useEffect, useId } from 'react';
import { createPortal } from 'react-dom';
import { Loader2, X } from 'lucide-react';

export type AppModalSize = 'sm' | 'md' | 'lg' | 'xl' | 'drawer';

export interface AppModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  size?: AppModalSize;
  /** Prevent close while loading */
  busy?: boolean;
  /** Render above other overlays (e.g. Vale popup) */
  priority?: boolean;
  /** Optional form id if footer submit buttons use form= */
  formId?: string;
  className?: string;
}

export const modalFieldClass =
  'w-full h-10 px-3 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-sm text-zinc-900 dark:text-white placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-amber-500/40 focus:border-amber-500';

export const modalLabelClass =
  'block text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1';

export const modalSectionTitleClass =
  'text-[11px] font-semibold uppercase tracking-wider text-zinc-500 mb-2';

const sizeClasses: Record<Exclude<AppModalSize, 'drawer'>, string> = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-2xl',
};

export function AppModal({
  open,
  onClose,
  title,
  subtitle,
  children,
  footer,
  size = 'md',
  busy = false,
  priority = false,
  className = '',
}: AppModalProps): JSX.Element | null {
  const titleId = useId();
  const zClass = priority ? 'z-[80]' : 'z-[60]';

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !busy) onClose();
    };
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [open, busy, onClose]);

  if (!open || typeof document === 'undefined') return null;

  const handleBackdropClick = () => {
    if (!busy) onClose();
  };

  const panelBase =
    'border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 shadow-2xl flex flex-col';

  const content =
    size === 'drawer' ? (
      <div className={`fixed inset-0 ${zClass}`}>
        <div
          className="absolute inset-0 bg-zinc-950/55 backdrop-blur-sm"
          onClick={handleBackdropClick}
          aria-hidden="true"
        />
        <div
          className={`absolute inset-y-0 right-0 flex w-full max-w-md flex-col sm:max-w-lg ${panelBase} rounded-l-2xl ${className}`}
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
        >
          <ModalHeader
            titleId={titleId}
            title={title}
            subtitle={subtitle}
            onClose={onClose}
            busy={busy}
          />
          <div className="min-h-0 flex-1 overflow-y-auto p-4">{children}</div>
          {footer != null && (
            <div className="shrink-0 border-t border-zinc-200 p-3 dark:border-zinc-800">
              <div className="flex justify-end gap-2">{footer}</div>
            </div>
          )}
        </div>
      </div>
    ) : (
      <div className={`fixed inset-0 ${zClass}`}>
        <div
          className="absolute inset-0 bg-zinc-950/55 backdrop-blur-sm"
          onClick={handleBackdropClick}
          aria-hidden="true"
        />
        {/* Centrado real en el viewport (no depende del layout padre) */}
        <div className="absolute inset-0 flex items-center justify-center p-4 pointer-events-none">
          <div
            className={`pointer-events-auto relative flex w-full max-h-[min(90vh,720px)] flex-col rounded-2xl ${sizeClasses[size]} ${panelBase} ${className}`}
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
          >
            <ModalHeader
              titleId={titleId}
              title={title}
              subtitle={subtitle}
              onClose={onClose}
              busy={busy}
            />
            <div className="min-h-0 overflow-y-auto p-4">{children}</div>
            {footer != null && (
              <div className="shrink-0 border-t border-zinc-200 p-3 dark:border-zinc-800">
                <div className="flex justify-end gap-2">{footer}</div>
              </div>
            )}
          </div>
        </div>
      </div>
    );

  return createPortal(content, document.body);
}

function ModalHeader({
  titleId,
  title,
  subtitle,
  onClose,
  busy,
}: {
  titleId: string;
  title: string;
  subtitle?: string;
  onClose: () => void;
  busy: boolean;
}) {
  return (
    <div className="shrink-0 border-b border-zinc-200 bg-white px-4 py-3 dark:border-zinc-800 dark:bg-zinc-950">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2
            id={titleId}
            className="font-display text-base font-semibold text-zinc-900 dark:text-white"
          >
            {title}
          </h2>
          {subtitle && (
            <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">{subtitle}</p>
          )}
        </div>
        <button
          type="button"
          onClick={onClose}
          disabled={busy}
          className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-zinc-500 hover:bg-zinc-100 hover:text-zinc-700 disabled:opacity-40 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
          aria-label="Cerrar"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

export function ModalCancelButton({
  onClick,
  disabled,
  children = 'Cancelar',
}: {
  onClick: () => void;
  disabled?: boolean;
  children?: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="inline-flex h-9 items-center justify-center rounded-lg border border-zinc-200 px-4 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50 disabled:opacity-50 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800"
    >
      {children}
    </button>
  );
}

export function ModalPrimaryButton({
  children,
  type = 'button',
  form,
  disabled,
  loading,
  onClick,
  className = '',
}: {
  children: React.ReactNode;
  type?: 'button' | 'submit';
  form?: string;
  disabled?: boolean;
  loading?: boolean;
  onClick?: () => void;
  className?: string;
}) {
  return (
    <button
      type={type}
      form={form}
      onClick={onClick}
      disabled={disabled || loading}
      className={`inline-flex h-9 items-center justify-center gap-2 rounded-lg bg-amber-500 px-4 text-sm font-semibold text-zinc-950 transition-colors hover:bg-amber-400 disabled:opacity-50 ${className}`}
    >
      {loading && <Loader2 className="h-4 w-4 animate-spin" />}
      {children}
    </button>
  );
}
