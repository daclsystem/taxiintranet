import React, { useState, useEffect, useMemo } from 'react';
import {
  Users, Edit, Loader2, AlertCircle, Shield, UserCheck, CreditCard
} from 'lucide-react';
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
  modalSectionTitleClass,
} from './ui/AppModal';
import { obtenerPersonal, exportarPersonalXLS, guardarPersonal, obtenerDatosPersonal } from '../services/personalService';
import { Personal, PersonalFormData, PersonalDataResponse } from '../types/personal';

const getPersonalDisplayName = (p: Personal) =>
  `${p.nombres || ''} ${p.apellidos || ''}`.trim();

const getPermisosSummary = (p: Personal) => {
  const parts: string[] = [];
  if (p.administrador) parts.push('Admin');
  if (p.jefe) parts.push('Jefe');
  if (p.validador) parts.push('Validador');
  return parts.length ? parts.join(', ') : 'Sin permisos';
};

const PERSONAL_COLUMNS: ColumnMeta[] = [
  {
    id: 'personal',
    label: 'Personal',
    getValue: (r) => {
      const p = r as Personal;
      const name = getPersonalDisplayName(p);
      return name ? `${name} ${p.idpersonal}` : String(p.idpersonal);
    },
  },
  {
    id: 'datos',
    label: 'Datos',
    getValue: (r) => {
      const p = r as Personal;
      return `${p.tipodocumento || ''} ${p.ndocumento || ''}`.trim();
    },
  },
  {
    id: 'contacto',
    label: 'Contacto',
    getValue: (r) => {
      const p = r as Personal;
      return `${p.email || ''} ${p.telefono || ''}`.trim();
    },
  },
  { id: 'area', label: 'Área', getValue: (r) => (r as Personal).area || '' },
  {
    id: 'centroCostos',
    label: 'Centro Costos',
    align: 'center',
    getValue: (r) => (r as Personal).centrocostos || '',
  },
  {
    id: 'jefe',
    label: 'Jefe',
    align: 'center',
    getValue: (r) => (r as Personal).datjefe || '',
  },
  {
    id: 'credito',
    label: 'Crédito',
    align: 'center',
    getValue: (r) => ((r as Personal).credito ? 'Sí' : 'No'),
  },
  {
    id: 'permisos',
    label: 'Permisos',
    align: 'center',
    getValue: (r) => getPermisosSummary(r as Personal),
  },
  {
    id: 'servicios',
    label: 'Servicios',
    align: 'center',
    getValue: (r) => {
      const p = r as Personal;
      return `${p.nservicios ?? ''} ${p.monto ?? ''}`.trim();
    },
  },
  {
    id: 'estado',
    label: 'Estado',
    align: 'center',
    getValue: (r) => ((r as Personal).idestado === 1 ? 'Activo' : 'Inactivo'),
  },
];

interface PersonalManagementProps {
  onVolver: () => void;
}

/**
 * Componente para gestión de personal
 * Permite consultar, crear, editar y exportar personal
 */
export const PersonalManagement: React.FC<PersonalManagementProps> = ({ onVolver }) => {
  const [personal, setPersonal] = useState<Personal[]>([]);
  const [personalFiltrado, setPersonalFiltrado] = useState<Personal[]>([]);
  const [datosConfiguracion, setDatosConfiguracion] = useState<PersonalDataResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingConfig, setIsLoadingConfig] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mostrarModal, setMostrarModal] = useState(false);
  const [personalEditando, setPersonalEditando] = useState<Personal | null>(null);
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

  const [columnFilters, setColumnFilters] = useState(() => createFiltersFromColumns(PERSONAL_COLUMNS));
  const {
    order: columnOrder,
    onDragStart: onColDragStart,
    onDragOver: onColDragOver,
    onDrop: onColDrop,
  } = useColumnOrder(
    'cols-personal',
    PERSONAL_COLUMNS.map((c) => c.id)
  );

  const [formData, setFormData] = useState<PersonalFormData>({
    tipodocumento: 'DNI',
    ndocumento: '',
    apellidos: '',
    nombres: '',
    telefono: '',
    email: '',
    emailverificador: '',
    datjefe: '',
    area: '',
    centrocostos: '',
    administrador: false,
    jefe: false,
    validador: false,
    credito: false,
    idestado: 1,
    tipo: 'Personal',
    cargo: ''
  });

  useEffect(() => {
    cargarPersonal();
  }, []);

  useEffect(() => {
    setPersonalFiltrado(applyGenericColumnFilters(personal, PERSONAL_COLUMNS, columnFilters));
    setPaginaActual(1);
  }, [personal, columnFilters]);

  const cargarPersonal = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await obtenerPersonal();
      setPersonal(response.apersonal);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Error desconocido');
    } finally {
      setIsLoading(false);
    }
  };

  const cargarDatosConfiguracion = async () => {
    try {
      setIsLoadingConfig(true);
      const response = await obtenerDatosPersonal();
      setDatosConfiguracion(response);
    } catch (error) {
      console.error('Error al cargar datos de configuración:', error);
    } finally {
      setIsLoadingConfig(false);
    }
  };

  const handleColumnFilterChange = (key: string, value: ColumnFilterValue) => {
    setColumnFilters((prev) => ({ ...prev, [key]: value }));
  };

  const columnsById = useMemo(() => {
    const map = new Map(PERSONAL_COLUMNS.map((c) => [c.id, c]));
    return map;
  }, []);

  const handleNuevoPersonal = async () => {
    setPersonalEditando(null);
    setFormData({
      tipodocumento: 'DNI',
      ndocumento: '',
      apellidos: '',
      nombres: '',
      telefono: '',
      email: '',
      emailverificador: '',
      datjefe: '',
      area: '',
      centrocostos: '',
      administrador: false,
      jefe: false,
      validador: false,
      credito: false,
      idestado: 1,
      tipo: 'Personal',
      cargo: ''
    });
    await cargarDatosConfiguracion();
    setMostrarModal(true);
  };

  const handleEditarPersonal = async (personalItem: Personal) => {
    setPersonalEditando(personalItem);
    setFormData({
      tipodocumento: personalItem.tipodocumento || 'DNI',
      ndocumento: personalItem.ndocumento || '',
      apellidos: personalItem.apellidos || '',
      nombres: personalItem.nombres || '',
      telefono: personalItem.telefono || '',
      email: personalItem.email || '',
      emailverificador: personalItem.emailverificador || '',
      datjefe: personalItem.datjefe || '',
      area: personalItem.area || '',
      centrocostos: personalItem.centrocostos || '',
      administrador: personalItem.administrador,
      jefe: personalItem.jefe,
      validador: personalItem.validador,
      credito: personalItem.credito,
      idestado: personalItem.idestado,
      tipo: personalItem.tipo || 'Personal',
      cargo: personalItem.cargo || ''
    });
    await cargarDatosConfiguracion();
    setMostrarModal(true);
  };

  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validaciones
    if (!formData.nombres.trim()) {
      setError('El nombre es requerido');
      return;
    }
    
    if (!formData.apellidos.trim()) {
      setError('Los apellidos son requeridos');
      return;
    }

    setMostrarConfirmacion(true);
  };

  const confirmarGuardar = async () => {
    try {
      setMostrarConfirmacion(false);
      setError(null);
      
      const personalData = {
        idpersonal: personalEditando ? personalEditando.idpersonal : 0,
        tipodocumento: formData.tipodocumento,
        ndocumento: formData.ndocumento.trim(),
        apellidos: formData.apellidos.trim(),
        nombres: formData.nombres.trim(),
        telefono: formData.telefono.trim(),
        email: formData.email.trim(),
        emailverificador: formData.emailverificador.trim(),
        datjefe: formData.datjefe,
        area: formData.area,
        centrocostos: formData.centrocostos,
        administrador: formData.administrador,
        jefe: formData.jefe,
        validador: formData.validador,
        credito: formData.credito,
        idestado: formData.idestado,
        tipo: formData.tipo,
        cargo: formData.cargo.trim()
      };

      await guardarPersonal(personalData);
      
      setMostrarModal(false);
      setToast({
        isVisible: true,
        message: personalEditando 
          ? 'Personal actualizado exitosamente' 
          : 'Personal registrado exitosamente',
        type: 'success'
      });
      await cargarPersonal();
      
    } catch (error) {
      setToast({
        isVisible: true,
        message: error instanceof Error ? error.message : 'Error al guardar el personal',
        type: 'error'
      });
    }
  };

  const handleExportar = () => {
    exportarPersonalXLS(personalFiltrado);
  };

  // Paginación
  const totalPaginas = Math.ceil(personalFiltrado.length / itemsPorPagina);
  const indiceInicio = (paginaActual - 1) * itemsPorPagina;
  const indiceFin = indiceInicio + itemsPorPagina;
  const personalActual = personalFiltrado.slice(indiceInicio, indiceFin);

  const formatearMoneda = (monto: number): string => {
    return `S/ ${monto.toFixed(2)}`;
  };

  const obtenerBadgesPermisos = (personalItem: Personal) => {
    const badges = [];
    if (personalItem.administrador) badges.push({ text: 'Admin', color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' });
    if (personalItem.jefe) badges.push({ text: 'Jefe', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' });
    if (personalItem.validador) badges.push({ text: 'Validador', color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' });
    if (personalItem.credito) badges.push({ text: 'Crédito', color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' });
    return badges;
  };

  if (isLoading && personal.length === 0) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-primary-600 mx-auto mb-4" />
          <p className="text-zinc-600 dark:text-zinc-400">Cargando personal...</p>
        </div>
      </div>
    );
  }

  return (
    <ListPageShell>
      <ListPageHeader
        title="Gestión de Personal"
        icon={Users}
        count={personalFiltrado.length}
        countLabel="personas"
        onVolver={onVolver}
      />

      <ListPageBody>
        <ListPageActions
          title="Listado de personal"
          subtitle="Filtra por columna o arrastra el encabezado para mover columnas"
          onConsultar={cargarPersonal}
          onNuevo={handleNuevoPersonal}
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
                  columns={PERSONAL_COLUMNS}
                  columnOrder={columnOrder}
                  rows={personal}
                  filters={columnFilters}
                  onChange={handleColumnFilterChange}
                  onDragStart={onColDragStart}
                  onDragOver={onColDragOver}
                  onDrop={onColDrop}
                />
              </thead>
              <tbody>
                {personalActual.length > 0 ? (
                  personalActual.map((personalItem) => (
                    <tr key={personalItem.idpersonal}>
                      <td className="whitespace-nowrap sticky left-0 bg-white dark:bg-zinc-950 z-10 text-center">
                        <button
                          type="button"
                          onClick={() => handleEditarPersonal(personalItem)}
                          className="inline-flex h-7 w-7 items-center justify-center rounded-lg text-sky-600 dark:text-sky-400 hover:bg-sky-500/10 transition-colors"
                          title="Editar personal"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                      </td>
                      {columnOrder.map((colId) => {
                        if (colId === 'personal') {
                          return (
                            <td key={colId}>
                              <div className="text-sm font-medium text-zinc-900 dark:text-white">
                                {getPersonalDisplayName(personalItem) || '—'}
                              </div>
                              <div className="text-sm text-zinc-500 dark:text-zinc-400">
                                ID: {personalItem.idpersonal}
                              </div>
                            </td>
                          );
                        }
                        if (colId === 'datos') {
                          return (
                            <td key={colId}>
                              <div className="text-sm text-zinc-900 dark:text-white">
                                {personalItem.ndocumento || '—'}
                              </div>
                            </td>
                          );
                        }
                        if (colId === 'contacto') {
                          return (
                            <td key={colId}>
                              <div className="text-sm text-zinc-900 dark:text-white">
                                {personalItem.email || '—'}
                              </div>
                              <div className="text-sm text-zinc-500 dark:text-zinc-400">
                                {personalItem.telefono || '—'}
                              </div>
                            </td>
                          );
                        }
                        if (colId === 'area') {
                          return (
                            <td key={colId}>
                              <div className="text-sm text-zinc-900 dark:text-white">
                                {personalItem.area || '—'}
                              </div>
                            </td>
                          );
                        }
                        if (colId === 'centroCostos') {
                          return (
                            <td key={colId} className="text-center">
                              <div className="text-sm text-zinc-900 dark:text-white">
                                {personalItem.centrocostos || '—'}
                              </div>
                            </td>
                          );
                        }
                        if (colId === 'jefe') {
                          return (
                            <td key={colId} className="text-center">
                              <div className="text-sm text-zinc-900 dark:text-white">
                                {personalItem.datjefe || '—'}
                              </div>
                            </td>
                          );
                        }
                        if (colId === 'credito') {
                          return (
                            <td key={colId} className="text-center">
                              {personalItem.credito ? (
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
                                  <CreditCard className="w-3 h-3 mr-1" />
                                  Sí
                                </span>
                              ) : (
                                <span className="text-xs text-gray-400">No</span>
                              )}
                            </td>
                          );
                        }
                        if (colId === 'permisos') {
                          const badges = obtenerBadgesPermisos(personalItem).filter(
                            (badge) => badge.text !== 'Crédito'
                          );
                          return (
                            <td key={colId}>
                              <div className="flex flex-wrap gap-1 justify-center">
                                {badges.map((badge, index) => (
                                  <span
                                    key={index}
                                    className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${badge.color}`}
                                  >
                                    {badge.text}
                                  </span>
                                ))}
                                {badges.length === 0 && (
                                  <span className="text-xs text-gray-400">Sin permisos</span>
                                )}
                              </div>
                            </td>
                          );
                        }
                        if (colId === 'servicios') {
                          return (
                            <td key={colId} className="text-center">
                              <div className="text-sm">
                                <div className="font-semibold text-zinc-900 dark:text-white">
                                  {personalItem.nservicios}
                                </div>
                                <div className="text-xs text-zinc-500 dark:text-zinc-400">
                                  {formatearMoneda(personalItem.monto)}
                                </div>
                              </div>
                            </td>
                          );
                        }
                        if (colId === 'estado') {
                          return (
                            <td key={colId} className="text-center">
                              <span
                                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                  personalItem.idestado === 1
                                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200'
                                    : 'bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300'
                                }`}
                              >
                                {personalItem.idestado === 1 ? 'Activo' : 'Inactivo'}
                              </span>
                            </td>
                          );
                        }
                        return <td key={colId}>{columnsById.get(colId)?.getValue(personalItem)}</td>;
                      })}
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={1 + columnOrder.length} className="px-6 py-12 text-center">
                      <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-zinc-500 dark:text-zinc-400">
                        {hasAnyColumnFilter(columnFilters)
                          ? 'No se encontró personal con los filtros de columna'
                          : 'No hay personal registrado'}
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
                  Mostrando {indiceInicio + 1} a {Math.min(indiceFin, personalFiltrado.length)} de {personalFiltrado.length} resultados
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
        title={personalEditando ? 'Editar Personal' : 'Nuevo Personal'}
        size="xl"
        busy={isLoading}
        footer={
          !isLoadingConfig ? (
            <>
              <ModalCancelButton onClick={() => setMostrarModal(false)} disabled={isLoading} />
              <ModalPrimaryButton type="submit" form="personal-form" loading={isLoading}>
                {personalEditando ? 'Actualizar' : 'Crear'}
              </ModalPrimaryButton>
            </>
          ) : undefined
        }
      >
        {isLoadingConfig ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
            <span className="ml-2 text-zinc-600 dark:text-zinc-400">
              Cargando configuración...
            </span>
          </div>
        ) : (
          <form id="personal-form" onSubmit={handleSubmitForm} className="space-y-6">
            <div>
              <p className={modalSectionTitleClass}>Información Personal</p>
              <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <label className={modalLabelClass}>
                          Nombres *
                        </label>
                        <input
                          type="text"
                          value={formData.nombres}
                          onChange={(e) => setFormData(prev => ({ ...prev, nombres: e.target.value }))}
                          className={modalFieldClass}
                          placeholder="Ingresa los nombres"
                          required
                        />
                      </div>
                      <div>
                        <label className={modalLabelClass}>
                          Apellidos *
                        </label>
                        <input
                          type="text"
                          value={formData.apellidos}
                          onChange={(e) => setFormData(prev => ({ ...prev, apellidos: e.target.value }))}
                          className={modalFieldClass}
                          placeholder="Ingresa los apellidos"
                          required
                        />
                      </div>
                      <div>
                        <label className={modalLabelClass}>
                          Tipo de Documento
                        </label>
                        <select
                          value={formData.tipodocumento}
                          onChange={(e) => setFormData(prev => ({ ...prev, tipodocumento: e.target.value }))}
                          className={modalFieldClass}
                        >
                          <option value="DNI">DNI</option>
                          <option value="CE">Carnet de Extranjería</option>
                          <option value="PASAPORTE">Pasaporte</option>
                          <option value="NINGUNO">Ninguno</option>
                        </select>
                      </div>
                      <div>
                        <label className={modalLabelClass}>
                          Número de Documento
                        </label>
                        <input
                          type="text"
                          value={formData.ndocumento}
                          onChange={(e) => setFormData(prev => ({ ...prev, ndocumento: e.target.value }))}
                          className={modalFieldClass}
                          placeholder="Número de documento"
                        />
                      </div>
                      <div>
                        <label className={modalLabelClass}>
                          Teléfono
                        </label>
                        <input
                          type="tel"
                          value={formData.telefono}
                          onChange={(e) => setFormData(prev => ({ ...prev, telefono: e.target.value }))}
                          className={modalFieldClass}
                          placeholder="Número de teléfono"
                        />
                      </div>
                      <div>
                        <label className={modalLabelClass}>
                          Email
                        </label>
                        <input
                          type="email"
                          value={formData.email}
                          onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                          className={modalFieldClass}
                          placeholder="Correo electrónico"
                        />
                      </div>
                      <div>
                        <label className={modalLabelClass}>
                          Email Verificador
                        </label>
                        <input
                          type="email"
                          value={formData.emailverificador}
                          onChange={(e) => setFormData(prev => ({ ...prev, emailverificador: e.target.value }))}
                          className={modalFieldClass}
                          placeholder="Email verificador"
                        />
                      </div>
                      <div>
                        <label className={modalLabelClass}>
                          Cargo
                        </label>
                        <input
                          type="text"
                          value={formData.cargo}
                          onChange={(e) => setFormData(prev => ({ ...prev, cargo: e.target.value }))}
                          className={modalFieldClass}
                          placeholder="Cargo o posición"
                        />
                      </div>
              </div>
            </div>

            <div>
              <p className={modalSectionTitleClass}>Configuración Organizacional</p>
              <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <label className={modalLabelClass}>
                          Tipo
                        </label>
                        <select
                          value={formData.tipo}
                          onChange={(e) => setFormData(prev => ({ ...prev, tipo: e.target.value }))}
                          className={modalFieldClass}
                        >
                          <option value="Personal">Personal</option>
                          <option value="Invitado">Invitado</option>
                        </select>
                      </div>
                      <div>
                        <label className={modalLabelClass}>
                          Jefe
                        </label>
                        <select
                          value={formData.datjefe}
                          onChange={(e) => setFormData(prev => ({ ...prev, datjefe: e.target.value }))}
                          className={modalFieldClass}
                        >
                          <option value="">Seleccionar jefe</option>
                          {datosConfiguracion?.apjefe.map((jefe, index) => (
                            <option key={index} value={jefe.datjefe}>
                              {jefe.datjefe}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className={modalLabelClass}>
                          Área
                        </label>
                        <select
                          value={formData.area}
                          onChange={(e) => setFormData(prev => ({ ...prev, area: e.target.value }))}
                          className={modalFieldClass}
                        >
                          <option value="">Seleccionar área</option>
                          {datosConfiguracion?.aparea.map((area, index) => (
                            <option key={index} value={area.area}>
                              {area.area}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className={modalLabelClass}>
                          Centro de Costos
                        </label>
                        <select
                          value={formData.centrocostos}
                          onChange={(e) => setFormData(prev => ({ ...prev, centrocostos: e.target.value }))}
                          className={modalFieldClass}
                        >
                          <option value="">Seleccionar centro de costos</option>
                          {datosConfiguracion?.apcentrocostos.map((centro, index) => (
                            <option key={index} value={centro.centrocostos}>
                              {centro.centrocostos}
                            </option>
                          ))}
                        </select>
                      </div>
              </div>
            </div>

            <div>
              <p className={modalSectionTitleClass}>Permisos y Configuración</p>
              <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-3">
                        <label className="flex items-center">
                          <input
                            type="checkbox"
                            checked={formData.administrador}
                            onChange={(e) => setFormData(prev => ({ ...prev, administrador: e.target.checked }))}
                            className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                          />
                          <span className="ml-2 text-sm font-medium text-zinc-700 dark:text-zinc-300 flex items-center">
                            <Shield className="w-4 h-4 mr-1 text-red-500" />
                            Administrador
                          </span>
                        </label>
                        <label className="flex items-center">
                          <input
                            type="checkbox"
                            checked={formData.jefe}
                            onChange={(e) => setFormData(prev => ({ ...prev, jefe: e.target.checked }))}
                            className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                          />
                          <span className="ml-2 text-sm font-medium text-zinc-700 dark:text-zinc-300 flex items-center">
                            <UserCheck className="w-4 h-4 mr-1 text-blue-500" />
                            Jefe
                          </span>
                        </label>
                      </div>
                      <div className="space-y-3">
                        <label className="flex items-center">
                          <input
                            type="checkbox"
                            checked={formData.validador}
                            onChange={(e) => setFormData(prev => ({ ...prev, validador: e.target.checked }))}
                            className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                          />
                          <span className="ml-2 text-sm font-medium text-zinc-700 dark:text-zinc-300 flex items-center">
                            <UserCheck className="w-4 h-4 mr-1 text-green-500" />
                            Validador
                          </span>
                        </label>
                        <label className="flex items-center">
                          <input
                            type="checkbox"
                            checked={formData.credito}
                            onChange={(e) => setFormData(prev => ({ ...prev, credito: e.target.checked }))}
                            className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                          />
                          <span className="ml-2 text-sm font-medium text-zinc-700 dark:text-zinc-300 flex items-center">
                            <CreditCard className="w-4 h-4 mr-1 text-yellow-500" />
                            Crédito
                          </span>
                        </label>
                      </div>
              </div>
            </div>

            {personalEditando && (
              <div>
                <p className={modalSectionTitleClass}>Estado</p>
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
                          Personal activo
                        </span>
                </label>
              </div>
            )}
          </form>
        )}
      </AppModal>

      {/* Diálogo de Confirmación */}
      <ConfirmDialog
        isOpen={mostrarConfirmacion}
        title={personalEditando ? 'Confirmar Actualización' : 'Confirmar Registro'}
        message={personalEditando 
          ? `¿Estás seguro de que deseas actualizar a "${formData.nombres} ${formData.apellidos}"?`
          : `¿Estás seguro de que deseas registrar a "${formData.nombres} ${formData.apellidos}"?`
        }
        confirmText={personalEditando ? 'Actualizar' : 'Registrar'}
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
