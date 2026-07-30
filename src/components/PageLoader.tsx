import React from 'react';
import { Loader2 } from 'lucide-react';

interface PageLoaderProps {
  message?: string;
}

export const PageLoader: React.FC<PageLoaderProps> = ({
  message = 'Cargando...',
}) => (
  <div className="min-h-screen bg-surface flex items-center justify-center">
    <div className="text-center animate-fade-in">
      <Loader2 className="w-12 h-12 animate-spin text-primary-600 mx-auto mb-4" />
      <p className="text-zinc-600 dark:text-zinc-400">{message}</p>
    </div>
  </div>
);
