import React, { useState, useEffect } from 'react';
import { 
  Shield, Search, Loader2, AlertCircle,
  MapPin, Clock, Building, DollarSign, Calendar,
  MessageCircle, FileText, Trash2, X, Check, XCircle, CheckCircle2
} from 'lucide-react';
import { Vale } from './Vale';
import { Tracking } from './Tracking';
import { Toast } from './Toast';
import { ConfirmDialog } from './ConfirmDialog';
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
import { obtenerSolicitudesPersonal, exportarSolicitudesXLS, obtenerMotivosCancelacion } from '../services/serviciosPersonalService';
import { SolicitudPersonal, FiltrosSolicitudes } from '../types/serviciosPersonal';
import { fetchWithAuth } from '../utils/apiInterceptor';
import { obtenerSesion } from '../services/authService';

interface VerificarServiciosProps {
  onVolver: () => void;
}

/**
 * Componente para verificar servicios (condicion=5)
 */
export const VerificarServicios: React.FC<VerificarServiciosProps> = ({ onVolver }) => {
  const [solicitudes, setSolicitudes] = useState<SolicitudPersonal[]>([]);
  const [solicitudesFiltradas, setSolicitudesFiltradas] = useState<SolicitudPersonal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [paginaActual, setPaginaActual] = useState(1);
  const [itemsPorPagina] = useState(50);
  const [vistaActual, setVistaActual] = useState<'lista' | 'vale' | 'tracking'>('lista');
  const [tokenSeleccionado, setTokenSeleccionado] = useState<string>('');
  const [modalVerificar, setModalVerificar] = useState<{
    isVisible: boolean;
    solicitud: SolicitudPersonal | null;
  }>({
    isVisible: false,
    solicitud: null
  });
  
  const [filtros, setFiltros] = useState<FiltrosSolicitudes>({
    busqueda: '',
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
  } = useServiciosColumnOrder('cols-verificar');

  const handleColumnFilterChange = (key: ServiciosFilterKey, value: ColumnFilterValue) => {
    setColumnFilters((prev) => ({ ...prev, [key]: value }));
  };


  // Estado para el mes y año seleccionados
  const [mesAnoSeleccionado, setMesAnoSeleccionado] = useState('');



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
    // Inicializar con el mes actual
    setMesAnoSeleccionado(obtenerMesActualTexto());
  }, []);

  useEffect(() => {
    if (mesAnoSeleccionado) {
      cargarSolicitudes();
    }
  }, [mesAnoSeleccionado]);

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
    
    // Si está en formato DD-MM-YYYY con guiones, convertir a YYYY-MM-DD
    if (fechaServicio.includes('-') && fechaServicio.length === 10 && fechaServicio.indexOf('-') === 2) {
      const [dia, mes, año] = fechaServicio.split('-');
      return `${año}-${mes.padStart(2, '0')}-${dia.padStart(2, '0')}`;
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

  // Obtener el mes actual en formato texto (ej: "Agosto 2025")
  const obtenerMesActualTexto = () => {
    const fechaActual = new Date();
    const nombreMes = fechaActual.toLocaleDateString('es-ES', { month: 'long' });
    const año = fechaActual.getFullYear();
    return `${nombreMes.charAt(0).toUpperCase() + nombreMes.slice(1)} ${año}`;
  };

  // Generar opciones de mes/año: solo mes actual y mes anterior
  const generarOpcionesMesAno = () => {
    const fechaActual = new Date();
    const añoActual = fechaActual.getFullYear();
    const mesActualNumero = fechaActual.getMonth(); // 0-11
    
    // Array de nombres de meses en español
    const nombresMeses = [
      'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
      'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ];
    
    // Mes actual
    const nombreMesActual = nombresMeses[mesActualNumero];
    const mesActual = `${nombreMesActual} ${añoActual}`;
    
    // Mes anterior
    let mesAnteriorNumero = mesActualNumero - 1;
    let añoAnterior = añoActual;
    if (mesAnteriorNumero < 0) {
      mesAnteriorNumero = 11; // Diciembre
      añoAnterior = añoActual - 1;
    }
    const nombreMesAnterior = nombresMeses[mesAnteriorNumero];
    const mesAnterior = `${nombreMesAnterior} ${añoAnterior}`;
    
    return [
      { valor: mesActual, texto: mesActual },       // Mes actual primero
      { valor: mesAnterior, texto: mesAnterior }    // Mes anterior segundo
    ];
  };

  const cargarSolicitudes = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Condición 5 para verificar servicios, usando el mes seleccionado
      const response = await obtenerSolicitudesPersonal(5, mesAnoSeleccionado);
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

  const handleVerificar = async (solicitud: SolicitudPersonal) => {
    setModalVerificar({
      isVisible: true,
      solicitud
    });
  };

  const confirmarVerificacion = async () => {
    if (!modalVerificar.solicitud) return;
    
    const session = obtenerSesion();
    if (!session || !session.idpersonal) {
      setToast({
        isVisible: true,
        message: 'Sesión no válida',
        type: 'error'
      });
      return;
    }
    
    try {
      const response = await fetchWithAuth('https://apiservices.zmovilidad.app/api/AppIntranetCliente/Validaservicio', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          idpersonal: session.idpersonal,
          idservicio: modalVerificar.solicitud.idservicio,
          tservicio: modalVerificar.solicitud.tservicio,
          modo: 3,
          observacion: ''
        })
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Error al verificar servicio');
      }

      setToast({
        isVisible: true,
        message: `Servicio #${modalVerificar.solicitud.idservicio} verificado exitosamente`,
        type: 'success'
      });

      // Cerrar modal y recargar solicitudes
      setModalVerificar({ isVisible: false, solicitud: null });
      cargarSolicitudes();
    } catch (error) {
      setToast({
        isVisible: true,
        message: error instanceof Error ? error.message : 'Error al verificar servicio',
        type: 'error'
      });
    }
  };

  const handleRechazarVerificacion = async (solicitud: SolicitudPersonal) => {
    const session = obtenerSesion();
    if (!session || !session.idpersonal) {
      setToast({
        isVisible: true,
        message: 'Sesión no válida',
        type: 'error'
      });
      return;
    }
    
    try {
      const response = await fetchWithAuth('https://apiservices.zmovilidad.app/api/AppIntranetCliente/Validaservicio', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          idpersonal: session.idpersonal,
          idservicio: solicitud.idservicio,
          tservicio: solicitud.tservicio,
          modo: 2,
          observacion: ''
        })
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Error al rechazar verificación');
      }

      setToast({
        isVisible: true,
        message: `Servicio #${solicitud.idservicio} marcado como observado exitosamente`,
        type: 'success'
      });

      // Recargar solicitudes
      cargarSolicitudes();
    } catch (error) {
      setToast({
        isVisible: true,
        message: error instanceof Error ? error.message : 'Error al rechazar verificación',
        type: 'error'
      });
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
          <p className="text-zinc-600 dark:text-zinc-400">Cargando servicios para verificar...</p>
        </div>
      </div>
    );
  }

  return (
    <ListPageShell>
      <ListPageHeader
        title="Revisión de Servicios"
        icon={Shield}
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
              <label htmlFor="mesAno" className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
                Mes/Año
              </label>
              <select
                id="mesAno"
                value={mesAnoSeleccionado}
                onChange={(e) => setMesAnoSeleccionado(e.target.value)}
                className="zm-input h-10 py-0 text-sm w-auto min-w-[10rem]"
              >
                {generarOpcionesMesAno().map((opcion) => (
                  <option key={opcion.valor} value={opcion.valor}>
                    {opcion.texto}
                  </option>
                ))}
              </select>
            </div>
          }
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
                            {[12, 13].includes(solicitud.idestado) && (
                              <button
                                onClick={() => handleVerificar(solicitud)}
                                className="text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-200 transition-colors duration-200"
                                title="Verificar servicio"
                              >
                                <Check className="w-4 h-4" />
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
                      <Shield className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-zinc-500 dark:text-zinc-400">
                        {Object.values(filtrosTabla).some(f => f !== '') || filtros.busqueda !== '' || filtros.fechaDesde !== '' || filtros.fechaHasta !== '' || filtros.solicitante !== ''
                          ? 'No se encontraron servicios con los filtros aplicados' 
                          : 'No hay servicios pendientes de verificación'
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

      {/* Modal de Confirmación */}
      <ConfirmDialog
        isOpen={modalVerificar.isVisible}
        onCancel={() => setModalVerificar({ isVisible: false, solicitud: null })}
        onConfirm={confirmarVerificacion}
        title="Revisión"
        message={`¿Deseas realizar la revisión del servicio #${modalVerificar.solicitud?.idservicio}?`}
        confirmText="Revisar"
        cancelText="Cancelar"
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