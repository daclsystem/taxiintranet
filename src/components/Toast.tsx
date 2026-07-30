import React, { useEffect, useState } from 'react';
import { CheckCircle2, XCircle, Info, X } from 'lucide-react';

interface ToastProps {
  message: string;
  type: 'success' | 'error' | 'info';
  isVisible: boolean;
  onClose: () => void;
  duration?: number;
  title?: string;
}

/**
 * Toast moderno (slide + progress).
 */
export const Toast: React.FC<ToastProps> = ({
  message,
  type,
  isVisible,
  onClose,
  duration = 4200,
  title,
}) => {
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (!isVisible) return;
    setIsAnimating(true);
    const timer = setTimeout(() => handleClose(), duration);
    return () => clearTimeout(timer);
  }, [isVisible, duration]);

  const handleClose = () => {
    setIsAnimating(false);
    setTimeout(onClose, 220);
  };

  if (!isVisible) return null;

  const config = {
    success: {
      icon: CheckCircle2,
      label: title || 'Éxito',
      accent: 'bg-emerald-500',
      iconWrap: 'bg-emerald-500/15 text-emerald-500',
      ring: 'ring-emerald-500/20',
    },
    error: {
      icon: XCircle,
      label: title || 'Error',
      accent: 'bg-red-500',
      iconWrap: 'bg-red-500/15 text-red-500',
      ring: 'ring-red-500/20',
    },
    info: {
      icon: Info,
      label: title || 'Aviso',
      accent: 'bg-amber-500',
      iconWrap: 'bg-amber-500/15 text-amber-500',
      ring: 'ring-amber-500/20',
    },
  }[type];

  const Icon = config.icon;

  return (
    <div className="fixed top-4 right-4 left-4 sm:left-auto z-[80] flex justify-end pointer-events-none">
      <div
        className={`
          pointer-events-auto w-full sm:w-[380px] overflow-hidden rounded-2xl
          bg-white/95 dark:bg-zinc-900/95 backdrop-blur-xl
          border border-zinc-200/80 dark:border-zinc-800
          shadow-[0_20px_50px_-20px_rgba(0,0,0,0.45)]
          ring-1 ${config.ring}
          transform transition-all duration-300 ease-out
          ${isAnimating ? 'translate-y-0 opacity-100 scale-100' : '-translate-y-3 opacity-0 scale-[0.98]'}
        `}
        role="status"
      >
        <div className="flex items-start gap-3 p-4">
          <div className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl ${config.iconWrap}`}>
            <Icon className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1 pt-0.5">
            <p className="text-sm font-semibold text-zinc-900 dark:text-white">{config.label}</p>
            <p className="mt-1 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400 break-words">
              {message}
            </p>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-800 dark:hover:text-zinc-200 transition-colors"
            aria-label="Cerrar"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="h-1 w-full bg-zinc-100 dark:bg-zinc-800">
          <div
            className={`h-full ${config.accent} origin-left`}
            style={{
              animation: isAnimating ? `toast-progress ${duration}ms linear forwards` : undefined,
            }}
          />
        </div>
      </div>
      <style>{`
        @keyframes toast-progress {
          from { transform: scaleX(1); }
          to { transform: scaleX(0); }
        }
      `}</style>
    </div>
  );
};
