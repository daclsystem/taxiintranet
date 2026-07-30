import React, { useState, useEffect } from 'react';
import { 
  CheckCircle, Search, Loader2, AlertCircle,
  Calendar, MapPin, Clock, Building, DollarSign,
  MessageCircle, FileText, Check, XCircle, CheckCircle2
} from 'lucide-react';
import { Vale } from './Vale';
import { Tracking } from './Tracking';
import { Toast } from './Toast';
import { ConfirmDialog } from './ConfirmDialog';
import {
  AppModal,
  ModalCancelButton,
  modalFieldClass,
  modalLabelClass,
  modalSectionTitleClass,
} from './ui/AppModal';
import {
  ListEmptyState,
  ListPageActions,
  ListPageBody,
  ListPageHeader,
  ListPageShell,
  ListStatCard,
  ListTableCard,
} from './ui/ListPageUI';
import {
  applyServiciosColumnFilters,
  createServiciosColumnFilters,
  ServiciosColumnFiltersHead,
  ServiciosColumnFiltersState,
  ServiciosFilterKey,
} from './ui/ServiciosColumnFilters';
import { ServiciosRowCells, useServiciosColumnOrder } from './ui/ServiciosDataTable';
import { ColumnFilterValue, hasAnyColumnFilter } from './ui/ColumnFilter';
import { obtenerSolicitudesPersonal, exportarSolicitudesXLS } from '../services/serviciosPersonalService';
import { obtenerSesion } from '../services/authService';
import { SolicitudPersonal, FiltrosSolicitudes } from '../types/serviciosPersonal';
import { fetchWithAuth } from '../utils/apiInterceptor';

interface ValidarServiciosProps {
  onVolver: () => void;
}

/**
 * Componente para validar servicios (condicion=0)
 */
export const ValidarServicios: React.FC<ValidarServiciosProps> = ({ onVolver }) => {
  const [solicitudes, setSolicitudes] = useState<SolicitudPersonal[]>([]);
  const [solicitudesFiltradas, setSolicitudesFiltradas] = useState<SolicitudPersonal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [paginaActual, setPaginaActual] = useState(1);
  const [itemsPorPagina] = useState(50);
  const [vistaActual, setVistaActual] = useState<'lista' | 'vale' | 'tracking'>('lista');
  const [tokenSeleccionado, setTokenSeleccionado] = useState<string>('');
  
  // Estados para validación
  const [modalValidacion, setModalValidacion] = useState<{
    isOpen: boolean;
    solicitud: SolicitudPersonal | null;
  }>({
    isOpen: false,
    solicitud: null
  });
  const [observaciones, setObservaciones] = useState('');
  const [isValidating, setIsValidating] = useState(false);

  const [busqueda, setBusqueda] = useState('');

  const [filtros, setFiltros] = useState<FiltrosSolicitudes>({
    busqueda: '',
    estado: 'todos',
    tipoServicio: 'todos',
    fechaDesde: '',
    fechaHasta: '',
    solicitante: '',
    mesAnio: ''
  });

  const [filtrosTabla, setFiltrosTabla] = useState({
    idServicio: '',
    traslado: '',
    origen: '',
    rutaAdicional: '',
    destino: '',
    area: '',
    centroCostos: '',
    motivo: '',
    detalleMotivo: '',
    costo: ''
  });

  const [columnFilters, setColumnFilters] = useState<ServiciosColumnFiltersState>(
    createServiciosColumnFilters
  );
  const {
    order: columnOrder,
    onDragStart: onColDragStart,
    onDragOver: onColDragOver,
    onDrop: onColDrop,
  } = useServiciosColumnOrder('cols-validar');

  const handleColumnFilterChange = (key: ServiciosFilterKey, value: ColumnFilterValue) => {
    setColumnFilters((prev) => ({ ...prev, [key]: value }));
  };


  const [toast, setToast] = useState<{
    isVisible: boolean;
    message: string;
    type: 'success' | 'error';
  }>({
    isVisible: false,
    message: '',
    type: 'success'
  });

  useEffect(() => {
    cargarSolicitudes();
  }, []);

  useEffect(() => {
    filtrarSolicitudes();
  }, [solicitudes, busqueda, filtros, filtrosTabla, columnFilters]);

  // Función para convertir fecha DD-MM a YYYY-MM-DD para comparación
  const convertirFechaParaComparacion = (fechaServicio: string): string => {
    if (!fechaServicio) return '';
    
    // Si la fecha ya está en formato YYYY-MM-DD, devolverla tal como está
    if (fechaServicio.includes('-') && fechaServicio.length === 10 && fechaServicio.indexOf('-') === 4) {
      return fechaServicio;
    }
    
    // Si está en formato DD-MM, convertir a YYYY-MM-DD agregando el año actual
    if (fechaServicio.includes('-') && fechaServicio.length === 5) {
      const añoActual = new Date().getFullYear();
      const [dia, mes] = fechaServicio.split('-');
      return `${añoActual}-${mes.padStart(2, '0')}-${dia.padStart(2, '0')}`;
    }
    
    // Si está en formato DD/MM/YYYY, convertir a YYYY-MM-DD
    if (fechaServicio.includes('/')) {
      const partes = fechaServicio.split('/');
      if (partes.length === 3) {
        const [dia, mes, año] = partes;
        return `${año}-${mes.padStart(2, '0')}-${dia.padStart(2, '0')}`;
      }
    }
    
    return fechaServicio;
  };

  const cargarSolicitudes = async () => {
    try {
      setIsLoading(true);
      setError(null);
      // Condición 0 para validar servicios
      const response = await obtenerSolicitudesPersonal(0, 'a');
      setSolicitudes(response.aisolicitudes);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Error desconocido');
    } finally {
      setIsLoading(false);
    }
  };

  const filtrarSolicitudes = () => {
    let resultado = [...solicitudes];

    // Filtrar por búsqueda general (campo busqueda)
    if (busqueda.trim()) {
      const busquedaLower = busqueda.toLowerCase();
      resultado = resultado.filter(s =>
        s.idservicio.toString().includes(busquedaLower) ||
        s.solicitante.toLowerCase().includes(busquedaLower) ||
        s.traslado.toLowerCase().includes(busquedaLower) ||
        s.direccionorigen.toLowerCase().includes(busquedaLower) ||
        s.direcciondestino.toLowerCase().includes(busquedaLower)
      );
    }

    // Filtrar por búsqueda en filtros (filtros.busqueda)
    if (filtros.busqueda.trim()) {
      resultado = resultado.filter((s) => coincideBusquedaServicio(s, filtros.busqueda));
    }

    // Filtros específicos de tabla
    if (filtrosTabla.idServicio.trim()) {
      resultado = resultado.filter(s =>
        s.idservicio.toString().includes(filtrosTabla.idServicio)
      );
    }

    if (filtrosTabla.traslado.trim()) {
      resultado = resultado.filter(s =>
        s.traslado.toLowerCase().includes(filtrosTabla.traslado.toLowerCase())
      );
    }

    if (filtrosTabla.origen.trim()) {
      resultado = resultado.filter(s =>
        s.direccionorigen.toLowerCase().includes(filtrosTabla.origen.toLowerCase())
      );
    }

    if (filtrosTabla.rutaAdicional.trim()) {
      resultado = resultado.filter(s =>
        (s.rutaadicional || '').toLowerCase().includes(filtrosTabla.rutaAdicional.toLowerCase())
      );
    }

    if (filtrosTabla.destino.trim()) {
      resultado = resultado.filter(s =>
        s.direcciondestino.toLowerCase().includes(filtrosTabla.destino.toLowerCase())
      );
    }

    if (filtrosTabla.area.trim()) {
      resultado = resultado.filter(s =>
        (s.area || '').toLowerCase().includes(filtrosTabla.area.toLowerCase())
      );
    }

    if (filtrosTabla.centroCostos.trim()) {
      resultado = resultado.filter(s =>
        (s.centrocostos || '').toLowerCase().includes(filtrosTabla.centroCostos.toLowerCase())
      );
    }

    if (filtrosTabla.motivo.trim()) {
      resultado = resultado.filter(s =>
        (s.motivosolicitud || '').toLowerCase().includes(filtrosTabla.motivo.toLowerCase())
      );
    }

    if (filtrosTabla.detalleMotivo.trim()) {
      resultado = resultado.filter(s =>
        (s.motivodetalle || '').toLowerCase().includes(filtrosTabla.detalleMotivo.toLowerCase())
      );
    }

    if (filtrosTabla.costo.trim()) {
      resultado = resultado.filter(s =>
        s.costototal.toString().includes(filtrosTabla.costo)
      );
    }

    // Filtrar por estado
    if (filtros.estado !== 'todos') {
      const estadoMap: { [key: string]: number[] } = {
        'pendiente': [7],
        'aprobado': [8, 9, 10, 11],
        'completado': [12, 13],
        'rechazado': [14, 15]
      };
      resultado = resultado.filter(s => estadoMap[filtros.estado]?.includes(s.idestado));
    }

    // Filtrar por tipo de servicio
    if (filtros.tipoServicio !== 'todos') {
      resultado = resultado.filter(s => s.tservicio === filtros.tipoServicio);
    }

    // Filtrar por fechas - Manejar formato DD-MM vs YYYY-MM-DD
    if (filtros.fechaDesde) {
      resultado = resultado.filter(s => {
        const fechaServicio = convertirFechaParaComparacion(s.fecha);
        const fechaDesde = filtros.fechaDesde;
        return fechaServicio >= fechaDesde;
      });
    }
    if (filtros.fechaHasta) {
      resultado = resultado.filter(s => {
        const fechaServicio = convertirFechaParaComparacion(s.fecha);
        const fechaHasta = filtros.fechaHasta;
        return fechaServicio <= fechaHasta;
      });
    }

    // Filtrar por solicitante
    if (filtros.solicitante.trim()) {
      resultado = resultado.filter(s =>
        s.solicitante.toLowerCase().includes(filtros.solicitante.toLowerCase())
      );
    }

    setSolicitudesFiltradas(applyServiciosColumnFilters(resultado, columnFilters));
    setPaginaActual(1);
  };

  const handleFiltroChange = (campo: keyof FiltrosSolicitudes, valor: string) => {
    setFiltros(prev => ({ ...prev, [campo]: valor }));
  };

  const handleFiltroTablaChange = (campo: keyof typeof filtrosTabla, valor: string) => {
    setFiltrosTabla(prev => ({ ...prev, [campo]: valor }));
  };

  const handleExportar = () => {
    exportarSolicitudesXLS(solicitudesFiltradas);
    setToast({
      isVisible: true,
      message: 'Archivo exportado exitosamente',
      type: 'success'
    });
  };

  const handleVerVale = (token: string) => {
    setTokenSeleccionado(token);
    setVistaActual('vale');
  };

  const handleVerTracking = (token: string) => {
    setTokenSeleccionado(token);
    setVistaActual('tracking');
  };

  const handleValidarRechazar = (solicitud: SolicitudPersonal) => {
    setModalValidacion({
      isOpen: true,
      solicitud
    });
    setObservaciones('');
  };

  const handleValidarServicio = async (modo: 0 | 1) => {
    if (!modalValidacion.solicitud) return;

    try {
      setIsValidating(true);
      
      const session = obtenerSesion();
      if (!session || !session.key || !session.idpersonal) {
        throw new Error('Sesión no válida');
      }

      const body = {
        idpersonal: session.idpersonal.toString(),
        idservicio: modalValidacion.solicitud.idservicio.toString(),
        tservicio: 2,
        modo: modo,
        observacion: observaciones.trim()
      };

      const response = await fetchWithAuth('https://apiservices.zmovilidad.app/api/AppIntranetCliente/Validaservicio', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.key}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body)
      });

      if (!response.ok) {
        throw new Error(`Error HTTP: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.estatus !== 200) {
        throw new Error(data.message || 'Error al validar servicio');
      }

      setModalValidacion({ isOpen: false, solicitud: null });
      setToast({
        isVisible: true,
        message: modo === 1 
          ? `Servicio #${modalValidacion.solicitud.idservicio} validado exitosamente`
          : `Servicio #${modalValidacion.solicitud.idservicio} rechazado exitosamente`,
        type: 'success'
      });
      
      // Recargar la lista
      await cargarSolicitudes();
      
    } catch (error) {
      setToast({
        isVisible: true,
        message: error instanceof Error ? error.message : 'Error al validar servicio',
        type: 'error'
      });
    } finally {
      setIsValidating(false);
    }
  };

  const formatearMoneda = (monto: number): string => {
    return `S/ ${monto.toFixed(2)}`;
  };

  const limpiarTexto = (texto: string): string => {
    return texto
      .replace(/&#x0D;\n/g, '') // Carriage Return + Line Feed codificado HTML
      .replace(/&#13;&#10;/g, '') // Otra codificación HTML de CRLF
      .replace(/\r\n/g, ' ') // Carriage Return + Line Feed estándar
      .replace(/\n/g, ' ') // Line Feed
      .replace(/\r/g, ' ') // Carriage Return
      .replace(/\s+/g, ' ') // Múltiples espacios a uno solo
      .trim();
  };

  const obtenerColorEstado = (idestado: number): { bg: string; text: string } => {
    switch (idestado) {
      case 7: return { bg: 'bg-yellow-100 dark:bg-yellow-900', text: 'text-yellow-800 dark:text-yellow-200' };
      case 8:
      case 9:
      case 10:
      case 11: return { bg: 'bg-blue-100 dark:bg-blue-900', text: 'text-blue-800 dark:text-blue-200' };
      case 12:
      case 13: return { bg: 'bg-green-100 dark:bg-green-900', text: 'text-green-800 dark:text-green-200' };
      case 14:
      case 15: return { bg: 'bg-red-100 dark:bg-red-900', text: 'text-red-800 dark:text-red-200' };
      default: return { bg: 'bg-zinc-100 dark:bg-zinc-800', text: 'text-gray-800 dark:text-gray-300' };
    }
  };

  // Paginación
  const totalPaginas = Math.ceil(solicitudesFiltradas.length / itemsPorPagina);
  const indiceInicio = (paginaActual - 1) * itemsPorPagina;
  const indiceFin = indiceInicio + itemsPorPagina;
  const solicitudesActuales = solicitudesFiltradas.slice(indiceInicio, indiceFin);

  const cerrarOverlay = () => {
    setVistaActual('lista');
    setTokenSeleccionado('');
  };

  if (isLoading && solicitudes.length === 0) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-primary-600 mx-auto mb-4" />
          <p className="text-zinc-600 dark:text-zinc-400">Cargando servicios para validar...</p>
        </div>
      </div>
    );
  }

  return (
    <ListPageShell>
      <ListPageHeader
        title="Aprobación de servicios"
        icon={CheckCircle}
        count={solicitudesFiltradas.length}
        onVolver={onVolver}
      />

      <ListPageBody>
        <ListPageActions
          title="Listado de servicios"
          subtitle="Filtra y exporta con claridad"
          onConsultar={cargarSolicitudes}
          onExportar={handleExportar}
          isLoading={isLoading}
        />

        <div className="shrink-0 grid grid-cols-1 md:grid-cols-2 gap-2 mb-3">
          <ListStatCard
            label="Total"
            value={solicitudesFiltradas.length}
            amount={`S/ ${solicitudesFiltradas.reduce((sum, s) => sum + (s.costototal || 0), 0).toFixed(2)}`}
            tone="neutral"
            icon={FileText}
          />
          <ListStatCard
            label="Finalizados"
            value={solicitudesFiltradas.filter((s) => [12, 13].includes(s.idestado)).length}
            amount={`S/ ${solicitudesFiltradas.filter((s) => [12, 13].includes(s.idestado)).reduce((sum, s) => sum + (s.costototal || 0), 0).toFixed(2)}`}
            tone="success"
            icon={CheckCircle2}
          />
        </div>

        {error && (
          <div className="shrink-0 mb-3 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
            <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
          </div>
        )}

        <ListTableCard>
          <div className="flex-1 min-h-0 overflow-x-auto overflow-y-auto">
            <table className="zm-table">
              <thead className="sticky top-0 z-20">
                <ServiciosColumnFiltersHead
                  rows={solicitudes}
                  filters={columnFilters}
                  onChange={handleColumnFilterChange}
                  columnOrder={columnOrder}
                  onDragStart={onColDragStart}
                  onDragOver={onColDragOver}
                  onDrop={onColDrop}
                />
              </thead>
              <tbody>
                {solicitudesActuales.length > 0 ? (
                  solicitudesActuales.map((solicitud) => (
                      <tr key={solicitud.idservicio} className="hover:bg-zinc-50 dark:hover:bg-zinc-800">
                        <ServiciosRowCells
                          solicitud={solicitud}
                          columnOrder={columnOrder}
                          acciones={
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => handleVerVale(solicitud.tokeng)}
                              className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-200 transition-colors duration-200"
                              title="Ver vale"
                            >
                              <FileText className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleVerTracking(solicitud.tokeng)}
                              className="text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-200 transition-colors duration-200"
                              title="Ver tracking"
                            >
                              <MapPin className="w-4 h-4" />
                            </button>
                            {solicitud.idestado === 7 && (
                              <button
                                onClick={() => handleValidarRechazar(solicitud)}
                                className="text-orange-600 hover:text-orange-900 dark:text-orange-400 dark:hover:text-orange-200 transition-colors duration-200"
                                title="Validar o rechazar servicio"
                              >
                                <CheckCircle className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                          }
                        />
                      </tr>
                    ))
                ) : (
                  <tr>
                    <td colSpan={1 + columnOrder.length} className="px-6 py-12 text-center">
                      <CheckCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-zinc-500 dark:text-zinc-400">
                        {Object.values(filtrosTabla).some(f => f !== '') || Object.values(filtros).some(f => f !== '' && f !== 'todos') || busqueda.trim()
                          ? 'No se encontraron servicios con los filtros aplicados' 
                          : 'No hay servicios pendientes de validación'
                        }
                      </p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Paginación */}
          {totalPaginas > 1 && (
            <div className="shrink-0 bg-zinc-50 dark:bg-zinc-800 px-4 py-2.5 border-t border-zinc-200 dark:border-zinc-700">
              <div className="flex items-center justify-between">
                <div className="text-sm text-zinc-700 dark:text-zinc-300">
                  Mostrando {indiceInicio + 1} a {Math.min(indiceFin, solicitudesFiltradas.length)} de {solicitudesFiltradas.length} resultados
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setPaginaActual(prev => Math.max(prev - 1, 1))}
                    disabled={paginaActual === 1}
                    className="px-3 py-1 text-sm bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-md hover:bg-zinc-50 dark:hover:bg-zinc-800 disabled:opacity-50 disabled:cursor-not-allowed text-zinc-900 dark:text-white"
                  >
                    Anterior
                  </button>
                  <span className="text-sm text-zinc-700 dark:text-zinc-300">
                    Página {paginaActual} de {totalPaginas}
                  </span>
                  <button
                    onClick={() => setPaginaActual(prev => Math.min(prev + 1, totalPaginas))}
                    disabled={paginaActual === totalPaginas}
                    className="px-3 py-1 text-sm bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-md hover:bg-zinc-50 dark:hover:bg-zinc-800 disabled:opacity-50 disabled:cursor-not-allowed text-zinc-900 dark:text-white"
                  >
                    Siguiente
                  </button>
                </div>
              </div>
            </div>
          )}
        </ListTableCard>
      </ListPageBody>

      <AppModal
        open={modalValidacion.isOpen && !!modalValidacion.solicitud}
        onClose={() => setModalValidacion({ isOpen: false, solicitud: null })}
        title="Validar Servicio"
        size="md"
        busy={isValidating}
        footer={
          <>
            <ModalCancelButton
              onClick={() => setModalValidacion({ isOpen: false, solicitud: null })}
              disabled={isValidating}
            />
            <button
              type="button"
              onClick={() => handleValidarServicio(0)}
              disabled={isValidating}
              className="inline-flex h-9 items-center justify-center gap-2 rounded-lg bg-red-600 px-4 text-sm font-semibold text-white transition-colors hover:bg-red-700 disabled:opacity-50"
            >
              {isValidating ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <XCircle className="w-4 h-4" />
              )}
              Rechazar
            </button>
            <button
              type="button"
              onClick={() => handleValidarServicio(1)}
              disabled={isValidating}
              className="inline-flex h-9 items-center justify-center gap-2 rounded-lg bg-green-600 px-4 text-sm font-semibold text-white transition-colors hover:bg-green-700 disabled:opacity-50"
            >
              {isValidating ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Check className="w-4 h-4" />
              )}
              Validar
            </button>
          </>
        }
      >
        {modalValidacion.solicitud && (
          <>
            <p className={modalSectionTitleClass}>
              Servicio #{modalValidacion.solicitud.idservicio}
            </p>
            <div className="mb-4 text-sm text-zinc-600 dark:text-zinc-400 space-y-1">
              <p><strong>Solicitante:</strong> {modalValidacion.solicitud.solicitante}</p>
              <p><strong>Traslado:</strong> {limpiarTexto(modalValidacion.solicitud.traslado)}</p>
              <p><strong>Fecha:</strong> {modalValidacion.solicitud.fecha} - {modalValidacion.solicitud.hora}</p>
              <p><strong>Costo:</strong> {formatearMoneda(modalValidacion.solicitud.costototal)}</p>
              <p><strong>Origen:</strong> {modalValidacion.solicitud.direccionorigen}</p>
              <p><strong>Destino:</strong> {modalValidacion.solicitud.direcciondestino}</p>
            </div>

            <div>
              <label className={modalLabelClass}>
                Observaciones
              </label>
              <textarea
                value={observaciones}
                onChange={(e) => {
                  const value = e.target.value;
                  if (value.length <= 250) {
                    setObservaciones(value);
                  }
                }}
                rows={4}
                maxLength={250}
                className={`${modalFieldClass} h-auto min-h-[100px] py-2 resize-none`}
                placeholder="Escribe observaciones sobre la validación (opcional)..."
              />
              <div className="text-right text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                {observaciones.length}/250 caracteres
              </div>
            </div>
          </>
        )}
      </AppModal>

      {/* Toast de Notificación */}
      <Toast
        message={toast.message}
        type={toast.type}
        isVisible={toast.isVisible}
        onClose={() => setToast(prev => ({ ...prev, isVisible: false }))}
      />

      {vistaActual === 'vale' && tokenSeleccionado && (
        <Vale token={tokenSeleccionado} variant="modal" onVolver={cerrarOverlay} />
      )}
      {vistaActual === 'tracking' && tokenSeleccionado && (
        <Tracking token={tokenSeleccionado} variant="modal" onVolver={cerrarOverlay} />
      )}
    </ListPageShell>
  );
};