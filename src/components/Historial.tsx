import React, { useState, useEffect } from 'react';
import {
  Activity,
  AlertCircle,
  Ban,
  Calendar,
  CheckCircle2,
  FileText,
  History,
  Loader2,
  MapPin,
  MessageCircle,
  Trash2,
  X,
} from 'lucide-react';
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
import { Vale } from './Vale';
import { Tracking } from './Tracking';
import { Toast } from './Toast';
import { ConfirmDialog } from './ConfirmDialog';
import { obtenerSolicitudesPersonal, exportarSolicitudesXLS, obtenerMotivosCancelacion } from '../services/serviciosPersonalService';
import { SolicitudPersonal, FiltrosSolicitudes } from '../types/serviciosPersonal';

interface HistorialProps {
  onVolver: () => void;
}

/**
 * Componente para historial de servicios (condicion=2)
 */
export const Historial: React.FC<HistorialProps> = ({ onVolver }) => {
  const [solicitudes, setSolicitudes] = useState<SolicitudPersonal[]>([]);
  const [solicitudesFiltradas, setSolicitudesFiltradas] = useState<SolicitudPersonal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [paginaActual, setPaginaActual] = useState(1);
  const [itemsPorPagina] = useState(50);
  const [vistaActual, setVistaActual] = useState<'lista' | 'vale' | 'tracking'>('lista');
  const [tokenSeleccionado, setTokenSeleccionado] = useState<string>('');
  const [mesSeleccionado, setMesSeleccionado] = useState<string>('');
  const [mesesDisponibles, setMesesDisponibles] = useState<string[]>([]);
  
  const [filtros, setFiltros] = useState<FiltrosSolicitudes>({
    busqueda: '',
    estado: 'todos',
    tipoServicio: 'todos',
    fechaDesde: '',
    fechaHasta: '',
    solicitante: ''
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
  } = useServiciosColumnOrder('cols-historial');

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
    generarMesesDisponibles();
  }, []);

  useEffect(() => {
    if (mesSeleccionado) {
      cargarSolicitudes();
    }
  }, [mesSeleccionado]);

  useEffect(() => {
    filtrarSolicitudes();
  }, [solicitudes, filtros, filtrosTabla, columnFilters]);

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

  const generarMesesDisponibles = () => {
    const meses = [];
    const fechaActual = new Date();
    const añoActual = fechaActual.getFullYear();
    const mesActual = fechaActual.getMonth(); // 0-11
    
    const nombresMeses = [
      'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
      'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ];

    // Desde enero 2024 hasta el mes actual
    for (let año = 2024; año <= añoActual; año++) {
      const mesInicio = año === 2024 ? 0 : 0; // Enero
      const mesFin = año === añoActual ? mesActual : 11; // Diciembre o mes actual
      
      for (let mes = mesInicio; mes <= mesFin; mes++) {
        meses.push(`${nombresMeses[mes]} ${año}`);
      }
    }

    setMesesDisponibles(meses.reverse()); // Más recientes primero
    
    // Seleccionar el mes actual por defecto
    const mesActualTexto = `${nombresMeses[mesActual]} ${añoActual}`;
    setMesSeleccionado(mesActualTexto);
  };

  const cargarSolicitudes = async () => {
    if (!mesSeleccionado) return;
    
    try {
      setIsLoading(true);
      setError(null);
      // Condición 2 para historial
      const response = await obtenerSolicitudesPersonal(2, mesSeleccionado);
      setSolicitudes(response.aisolicitudes);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Error desconocido');
    } finally {
      setIsLoading(false);
    }
  };

  const filtrarSolicitudes = () => {
    let resultado = [...solicitudes];

    // Filtrar por búsqueda general
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
          <p className="text-zinc-600 dark:text-zinc-400">Cargando historial...</p>
        </div>
      </div>
    );
  }

  return (
    <ListPageShell>
      <ListPageHeader
        title="Historial"
        icon={History}
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
          extra={
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-zinc-500" />
              <select
                value={mesSeleccionado}
                onChange={(e) => setMesSeleccionado(e.target.value)}
                className="zm-input h-10 py-0 text-sm w-auto min-w-[10rem]"
              >
                {mesesDisponibles.map((mes) => (
                  <option key={mes} value={mes}>
                    {mes}
                  </option>
                ))}
              </select>
            </div>
          }
        />

        <div className="shrink-0 grid grid-cols-1 md:grid-cols-3 gap-2 mb-3">
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
          <ListStatCard
            label="Cancelados"
            value={solicitudesFiltradas.filter((s) => s.idestado === 14).length}
            amount={`S/ ${solicitudesFiltradas.filter((s) => s.idestado === 14).reduce((sum, s) => sum + (s.costototal || 0), 0).toFixed(2)}`}
            tone="danger"
            icon={Ban}
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
                          </div>
                          }
                        />
                      </tr>
                    ))
                ) : (
                  <tr>
                    <td colSpan={1 + columnOrder.length} className="px-6 py-12 text-center">
                      <History className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-zinc-500 dark:text-zinc-400">
                        {Object.values(filtros).some(f => f !== '' && f !== 'todos')
                          ? 'No se encontraron servicios con los filtros aplicados' 
                          : `No hay servicios en el historial para ${mesSeleccionado}`
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
