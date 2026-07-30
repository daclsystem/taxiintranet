import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  User, Loader2, AlertCircle,
  MapPin, Clock,
  MessageCircle, FileText, Check, Activity, Ban, Car, Inbox
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
import { obtenerSolicitudesPersonal, exportarSolicitudesXLS, obtenerMotivosCancelacion } from '../services/serviciosPersonalService';
import { SolicitudPersonal } from '../types/serviciosPersonal';
import { PATHS } from '../routes/paths';

interface MisServiciosProps {
  onVolver: () => void;
}

/**
 * Componente para mis servicios (condicion=1)
 */
export const MisServicios: React.FC<MisServiciosProps> = ({ onVolver }) => {
  const [solicitudes, setSolicitudes] = useState<SolicitudPersonal[]>([]);
  const [solicitudesFiltradas, setSolicitudesFiltradas] = useState<SolicitudPersonal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [paginaActual, setPaginaActual] = useState(1);
  const [itemsPorPagina] = useState(50);
  const [vistaActual, setVistaActual] = useState<'lista' | 'vale' | 'tracking'>('lista');
  const [tokenSeleccionado, setTokenSeleccionado] = useState<string>('');
  
  // Estados para cancelación
  const [modalCancelacion, setModalCancelacion] = useState<{
    isOpen: boolean;
    solicitud: SolicitudPersonal | null;
  }>({
    isOpen: false,
    solicitud: null
  });
  const [motivosCancelacion, setMotivosCancelacion] = useState<string[]>([]);
  const [isLoadingMotivos, setIsLoadingMotivos] = useState(false);
  const [motivoSeleccionado, setMotivoSeleccionado] = useState('');
  const [observaciones, setObservaciones] = useState('');

  const [columnFilters, setColumnFilters] = useState<ServiciosColumnFiltersState>(
    createServiciosColumnFilters
  );
  const {
    order: columnOrder,
    onDragStart: onColDragStart,
    onDragOver: onColDragOver,
    onDrop: onColDrop,
  } = useServiciosColumnOrder('cols-mis-servicios');

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
    setSolicitudesFiltradas(applyServiciosColumnFilters(solicitudes, columnFilters));
    setPaginaActual(1);
  }, [solicitudes, columnFilters]);

  const handleColumnFilterChange = (key: ServiciosFilterKey, value: ColumnFilterValue) => {
    setColumnFilters((prev) => ({ ...prev, [key]: value }));
  };

  const cargarSolicitudes = async () => {
    try {
      setIsLoading(true);
      setError(null);
      // Condición 1 para mis servicios
      const response = await obtenerSolicitudesPersonal(1, '""');
      setSolicitudes(response.aisolicitudes);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Error desconocido');
    } finally {
      setIsLoading(false);
    }
  };

  const cargarMotivosCancelacion = async (idservicio: number) => {
    try {
      setIsLoadingMotivos(true);
      const response = await obtenerMotivosCancelacion(idservicio);
      setMotivosCancelacion(response.aocancelar.map(m => m.cancelar));
    } catch (error) {
      console.error('Error al cargar motivos:', error);
      setMotivosCancelacion(['Error al cargar motivos']);
    } finally {
      setIsLoadingMotivos(false);
    }
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

  const handleCancelar = async (solicitud: SolicitudPersonal) => {
    setModalCancelacion({
      isOpen: true,
      solicitud
    });
    setMotivoSeleccionado('');
    setObservaciones('');
    await cargarMotivosCancelacion(solicitud.idservicio);
  };

  const handleEnviarWhatsApp = () => {
    if (!motivoSeleccionado || !modalCancelacion.solicitud) {
      setToast({
        isVisible: true,
        message: 'Debe seleccionar un motivo de cancelación',
        type: 'error'
      });
      return;
    }

    const { solicitud } = modalCancelacion;
    const mensaje = `Solicitud de cancelación de servicio:
    
Número de servicio: ${solicitud.idservicio}
Motivo: ${motivoSeleccionado}
${observaciones ? `Observaciones: ${observaciones}` : ''}

Por favor, proceder con la cancelación.`;

    const whatsappUrl = `https://api.whatsapp.com/send?phone=51971166146&text=${encodeURIComponent(mensaje)}`;
    
    window.open(whatsappUrl, '_blank');
    
    setModalCancelacion({
      isOpen: false,
      solicitud: null
    });
    
    setToast({
      isVisible: true,
      message: 'Solicitud de cancelación enviada por WhatsApp',
      type: 'success'
    });
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
          <p className="text-zinc-600 dark:text-zinc-400">Cargando mis servicios...</p>
        </div>
      </div>
    );
  }

  return (
    <ListPageShell>
      <ListPageHeader
        title="Mis Servicios"
        icon={User}
        count={solicitudesFiltradas.length}
        onVolver={onVolver}
      />

      <ListPageBody>
        <ListPageActions
          title="Tus servicios activos"
          subtitle="Consulta, filtra y exporta tus solicitudes"
          onConsultar={cargarSolicitudes}
          onExportar={handleExportar}
          isLoading={isLoading}
        />

        <div className="shrink-0 grid grid-cols-1 sm:grid-cols-3 gap-2 mb-3">
          <ListStatCard
            label="Total"
            value={solicitudesFiltradas.length}
            amount={`S/ ${solicitudesFiltradas.reduce((sum, s) => sum + (s.costototal || 0), 0).toFixed(2)}`}
            tone="neutral"
            icon={FileText}
          />
          <ListStatCard
            label="En proceso"
            value={solicitudesFiltradas.filter((s) => [7, 8, 9, 10, 11].includes(s.idestado)).length}
            amount={`S/ ${solicitudesFiltradas.filter((s) => [7, 8, 9, 10, 11].includes(s.idestado)).reduce((sum, s) => sum + (s.costototal || 0), 0).toFixed(2)}`}
            tone="active"
            icon={Activity}
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
                      <tr key={solicitud.idservicio}>
                        <ServiciosRowCells
                          solicitud={solicitud}
                          columnOrder={columnOrder}
                          acciones={
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => handleVerVale(solicitud.tokeng)}
                              className="inline-flex h-7 w-7 items-center justify-center rounded-lg text-amber-600 dark:text-amber-400 hover:bg-amber-500/10 transition-colors"
                              title="Ver vale"
                            >
                              <FileText className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleVerTracking(solicitud.tokeng)}
                              className="inline-flex h-7 w-7 items-center justify-center rounded-lg text-sky-600 dark:text-sky-400 hover:bg-sky-500/10 transition-colors"
                              title="Ver tracking"
                            >
                              <MapPin className="w-4 h-4" />
                            </button>
                            <span
                              className={`inline-flex h-7 w-7 items-center justify-center rounded-lg ${
                                solicitud.verificado === 1
                                  ? 'text-emerald-600 dark:text-emerald-400'
                                  : 'text-amber-600 dark:text-amber-400'
                              }`}
                              title={solicitud.verificado === 1 ? 'Verificado' : 'Pendiente'}
                            >
                              {solicitud.verificado === 1 ? (
                                <Check className="w-4 h-4" />
                              ) : (
                                <Clock className="w-4 h-4" />
                              )}
                            </span>
                          </div>
                          }
                        />
                      </tr>
                    ))
                ) : (
                  <tr>
                    <td colSpan={1 + columnOrder.length} className="!p-0 !border-0">
                      <ListEmptyState
                        icon={Inbox}
                        title={
                          hasAnyColumnFilter(columnFilters)
                            ? 'Sin resultados'
                            : 'Aún no tienes servicios'
                        }
                        description={
                          hasAnyColumnFilter(columnFilters)
                            ? 'Prueba limpiar los filtros de columna.'
                            : 'Cuando solicites un traslado, aparecerá aquí.'
                        }
                        action={
                          <Link
                            to={PATHS.solicitar}
                            className="inline-flex items-center gap-2 h-10 px-4 rounded-xl text-sm font-semibold
                              bg-zinc-900 text-white hover:bg-zinc-800
                              dark:bg-amber-500 dark:text-zinc-950 dark:hover:bg-amber-400 transition-colors"
                          >
                            <Car className="w-4 h-4" />
                            Solicitar servicio
                          </Link>
                        }
                      />
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
        open={modalCancelacion.isOpen && !!modalCancelacion.solicitud}
        onClose={() => setModalCancelacion({ isOpen: false, solicitud: null })}
        title="Cancelar Servicio"
        size="md"
        footer={
          <>
            <ModalCancelButton onClick={() => setModalCancelacion({ isOpen: false, solicitud: null })} />
            <button
              type="button"
              onClick={handleEnviarWhatsApp}
              disabled={!motivoSeleccionado}
              className="inline-flex h-9 items-center justify-center gap-2 rounded-lg bg-green-600 px-4 text-sm font-semibold text-white transition-colors hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <MessageCircle className="w-4 h-4" />
              Enviar por WhatsApp
            </button>
          </>
        }
      >
        {modalCancelacion.solicitud && (
          <>
            <p className={modalSectionTitleClass}>
              Servicio #{modalCancelacion.solicitud.idservicio}
            </p>
            <div className="mb-4 text-sm text-zinc-600 dark:text-zinc-400 space-y-1">
              <p><strong>Solicitante:</strong> {modalCancelacion.solicitud.solicitante}</p>
              <p><strong>Traslado:</strong> {limpiarTexto(modalCancelacion.solicitud.traslado)}</p>
              <p><strong>Fecha:</strong> {modalCancelacion.solicitud.fecha} - {modalCancelacion.solicitud.hora}</p>
              <p><strong>Costo:</strong> {formatearMoneda(modalCancelacion.solicitud.costototal)}</p>
            </div>

            <div className="space-y-4">
              <div>
                <label className={modalLabelClass}>
                  Motivo de cancelación *
                </label>
                {isLoadingMotivos ? (
                  <div className="flex items-center justify-center py-4">
                    <Loader2 className="w-5 h-5 animate-spin text-primary-600" />
                    <span className="ml-2 text-sm text-zinc-600 dark:text-zinc-400">
                      Cargando motivos...
                    </span>
                  </div>
                ) : (
                  <select
                    value={motivoSeleccionado}
                    onChange={(e) => setMotivoSeleccionado(e.target.value)}
                    className={modalFieldClass}
                    required
                  >
                    <option value="">Seleccionar motivo</option>
                    {motivosCancelacion.map((motivo, index) => (
                      <option key={index} value={motivo}>
                        {motivo}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div>
                <label className={modalLabelClass}>
                  Observaciones
                </label>
                <textarea
                  value={observaciones}
                  onChange={(e) => setObservaciones(e.target.value)}
                  rows={3}
                  className={`${modalFieldClass} h-auto min-h-[80px] py-2 resize-none`}
                  placeholder="Detalles adicionales sobre la cancelación..."
                />
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