import React, { useState, useEffect, useRef } from 'react';
import { User, Loader2, Plus, Search, X } from 'lucide-react';

interface Personal {
  idpersonal: number;
  personal: string;
}

interface PersonalSearchInputProps {
  label: string;
  placeholder: string;
  value: number | undefined;
  onChange: (idpersonal: number | undefined) => void;
  personalList: Personal[];
  onAddPersonal: (searchTerm?: string) => void;
}

/**
 * Componente de input con búsqueda para personal
 * Permite buscar en la lista de personal y registrar nuevo si no se encuentra
 */
export const PersonalSearchInput: React.FC<PersonalSearchInputProps> = ({
  label,
  placeholder,
  value,
  onChange,
  personalList,
  onAddPersonal
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredPersonal, setFilteredPersonal] = useState<Personal[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showNoResults, setShowNoResults] = useState(false);
  const [activeIndex, setActiveIndex] = useState<number>(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<Array<HTMLButtonElement | null>>([]);

  // Obtener el nombre del personal seleccionado
  const selectedPersonal = personalList.find(p => p.idpersonal === value);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
        setShowNoResults(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  useEffect(() => {
    if (showSuggestions && filteredPersonal.length > 0) {
      setActiveIndex(0);
    } else {
      setActiveIndex(-1);
    }
  }, [showSuggestions, filteredPersonal]);

  useEffect(() => {
    if (activeIndex >= 0 && itemRefs.current[activeIndex]) {
      itemRefs.current[activeIndex]?.scrollIntoView({ block: 'nearest' });
    }
  }, [activeIndex]);

  const handleInputChange = (inputValue: string) => {
    setSearchTerm(inputValue);
    
    // Si el input está vacío, limpiar sugerencias
    if (!inputValue.trim()) {
      setFilteredPersonal([]);
      setShowSuggestions(false);
      setShowNoResults(false);
      return;
    }

    // Simular loading
    setIsLoading(true);
    
    // Filtrar personal basado en el término de búsqueda
    setTimeout(() => {
      const filtered = personalList.filter(personal =>
        personal.personal.toLowerCase().includes(inputValue.toLowerCase())
      );
      
      setFilteredPersonal(filtered);
      setShowSuggestions(filtered.length > 0);
      setShowNoResults(filtered.length === 0);
      setIsLoading(false);
    }, 200);
  };

  const handleSuggestionClick = (personal: Personal) => {
    onChange(personal.idpersonal);
    setSearchTerm(personal.personal);
    setShowSuggestions(false);
    setShowNoResults(false);
  };

  const handleClearSelection = () => {
    onChange(undefined);
    setSearchTerm('');
    setShowSuggestions(false);
    setShowNoResults(false);
  };

  const handleInputFocus = () => {
    if (searchTerm.trim()) {
      if (filteredPersonal.length > 0) {
        setShowSuggestions(true);
      } else if (searchTerm.trim()) {
        setShowNoResults(true);
      }
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (!showSuggestions && !showNoResults) return;
    
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      if (showSuggestions) {
        setActiveIndex((prev) => (prev + 1) % filteredPersonal.length);
      }
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      if (showSuggestions) {
        setActiveIndex((prev) => (prev - 1 + filteredPersonal.length) % filteredPersonal.length);
      }
    } else if (event.key === 'Enter') {
      event.preventDefault();
      if (showSuggestions && activeIndex >= 0 && activeIndex < filteredPersonal.length) {
        handleSuggestionClick(filteredPersonal[activeIndex]);
      } else if (showNoResults) {
        onAddPersonal(searchTerm);
      }
    } else if (event.key === 'Escape') {
      setShowSuggestions(false);
      setShowNoResults(false);
    }
  };

  return (
    <div className="relative">
      <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
        {label}
      </label>
      <div className="relative">
        <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          ref={inputRef}
          type="text"
          value={searchTerm || selectedPersonal?.personal || ''}
          onChange={(e) => handleInputChange(e.target.value)}
          onFocus={handleInputFocus}
          onKeyDown={handleKeyDown}
          className="w-full pl-10 pr-20 py-3 border border-zinc-200 dark:border-zinc-700 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white"
          placeholder={placeholder}
          autoComplete="off"
          aria-autocomplete="list"
          aria-expanded={showSuggestions || showNoResults}
        />
        
        {/* Botones de acción */}
        <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center space-x-2">
          {selectedPersonal && (
            <button
              type="button"
              onClick={handleClearSelection}
              className="text-gray-400 hover:text-red-600 transition-colors duration-200"
              title="Limpiar selección"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          
          <button
            type="button"
            onClick={() => onAddPersonal()}
            className="text-gray-400 hover:text-blue-600 transition-colors duration-200"
            title="Agregar personal"
          >
            <Plus className="w-5 h-5" />
          </button>
        </div>

        {/* Loading indicator */}
        {isLoading && (
          <div className="absolute right-16 top-1/2 transform -translate-y-1/2">
            <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
          </div>
        )}
      </div>

      {/* Sugerencias de personal */}
      {showSuggestions && filteredPersonal.length > 0 && (
        <div
          ref={suggestionsRef}
          className="absolute z-50 w-full mt-1 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-lg shadow-lg max-h-80 overflow-y-auto"
        >
          {filteredPersonal.map((personal, index) => (
            <button
              key={personal.idpersonal}
              ref={(el) => (itemRefs.current[index] = el)}
              onMouseEnter={() => setActiveIndex(index)}
              onClick={() => handleSuggestionClick(personal)}
              className={`w-full px-4 py-3 text-left transition-colors duration-150 border-b border-zinc-100 dark:border-zinc-800 last:border-b-0 group ${
                activeIndex === index
                  ? 'bg-primary-50 dark:bg-primary-900/20'
                  : 'hover:bg-primary-50 dark:hover:bg-primary-900/20'
              }`}
            >
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-zinc-100 dark:bg-zinc-800 rounded-lg flex items-center justify-center group-hover:bg-primary-100 dark:group-hover:bg-primary-800 transition-colors duration-200">
                  <User className="w-4 h-4 text-zinc-500 dark:text-zinc-400 group-hover:text-primary-600 dark:group-hover:text-primary-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-zinc-900 dark:text-white truncate">
                    {personal.personal}
                  </p>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Mensaje de no resultados con opción de agregar */}
      {showNoResults && searchTerm.trim() && (
        <div
          ref={suggestionsRef}
          className="absolute z-50 w-full mt-1 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-lg shadow-lg p-4"
        >
          <div className="text-center">
            <div className="w-12 h-12 bg-zinc-100 dark:bg-zinc-800 rounded-full flex items-center justify-center mx-auto mb-3">
              <Search className="w-6 h-6 text-zinc-500 dark:text-zinc-400" />
            </div>
            <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-3">
              No se encontró personal con "{searchTerm}"
            </p>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-4">
              ¿Deseas registrar a esta persona?
            </p>
            <button
              onClick={() => onAddPersonal(searchTerm)}
              className="w-full py-2 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 font-medium flex items-center justify-center space-x-2"
            >
              <Plus className="w-4 h-4" />
              <span>Registrar Personal</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
