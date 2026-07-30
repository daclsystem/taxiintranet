import React, { useState, useEffect } from 'react';
import { MapPin, Loader2, AlertCircle, Star } from 'lucide-react';
import { AppModal } from './ui/AppModal';
import { obtenerFavoritos } from '../services/solicitarService';
import { Favorito } from '../types/solicitar';

interface FavoritosModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectFavorito: (direccion: string, lat: number, lng: number) => void;
  tipo: 'origen' | 'destino';
}

/**
 * Modal para mostrar y seleccionar direcciones favoritas
 */
export const FavoritosModal: React.FC<FavoritosModalProps> = ({
  isOpen,
  onClose,
  onSelectFavorito,
  tipo
}) => {
  const [favoritos, setFavoritos] = useState<Favorito[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      cargarFavoritos();
    }
  }, [isOpen]);

  const cargarFavoritos = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await obtenerFavoritos();
      setFavoritos(response.aifavoritos);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Error desconocido');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectFavorito = (favorito: Favorito) => {
    onSelectFavorito(favorito.direccion, favorito.latitude, favorito.longitude);
    onClose();
  };

  return (
    <AppModal
      open={isOpen}
      onClose={onClose}
      title={`Seleccionar ${tipo === 'origen' ? 'origen' : 'destino'}`}
      size="md"
    >
      <div className="max-h-96 overflow-y-auto">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
            <span className="ml-2 text-zinc-600 dark:text-zinc-400">
              Cargando favoritos...
            </span>
          </div>
        ) : error ? (
          <div className="text-center py-8">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <p className="text-red-600 dark:text-red-400 mb-4">{error}</p>
            <button
              onClick={cargarFavoritos}
              className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors duration-200"
            >
              Reintentar
            </button>
          </div>
        ) : favoritos.length === 0 ? (
          <div className="text-center py-8">
            <Star className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-zinc-600 dark:text-zinc-400">
              No tienes direcciones favoritas guardadas
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {favoritos.map((favorito) => (
              <button
                key={favorito.idfavorito}
                onClick={() => handleSelectFavorito(favorito)}
                className="w-full p-4 text-left rounded-xl border border-zinc-200 dark:border-zinc-700 hover:border-primary-300 dark:hover:border-primary-500 hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-all duration-200 group"
              >
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0 mt-1">
                    <div className="w-8 h-8 bg-primary-100 dark:bg-primary-900 rounded-lg flex items-center justify-center group-hover:bg-primary-200 dark:group-hover:bg-primary-800 transition-colors duration-200">
                      <MapPin className="w-4 h-4 text-primary-600 dark:text-primary-400" />
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-semibold text-zinc-900 dark:text-white mb-1 truncate">
                      {favorito.titulo}
                    </h4>
                    <p className="text-sm text-zinc-600 dark:text-zinc-400 line-clamp-2">
                      {favorito.direccion}
                    </p>
                    {favorito.referencia && (
                      <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                        Ref: {favorito.referencia}
                      </p>
                    )}
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </AppModal>
  );
};
