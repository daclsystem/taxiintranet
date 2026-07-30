import React, { useState, useEffect, useMemo } from 'react';
import { DollarSign, Edit, Loader2, AlertCircle, Eye, EyeOff } from 'lucide-react';
import {
  ListPageActions,
  ListPageBody,
  ListPageHeader,
  ListPageShell,
  ListTableCard,
} from './ui/ListPageUI';
import {
  applyGenericColumnFilters,
  createFiltersFromColumns,
  ReorderableFilterHead,
  useColumnOrder,
  type ColumnMeta,
} from './ui/ManagementColumnFilters';
import { ColumnFilterValue, hasAnyColumnFilter } from './ui/ColumnFilter';
import { Toast } from './Toast';
import { ConfirmDialog } from './ConfirmDialog';
import {
  AppModal,
  ModalCancelButton,
  ModalPrimaryButton,
  modalFieldClass,
  modalLabelClass,
} from './ui/AppModal';
import { obtenerCentrosCostos, exportarCentrosCostosXLS, guardarCentroCostos } from '../services/centroCostosService';
import { CentroCostos, CentroCostosFormData } from '../types/centroCostos';

const CENTRO_COSTOS_COLUMNS: ColumnMeta[] = [
  { id: 'centrocostos', label: 'Centro de Costos', getValue: (r) => (r as CentroCostos).centrocostos || '' },
  { id: 'modalidad', label: 'Modalidad', getValue: (r) => (r as CentroCostos).modalidad || '' },
  {
    id: 'nservicios',
    label: 'N° Servicios',
    align: 'center',
    getValue: (r) => String((r as CentroCostos).nservicios ?? ''),
  },
  {
    id: 'monto',
    label: 'Monto',
    align: 'right',
    getValue: (r) => String((r as CentroCostos).monto ?? ''),
  },
  {
    id: 'estado',
    label: 'Estado',
    align: 'center',
    getValue: (r) => ((r as CentroCostos).idestado === 1 ? 'Activo' : 'Inactivo'),
  },
];

interface CentroCostosManagementProps {
  onVolver: () => void;
}

/**
 * Componente para gestión de centros de costos
 * Permite consultar, crear, editar y exportar centros de costos
 */
export const CentroCostosManagement: React.FC<CentroCostosManagementProps> = ({ onVolver }) => {
  const [centrosCostos, setCentrosCostos] = useState<CentroCostos[]>([]);
  const [centrosCostosFiltrados, setCentrosCostosFiltrados] = useState<CentroCostos[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mostrarModal, setMostrarModal] = useState(false);
  const [centroCostosEditando, setCentroCostosEditando] = useState<CentroCostos | null>(null);
  const [paginaActual, setPaginaActual] = useState(1);
  const [itemsPorPagina] = useState(50);
  const [mostrarConfirmacion, setMostrarConfirmacion] = useState(false);
  const [toast, setToast] = useState<{
    isVisible: boolean;
    message: string;
    type: 'success' | 'error';
  }>({
    isVisible: false,
    message: '',
    type: 'success'
  });

  const [columnFilters, setColumnFilters] = useState(() => createFiltersFromColumns(CENTRO_COSTOS_COLUMNS));
  const {
    order: columnOrder,
    onDragStart: onColDragStart,
    onDragOver: onColDragOver,
    onDrop: onColDrop,
  } = useColumnOrder(
    'cols-centro-costos',
    CENTRO_COSTOS_COLUMNS.map((c) => c.id)
  );

  const [formData, setFormData] = useState<CentroCostosFormData>({
    centrocostos: '',
    modalidad: '',
    colorcelda: '#FFFF80',
    colortexto: '#000000',
    idestado: 1
  });

  useEffect(() => {
    cargarCentrosCostos();
  }, []);

  useEffect(() => {
    setCentrosCostosFiltrados(applyGenericColumnFilters(centrosCostos, CENTRO_COSTOS_COLUMNS, columnFilters));
    setPaginaActual(1);
  }, [centrosCostos, columnFilters]);

  const cargarCentrosCostos = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await obtenerCentrosCostos();
      setCentrosCostos(response.acentrocostos);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Error desconocido');
    } finally {
      setIsLoading(false);
    }
  };

  const handleColumnFilterChange = (key: string, value: ColumnFilterValue) => {
    setColumnFilters((prev) => ({ ...prev, [key]: value }));
  };

  const columnsById = useMemo(() => {
    const map = new Map(CENTRO_COSTOS_COLUMNS.map((c) => [c.id, c]));
    return map;
  }, []);

  const handleNuevoCentroCostos = () => {
    setCentroCostosEditando(null);
    setFormData({
      centrocostos: '',
      modalidad: '',
      colorcelda: '#FFFF80',
      colortexto: '#000000',
      idestado: 1
    });
    setMostrarModal(true);
  };

  const handleEditarCentroCostos = (centroCostos: CentroCostos) => {
    setCentroCostosEditando(centroCostos);
    setFormData({
      centrocostos: centroCostos.centrocostos,
      modalidad: centroCostos.modalidad,
      colorcelda: centroCostos.colorcelda,
      colortexto: centroCostos.colortexto,
      idestado: centroCostos.idestado
    });
    setMostrarModal(true);
  };

  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validaciones
    if (!formData.centrocostos.trim()) {
      setError('El nombre del centro de costos es requerido');
      return;
    }

    setMostrarConfirmacion(true);
  };

  const confirmarGuardar = async () => {
    try {
      setMostrarConfirmacion(false);
      setError(null);
      
      const centroCostosData = {
        idcentrocostos: centroCostosEditando ? centroCostosEditando.idcentrocostos : 0,
        centrocostos: formData.centrocostos.trim(),
        idestado: formData.idestado
      };

      await guardarCentroCostos(centroCostosData);
      
      setMostrarModal(false);
      setToast({
        isVisible: true,
        message: centroCostosEditando 
          ? 'Centro de costos actualizado exitosamente' 
          : 'Centro de costos registrado exitosamente',
        type: 'success'
      });
      await cargarCentrosCostos();
      
    } catch (error) {
      setToast({
        isVisible: true,
        message: error instanceof Error ? error.message : 'Error al guardar el centro de costos',
        type: 'error'
      });
    }
  };

  const handleExportar = () => {
    exportarCentrosCostosXLS(centrosCostosFiltrados);
  };

  // Paginación
  const totalPaginas = Math.ceil(centrosCostosFiltrados.length / itemsPorPagina);
  const indiceInicio = (paginaActual - 1) * itemsPorPagina;
  const indiceFin = indiceInicio + itemsPorPagina;
  const centrosCostosActuales = centrosCostosFiltrados.slice(indiceInicio, indiceFin);

  const formatearMoneda = (monto: number): string => {
    return `S/ ${monto.toFixed(2)}`;
  };

  if (isLoading && centrosCostos.length === 0) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-primary-600 mx-auto mb-4" />
          <p className="text-zinc-600 dark:text-zinc-400">Cargando centros de costos...</p>
        </div>
      </div>
    );
  }

  return (
    <ListPageShell>
      <ListPageHeader
        title="Gestión de Centros de Costos"
        icon={DollarSign}
        count={centrosCostosFiltrados.length}
        countLabel="centros"
        onVolver={onVolver}
      />

      <ListPageBody>
        <ListPageActions
          title="Listado de centros de costos"
          subtitle="Filtra por columna o arrastra el encabezado para mover columnas"
          onConsultar={cargarCentrosCostos}
          onNuevo={handleNuevoCentroCostos}
          onExportar={handleExportar}
          isLoading={isLoading}
        />

        {error && (
          <div className="shrink-0 mb-3 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
            <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
          </div>
        )}

        <ListTableCard>
          <div className="flex-1 min-h-0 overflow-x-auto overflow-y-auto scrollbar-thin scrollbar-thumb-zinc-400 scrollbar-track-transparent">
            <table className="zm-table">
              <thead className="sticky top-0 z-20">
                <ReorderableFilterHead
                  columns={CENTRO_COSTOS_COLUMNS}
                  columnOrder={columnOrder}
                  rows={centrosCostos}
                  filters={columnFilters}
                  onChange={handleColumnFilterChange}
                  onDragStart={onColDragStart}
                  onDragOver={onColDragOver}
                  onDrop={onColDrop}
                />
              </thead>
              <tbody>
                {centrosCostosActuales.length > 0 ? (
                  centrosCostosActuales.map((centroCostos) => (
                    <tr key={centroCostos.idcentrocostos}>
                      <td className="whitespace-nowrap sticky left-0 bg-white dark:bg-zinc-950 z-10 text-center">
                        <button
                          type="button"
                          onClick={() => handleEditarCentroCostos(centroCostos)}
                          className="inline-flex h-7 w-7 items-center justify-center rounded-lg text-sky-600 dark:text-sky-400 hover:bg-sky-500/10 transition-colors"
                          title="Editar centro de costos"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                      </td>
                      {columnOrder.map((colId) => {
                        if (colId === 'centrocostos') {
                          return (
                            <td key={colId}>
                              <span className="max-w-xs truncate block" title={centroCostos.centrocostos}>
                                {centroCostos.centrocostos}
                              </span>
                            </td>
                          );
                        }
                        if (colId === 'modalidad') {
                          return <td key={colId}>{centroCostos.modalidad || '—'}</td>;
                        }
                        if (colId === 'nservicios') {
                          return (
                            <td key={colId} className="text-center">
                              {centroCostos.nservicios}
                            </td>
                          );
                        }
                        if (colId === 'monto') {
                          return (
                            <td key={colId} className="text-right font-semibold">
                              {formatearMoneda(centroCostos.monto)}
                            </td>
                          );
                        }
                        if (colId === 'estado') {
                          return (
                            <td key={colId} className="text-center">
                              <span
                                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                  centroCostos.idestado === 1
                                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200'
                                    : 'bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300'
                                }`}
                              >
                                {centroCostos.idestado === 1 ? (
                                  <>
                                    <Eye className="w-3 h-3 mr-1" />
                                    Activo
                                  </>
                                ) : (
                                  <>
                                    <EyeOff className="w-3 h-3 mr-1" />
                                    Inactivo
                                  </>
                                )}
                              </span>
                            </td>
                          );
                        }
                        return <td key={colId}>{columnsById.get(colId)?.getValue(centroCostos)}</td>;
                      })}
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={1 + columnOrder.length} className="px-6 py-12 text-center">
                      <DollarSign className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-zinc-500 dark:text-zinc-400">
                        {hasAnyColumnFilter(columnFilters)
                          ? 'No se encontraron centros de costos con los filtros de columna'
                          : 'No hay centros de costos registrados'}
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
                  Mostrando {indiceInicio + 1} a {Math.min(indiceFin, centrosCostosFiltrados.length)} de {centrosCostosFiltrados.length} resultados
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
        open={mostrarModal}
        onClose={() => setMostrarModal(false)}
        title={centroCostosEditando ? 'Editar Centro de Costos' : 'Nuevo Centro de Costos'}
        size="sm"
        footer={
          <>
            <ModalCancelButton onClick={() => setMostrarModal(false)} />
            <ModalPrimaryButton type="submit" form="centro-costos-form">
              {centroCostosEditando ? 'Actualizar' : 'Crear'}
            </ModalPrimaryButton>
          </>
        }
      >
        <form id="centro-costos-form" onSubmit={handleSubmitForm} className="space-y-4">
          <div>
            <label className={modalLabelClass}>
              Nombre del Centro de Costos *
            </label>
            <input
              type="text"
              value={formData.centrocostos}
              onChange={(e) => setFormData(prev => ({ ...prev, centrocostos: e.target.value }))}
              className={modalFieldClass}
              placeholder="Ingresa el nombre del centro de costos"
              required
            />
          </div>

          {centroCostosEditando && (
            <div>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.idestado === 1}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    idestado: e.target.checked ? 1 : 2
                  }))}
                  className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                />
                <span className="ml-2 text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  Centro de costos activo
                </span>
              </label>
            </div>
          )}
        </form>
      </AppModal>

      {/* Diálogo de Confirmación */}
      <ConfirmDialog
        isOpen={mostrarConfirmacion}
        title={centroCostosEditando ? 'Confirmar Actualización' : 'Confirmar Registro'}
        message={centroCostosEditando 
          ? `¿Estás seguro de que deseas actualizar el centro de costos "${formData.centrocostos}"?`
          : `¿Estás seguro de que deseas registrar el centro de costos "${formData.centrocostos}"?`
        }
        confirmText={centroCostosEditando ? 'Actualizar' : 'Registrar'}
        onConfirm={confirmarGuardar}
        onCancel={() => setMostrarConfirmacion(false)}
        type="info"
      />

      {/* Toast de Notificación */}
      <Toast
        message={toast.message}
        type={toast.type}
        isVisible={toast.isVisible}
        onClose={() => setToast(prev => ({ ...prev, isVisible: false }))}
      />
    </ListPageShell>
  );
};
