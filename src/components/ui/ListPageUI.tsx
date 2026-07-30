import React from 'react';
import {
  ArrowLeft,
  Download,
  Inbox,
  Loader2,
  Plus,
  RefreshCw,
  Search,
  X,
  LucideIcon,
} from 'lucide-react';
import { ThemeToggle } from '../ThemeToggle';

/** Marco global: ~96% ancho × ~96% alto (márgenes 2vw / 2vh) */
export const PAGE_SHELL_CLASS =
  'h-dvh flex flex-col overflow-hidden zm-dashboard-glow px-[2vw] py-[2vh]';

/** El shell ya limita a 90vw × 90vh; el contenido usa el 100% de ese marco */
const CONTENT_WIDTH = 'w-full';

/**
 * Shell para páginas sin tabla (Dashboard, Solicitar, Tracking…).
 * Mismo tamaño 90%×90% que los listados.
 */
export const AppPageShell: React.FC<{
  children: React.ReactNode;
  scrollable?: boolean;
}> = ({ children, scrollable = true }) => (
  <div className={PAGE_SHELL_CLASS}>
    <div
      className={`flex-1 min-h-0 flex flex-col w-full ${
        scrollable ? 'overflow-y-auto' : 'overflow-hidden'
      }`}
    >
      {children}
    </div>
  </div>
);

interface ListPageHeaderProps {
  title: string;
  icon: LucideIcon;
  count?: number;
  countLabel?: string;
  onVolver: () => void;
  actions?: React.ReactNode;
}

export const ListPageHeader: React.FC<ListPageHeaderProps> = ({
  title,
  icon: Icon,
  count,
  countLabel = 'servicios',
  onVolver,
  actions,
}) => (
  <header className="shrink-0 z-30 border-b border-zinc-200/80 dark:border-zinc-800/80 bg-white/85 dark:bg-zinc-950/85 backdrop-blur-xl">
    <div className={CONTENT_WIDTH}>
      <div className="flex items-center justify-between h-14 gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <button
            type="button"
            onClick={onVolver}
            className="inline-flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Volver</span>
          </button>
          <div className="h-5 w-px bg-zinc-200 dark:bg-zinc-800" />
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="inline-flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/25">
              <Icon className="w-4 h-4" />
            </span>
            <div className="min-w-0">
              <h1 className="font-display text-base font-semibold text-zinc-900 dark:text-white truncate leading-tight">
                {title}
              </h1>
              {typeof count === 'number' && (
                <p className="text-[11px] text-zinc-500 dark:text-zinc-400 leading-tight">
                  {count}{' '}
                  {count === 1
                    ? countLabel.replace(/s$/, '') || countLabel
                    : countLabel}
                </p>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {actions}
          <ThemeToggle />
        </div>
      </div>
    </div>
  </header>
);

interface ListPageActionsProps {
  onConsultar: () => void;
  onExportar?: () => void;
  onNuevo?: () => void;
  nuevoLabel?: string;
  isLoading?: boolean;
  extra?: React.ReactNode;
  title?: string;
  subtitle?: string;
}

export const ListPageActions: React.FC<ListPageActionsProps> = ({
  onConsultar,
  onExportar,
  onNuevo,
  nuevoLabel = 'Nuevo',
  isLoading,
  extra,
  title,
  subtitle,
}) => (
  <div className="shrink-0 rounded-xl border border-zinc-200/80 dark:border-zinc-800 bg-white/70 dark:bg-zinc-950/50 px-3 py-2.5 mb-3">
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0 flex flex-wrap items-center gap-x-4 gap-y-1.5">
        {(title || subtitle) && (
          <div className="min-w-0">
            {title && (
              <p className="font-display text-sm font-semibold text-zinc-900 dark:text-white leading-tight">
                {title}
              </p>
            )}
            {subtitle && (
              <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-tight">{subtitle}</p>
            )}
          </div>
        )}
        {extra && <div className="flex flex-wrap items-center gap-2">{extra}</div>}
      </div>
      <div className="flex flex-wrap items-center gap-2 sm:justify-end">
        <button
          type="button"
          onClick={onConsultar}
          disabled={isLoading}
          className="inline-flex items-center gap-2 h-9 px-3.5 rounded-lg text-sm font-semibold
            bg-zinc-900 text-white hover:bg-zinc-800
            dark:bg-amber-500 dark:text-zinc-950 dark:hover:bg-amber-400
            disabled:opacity-50 transition-colors"
        >
          {isLoading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <RefreshCw className="w-4 h-4" />
          )}
          Consultar
        </button>
        {onNuevo && (
          <button
            type="button"
            onClick={onNuevo}
            className="inline-flex items-center gap-2 h-9 px-3.5 rounded-lg text-sm font-semibold
              bg-emerald-600 text-white hover:bg-emerald-500 transition-colors"
          >
            <Plus className="w-4 h-4" />
            {nuevoLabel}
          </button>
        )}
        {onExportar && (
          <button
            type="button"
            onClick={onExportar}
            className="inline-flex items-center gap-2 h-9 px-3.5 rounded-lg text-sm font-semibold
              border border-zinc-200 dark:border-zinc-700 text-zinc-800 dark:text-zinc-100
              hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
          >
            <Download className="w-4 h-4" />
            Exportar
          </button>
        )}
      </div>
    </div>
  </div>
);

type StatTone = 'neutral' | 'active' | 'danger' | 'success';

interface ListStatCardProps {
  label: string;
  value: number | string;
  amount?: string;
  tone?: StatTone;
  icon: LucideIcon;
}

const toneStyles: Record<StatTone, string> = {
  neutral: 'text-amber-600 dark:text-amber-400 bg-amber-500/10',
  active: 'text-sky-600 dark:text-sky-400 bg-sky-500/10',
  success: 'text-emerald-600 dark:text-emerald-400 bg-emerald-500/10',
  danger: 'text-red-600 dark:text-red-400 bg-red-500/10',
};

export const ListStatCard: React.FC<ListStatCardProps> = ({
  label,
  value,
  amount,
  tone = 'neutral',
  icon: Icon,
}) => (
  <div className="rounded-xl border border-zinc-200/80 dark:border-zinc-800 bg-white/70 dark:bg-zinc-950/50 px-3 py-2.5">
    <div className="flex items-center gap-2.5">
      <div
        className={`inline-flex h-8 w-8 items-center justify-center rounded-lg ${toneStyles[tone]}`}
      >
        <Icon className="w-4 h-4" />
      </div>
      <div className="min-w-0">
        <p className="text-[10px] font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
          {label}
        </p>
        <div className="flex items-baseline gap-2">
          <p className="font-display text-xl font-semibold text-zinc-900 dark:text-white leading-none">
            {value}
          </p>
          {amount != null && (
            <p className="text-[11px] text-zinc-500 dark:text-zinc-400 truncate">{amount}</p>
          )}
        </div>
      </div>
    </div>
  </div>
);

export const ListPageShell: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className={PAGE_SHELL_CLASS}>{children}</div>
);

export const ListPageBody: React.FC<{
  children: React.ReactNode;
  /** Permite scroll del body (p. ej. Perfil). En listados dejar false para que crezca la tabla. */
  scrollable?: boolean;
}> = ({ children, scrollable = false }) => (
  <div
    className={`${CONTENT_WIDTH} flex-1 min-h-0 flex flex-col pt-3 ${
      scrollable ? 'overflow-y-auto' : 'overflow-hidden'
    }`}
  >
    {children}
  </div>
);

export const ListTableCard: React.FC<{ children: React.ReactNode; toolbar?: React.ReactNode }> = ({
  children,
  toolbar,
}) => (
  <div className="flex-1 min-h-0 flex flex-col rounded-xl border border-zinc-200/80 dark:border-zinc-800 bg-white/80 dark:bg-zinc-950/55 overflow-hidden shadow-sm">
    {toolbar && (
      <div className="shrink-0 border-b border-zinc-200/80 dark:border-zinc-800 px-3 py-2 bg-zinc-50/80 dark:bg-zinc-900/40">
        {toolbar}
      </div>
    )}
    {children}
  </div>
);

/** Contenedor scrollable de la tabla: llena el alto disponible del ListTableCard */
export const ListTableScroll: React.FC<{ children: React.ReactNode; className?: string }> = ({
  children,
  className = '',
}) => (
  <div className={`flex-1 min-h-0 overflow-x-auto overflow-y-auto ${className}`.trim()}>
    {children}
  </div>
);

interface ListEmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export const ListEmptyState: React.FC<ListEmptyStateProps> = ({
  icon: Icon = Inbox,
  title,
  description,
  action,
}) => (
  <div className="flex flex-col items-center justify-center px-6 py-12 min-h-[40vh] text-center">
    <div className="mb-4 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
      <Icon className="w-6 h-6" />
    </div>
    <p className="font-display text-base font-semibold text-zinc-900 dark:text-white">{title}</p>
    {description && (
      <p className="mt-1.5 max-w-sm text-sm text-zinc-500 dark:text-zinc-400">{description}</p>
    )}
    {action && <div className="mt-4">{action}</div>}
  </div>
);

interface ListFiltersPanelProps {
  children: React.ReactNode;
  onClear?: () => void;
  open?: boolean;
}

export const ListFiltersPanel: React.FC<ListFiltersPanelProps> = ({
  children,
  onClear,
  open = true,
}) => {
  if (!open) return null;
  return (
    <div className="shrink-0 rounded-xl border border-zinc-200/80 dark:border-zinc-800 bg-white/70 dark:bg-zinc-950/50 p-3 mb-3">
      <div className="flex items-center justify-between gap-3 mb-2">
        <div className="flex items-center gap-2 text-sm font-semibold text-zinc-800 dark:text-zinc-100">
          <Search className="w-4 h-4 text-amber-600 dark:text-amber-400" />
          Filtros
        </div>
        {onClear && (
          <button
            type="button"
            onClick={onClear}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 transition-colors"
          >
            <X className="w-3.5 h-3.5" />
            Limpiar
          </button>
        )}
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
        {children}
      </div>
    </div>
  );
};

export const ListFilterField: React.FC<{
  label: string;
  children: React.ReactNode;
}> = ({ label, children }) => (
  <label className="block min-w-0">
    <span className="mb-1 block text-xs font-medium text-zinc-500 dark:text-zinc-400">
      {label}
    </span>
    {children}
  </label>
);

/** Fila de KPIs compacta sobre la tabla */
export const ListStatsRow: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="shrink-0 grid grid-cols-1 sm:grid-cols-3 gap-2 mb-3">{children}</div>
);
