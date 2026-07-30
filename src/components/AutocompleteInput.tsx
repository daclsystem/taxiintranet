import React, { useState, useEffect, useRef } from 'react';
import { MapPin, Loader2, Navigation, Star } from 'lucide-react';
import { buscarDirecciones } from '../services/solicitarService';
import { Coincidencia } from '../types/solicitar';

interface AutocompleteInputProps {
  label: string;
  placeholder: string;
  value: string;
  onChange: (value: string, lat?: number, lng?: number) => void;
  onLocationClick?: () => void;
  onFavoriteClick?: () => void;
  isLoadingLocation?: boolean;
  showLocationButton?: boolean;
  showFavoriteButton?: boolean;
}

/**
 * Componente de input con autocompletado para direcciones
 * Busca direcciones en tiempo real usando la API de búsqueda
 */
export const AutocompleteInput: React.FC<AutocompleteInputProps> = ({
  label,
  placeholder,
  value,
  onChange,
  onLocationClick,
  onFavoriteClick,
  isLoadingLocation = false,
  showLocationButton = false,
  showFavoriteButton = false
}) => {
  const [suggestions, setSuggestions] = useState<Coincidencia[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [searchTimeout, setSearchTimeout] = useState<NodeJS.Timeout | null>(null);
  const [activeIndex, setActiveIndex] = useState<number>(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<Array<HTMLButtonElement | null>>([]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  useEffect(() => {
    return () => {
      if (searchTimeout) {
        clearTimeout(searchTimeout);
      }
    };
  }, [searchTimeout]);
  
  useEffect(() => {
    if (showSuggestions && suggestions.length > 0) {
      setActiveIndex(0);
    } else {
      setActiveIndex(-1);
    }
  }, [showSuggestions, suggestions]);
  
  useEffect(() => {
    if (activeIndex >= 0 && itemRefs.current[activeIndex]) {
      itemRefs.current[activeIndex]?.scrollIntoView({ block: 'nearest' });
    }
  }, [activeIndex]);
  const handleInputChange = (inputValue: string) => {
    onChange(inputValue);
    
    // Limpiar timeout anterior
    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }

    // Si el input está vacío, limpiar sugerencias
    if (!inputValue.trim()) {
      setSuggestions([]);
      setShowSuggestions(false);
      setIsLoading(false);
      return;
    }

    // Mostrar loading inmediatamente
    setIsLoading(true);

    // Buscar después de 500ms de inactividad
    const timeout = setTimeout(async () => {
      try {
        console.log('Buscando direcciones para:', inputValue);
        const response = await buscarDirecciones(inputValue);
        console.log('Respuesta de búsqueda:', response);
        setSuggestions(response.coincidencias);
        setShowSuggestions(true);
      } catch (error) {
        console.error('Error al buscar direcciones:', error);
        setSuggestions([]);
        setShowSuggestions(false);
      } finally {
        setIsLoading(false);
      }
    }, 300);

    setSearchTimeout(timeout);
  };

  const handleSuggestionClick = (suggestion: Coincidencia) => {
    try {
      console.log('handleSuggestionClick llamado con:', suggestion);
      const fullAddress = `${suggestion.direccion}, ${suggestion.distrito}`;
      console.log('Dirección completa:', fullAddress);
      console.log('Coordenadas:', { lat: suggestion.lat, lng: suggestion.lng });
      
      onChange(fullAddress, suggestion.lat, suggestion.lng);
      setShowSuggestions(false);
      setSuggestions([]);
      setIsLoading(false);
      
      console.log('Sugerencia seleccionada exitosamente');
    } catch (error) {
      console.error('Error en handleSuggestionClick:', error);
    }
  };

  const handleInputFocus = () => {
    if (suggestions.length > 0 && value.trim()) {
      setShowSuggestions(true);
    }
  };

  return (
    <div className="relative">
      <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
        {label}
      </label>
      <div className="relative">
        <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => handleInputChange(e.target.value)}
          onFocus={handleInputFocus}
          onKeyDown={(event) => {
            if (!showSuggestions || suggestions.length === 0) return;
            if (event.key === 'ArrowDown') {
              event.preventDefault();
              setActiveIndex((prev) => (prev + 1) % suggestions.length);
            } else if (event.key === 'ArrowUp') {
              event.preventDefault();
              setActiveIndex((prev) => (prev - 1 + suggestions.length) % suggestions.length);
            } else if (event.key === 'Enter') {
              if (activeIndex >= 0 && activeIndex < suggestions.length) {
                event.preventDefault();
                handleSuggestionClick(suggestions[activeIndex]);
              }
            } else if (event.key === 'Escape') {
              setShowSuggestions(false);
            }
          }}
          className="zm-input pl-10 pr-20 py-3"
          placeholder={placeholder}
          autoComplete="off"
          aria-autocomplete="list"
          aria-expanded={showSuggestions}
          aria-controls="autocomplete-suggestions"
          aria-activedescendant={activeIndex >= 0 ? `autocomplete-option-${activeIndex}` : undefined}
        />
        
        {/* Botones de acción */}
        <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center space-x-2">
          {showFavoriteButton && (
            <button
              type="button"
              onClick={onFavoriteClick}
              className="text-gray-400 hover:text-primary-600 transition-colors duration-200"
              title="Seleccionar favorito"
            >
              <Star className="w-5 h-5" />
            </button>
          )}
          
          {showLocationButton && (
            <button
              type="button"
              onClick={onLocationClick}
              disabled={isLoadingLocation}
              className="text-gray-400 hover:text-primary-600 transition-colors duration-200"
              title="Usar ubicación actual"
            >
              {isLoadingLocation ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Navigation className="w-5 h-5" />
              )}
            </button>
          )}
        </div>

        {/* Loading indicator */}
        {isLoading && (
          <div className="absolute right-16 top-1/2 transform -translate-y-1/2">
            <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
          </div>
        )}
      </div>

      {/* Sugerencias */}
      {showSuggestions && suggestions.length > 0 && (
        <div
          ref={suggestionsRef}
          id="autocomplete-suggestions"
          role="listbox"
          className="absolute z-50 w-full mt-1 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-lg shadow-lg max-h-80 overflow-y-auto"
        >
          {suggestions.map((suggestion, index) => (
            <button
              key={index}
              id={`autocomplete-option-${index}`}
              role="option"
              aria-selected={activeIndex === index}
              ref={(el) => (itemRefs.current[index] = el)}
              onMouseEnter={() => setActiveIndex(index)}
              onClick={() => handleSuggestionClick(suggestion)}
              className={`w-full px-4 py-3 text-left transition-colors duration-150 border-b border-zinc-100 dark:border-zinc-800 last:border-b-0 group ${
                activeIndex === index
                  ? 'bg-primary-50 dark:bg-primary-900/20'
                  : 'hover:bg-primary-50 dark:hover:bg-primary-900/20'
              }`}
            >
              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 bg-zinc-100 dark:bg-zinc-800 rounded-lg flex items-center justify-center mt-0.5 group-hover:bg-primary-100 dark:group-hover:bg-primary-800 transition-colors duration-200">
                  <MapPin className="w-4 h-4 text-zinc-500 dark:text-zinc-400 group-hover:text-primary-600 dark:group-hover:text-primary-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-zinc-900 dark:text-white truncate">
                    {suggestion.direccion}
                  </p>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 truncate">
                    {suggestion.distrito}
                  </p>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};