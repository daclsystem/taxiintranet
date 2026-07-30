import React, { useState, useEffect } from 'react';
import { 
  User, Loader2, AlertCircle, Mail, Phone, Building, 
  Shield, UserCheck, CreditCard, Eye, EyeOff, Lock, Save
} from 'lucide-react';
import { Toast } from './Toast';
import {
  AppModal,
  ModalCancelButton,
  ModalPrimaryButton,
  modalFieldClass,
  modalLabelClass,
} from './ui/AppModal';
import {
  ListPageBody,
  ListPageHeader,
  ListPageShell,
} from './ui/ListPageUI';
import { obtenerPerfil } from '../services/perfilService';
import { recuperarPassword, actualizarPassword, cambiarContrasena, limpiarSesion, obtenerSesion } from '../services/authService';
import { PerfilResponse, ActualizarPasswordData } from '../types/perfil';

interface PerfilProps {
  onVolver: () => void;
}

/**
 * Componente Perfil - Muestra información del usuario y permite cambiar contraseña
 */
export const Perfil: React.FC<PerfilProps> = ({ onVolver }) => {
  const [perfilData, setPerfilData] = useState<PerfilResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mostrarModalPassword, setMostrarModalPassword] = useState(false);
  const [mostrarModalDirectPassword, setMostrarModalDirectPassword] = useState(false);
  const [isLoadingPassword, setIsLoadingPassword] = useState(false);
  const [pasoPassword, setPasoPassword] = useState<'solicitar' | 'verificar'>('solicitar');
  const [idPersonalRecuperacion, setIdPersonalRecuperacion] = useState<number | null>(null);
  const [showPasswords, setShowPasswords] = useState({
    nueva: false,
    confirmar: false,
    actual: false
  });

  const [passwordData, setPasswordData] = useState<ActualizarPasswordData>({
    codigoVerificacion: '',
    nuevaPassword: '',
    confirmarPassword: ''
  });

  // Estado para cambio directo de contraseña
  const [directPasswordData, setDirectPasswordData] = useState({
    nuevaPassword: '',
    confirmarPassword: ''
  });

  const [passwordErrors, setPasswordErrors] = useState<{
    codigoVerificacion?: string;
    nuevaPassword?: string;
    confirmarPassword?: string;
    general?: string;
  }>({});

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
    cargarPerfil();
  }, []);

  const cargarPerfil = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await obtenerPerfil();
      setPerfilData(data);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Error desconocido');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordChange = (field: keyof ActualizarPasswordData, value: string) => {
    setPasswordData(prev => ({ ...prev, [field]: value }));
    if (passwordErrors[field]) {
      setPasswordErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const togglePasswordVisibility = (field: 'actual' | 'nueva' | 'confirmar') => {
    setShowPasswords(prev => ({ ...prev, [field]: !prev[field] }));
  };

  const validatePasswordForm = (): boolean => {
    const newErrors: typeof passwordErrors = {};

    if (pasoPassword === 'verificar') {
      if (!passwordData.codigoVerificacion.trim()) {
        newErrors.codigoVerificacion = 'El código es requerido';
      } else if (passwordData.codigoVerificacion.length !== 6) {
        newErrors.codigoVerificacion = 'El código debe tener 6 dígitos';
      }
    }

    if (!passwordData.nuevaPassword.trim()) {
      newErrors.nuevaPassword = 'La nueva contraseña es requerida';
    } else if (passwordData.nuevaPassword.length < 6) {
      newErrors.nuevaPassword = 'La contraseña debe tener al menos 6 caracteres';
    }

    if (!passwordData.confirmarPassword.trim()) {
      newErrors.confirmarPassword = 'Confirma la nueva contraseña';
    } else if (passwordData.nuevaPassword !== passwordData.confirmarPassword) {
      newErrors.confirmarPassword = 'Las contraseñas no coinciden';
    }

    setPasswordErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSolicitarCodigo = async () => {
    if (!perfilData) return;

    setIsLoadingPassword(true);
    setPasswordErrors({});

    try {
      // Usar API /Accesoemailrecupera
      const response = await recuperarPassword(perfilData.operfilu.email);
      
      if (response.estatus === 200) {
        setIdPersonalRecuperacion(response.idpersonal);
        setPasoPassword('verificar');
        setToast({
          isVisible: true,
          message: 'Código de verificación enviado a tu correo',
          type: 'success'
        });
      } else {
        setPasswordErrors({ 
          general: response.message || 'Error al enviar código de verificación' 
        });
      }
    } catch (error) {
      setPasswordErrors({ 
        general: error instanceof Error ? error.message : 'Error de conexión' 
      });
    } finally {
      setIsLoadingPassword(false);
    }
  };

  const handleActualizarPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validatePasswordForm() || !idPersonalRecuperacion) return;

    setIsLoadingPassword(true);
    setPasswordErrors({});

    try {
      // Usar API /Contrasenaa
      const response = await actualizarPassword(
        idPersonalRecuperacion,
        passwordData.codigoVerificacion,
        passwordData.nuevaPassword
      );

      if (response.estatus === 200) {
        setToast({
          isVisible: true,
          message: 'Contraseña actualizada exitosamente. Cerrando sesión...',
          type: 'success'
        });

        // Cerrar modal
        setMostrarModalPassword(false);

        // Cerrar sesión después de 2 segundos
        setTimeout(() => {
          limpiarSesion();
          window.location.reload();
        }, 2000);
      } else {
        setPasswordErrors({ 
          general: response.message || 'Error al actualizar contraseña' 
        });
      }
    } catch (error) {
      setPasswordErrors({ 
        general: error instanceof Error ? error.message : 'Error de conexión' 
      });
    } finally {
      setIsLoadingPassword(false);
    }
  };

  const resetPasswordForm = () => {
    setPasoPassword('solicitar');
    setIdPersonalRecuperacion(null);
    setPasswordData({
      codigoVerificacion: '',
      nuevaPassword: '',
      confirmarPassword: ''
    });
    setPasswordErrors({});
    setShowPasswords({
      nueva: false,
      confirmar: false,
      actual: false
    });
  };

  const handleDirectPasswordChange = (field: 'nuevaPassword' | 'confirmarPassword', value: string) => {
    setDirectPasswordData(prev => ({ ...prev, [field]: value }));
    if (passwordErrors[field]) {
      setPasswordErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const validateDirectPasswordForm = (): boolean => {
    const newErrors: typeof passwordErrors = {};

    if (!directPasswordData.nuevaPassword.trim()) {
      newErrors.nuevaPassword = 'La nueva contraseña es requerida';
    } else if (directPasswordData.nuevaPassword.length < 6) {
      newErrors.nuevaPassword = 'La contraseña debe tener al menos 6 caracteres';
    }

    if (!directPasswordData.confirmarPassword.trim()) {
      newErrors.confirmarPassword = 'Confirma la nueva contraseña';
    } else if (directPasswordData.nuevaPassword !== directPasswordData.confirmarPassword) {
      newErrors.confirmarPassword = 'Las contraseñas no coinciden';
    }

    setPasswordErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleCambiarContrasenaDirecta = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateDirectPasswordForm()) return;

    const session = obtenerSesion();
    if (!session || !session.idpersonal) {
      setPasswordErrors({ general: 'Sesión no válida' });
      return;
    }

    setIsLoadingPassword(true);
    setPasswordErrors({});

    try {
      const response = await cambiarContrasena(
        session.idpersonal,
        directPasswordData.nuevaPassword
      );

      if (response.estatus === 200) {
        setToast({
          isVisible: true,
          message: 'Contraseña actualizada exitosamente. Cerrando sesión...',
          type: 'success'
        });

        // Cerrar modal
        setMostrarModalDirectPassword(false);

        // Cerrar sesión después de 2 segundos
        setTimeout(() => {
          limpiarSesion();
          window.location.reload();
        }, 2000);
      } else {
        setPasswordErrors({ 
          general: response.message || 'Error al actualizar contraseña' 
        });
      }
    } catch (error) {
      setPasswordErrors({ 
        general: error instanceof Error ? error.message : 'Error de conexión' 
      });
    } finally {
      setIsLoadingPassword(false);
    }
  };

  const resetDirectPasswordForm = () => {
    setDirectPasswordData({
      nuevaPassword: '',
      confirmarPassword: ''
    });
    setPasswordErrors({});
    setShowPasswords({
      nueva: false,
      confirmar: false,
      actual: false
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-primary-600 mx-auto mb-4" />
          <p className="text-zinc-600 dark:text-zinc-400">Cargando perfil...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-zinc-900 dark:text-white mb-2">
            Error al cargar perfil
          </h2>
          <p className="text-zinc-600 dark:text-zinc-400 mb-4">{error}</p>
          <button
            onClick={cargarPerfil}
            className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors duration-200"
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  if (!perfilData) return null;

  const { operfilu } = perfilData;

  return (
    <>
      <ListPageShell>
        <ListPageHeader title="Mi Perfil" icon={User} onVolver={onVolver} />

        <ListPageBody scrollable>
          <div className="w-full space-y-5 animate-fade-in">
            {/* Hero perfil */}
            <section className="relative overflow-hidden rounded-[1.75rem] border border-zinc-200/80 dark:border-zinc-800 bg-white/80 dark:bg-zinc-950/55">
              <div className="absolute inset-0 pointer-events-none">
                <div className="absolute -top-20 -right-16 h-56 w-56 rounded-full bg-amber-500/15 blur-3xl" />
              </div>
              <div className="relative p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center gap-5">
                <img
                  src={operfilu.foto}
                  alt="Foto de perfil"
                  className="h-20 w-20 sm:h-24 sm:w-24 rounded-2xl object-cover ring-2 ring-amber-500/30 shadow-lg"
                />
                <div className="min-w-0 flex-1">
                  <h2 className="font-display text-2xl sm:text-3xl font-bold text-zinc-900 dark:text-white tracking-tight">
                    {operfilu.nombres} {operfilu.apellidos}
                  </h2>
                  <p className="text-sm sm:text-base text-zinc-500 dark:text-zinc-400 mt-1">
                    {operfilu.nombrecomercial}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {[
                      operfilu.administrador && 'Administrador',
                      operfilu.jefe && 'Jefe',
                      operfilu.validador && 'Validador',
                      operfilu.verificador && 'Verificador',
                      operfilu.credito && 'Crédito',
                    ]
                      .filter(Boolean)
                      .map((rol) => (
                        <span
                          key={String(rol)}
                          className="inline-flex items-center rounded-lg bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/20 px-2.5 py-1 text-xs font-medium"
                        >
                          {rol}
                        </span>
                      ))}
                    {!operfilu.administrador &&
                      !operfilu.jefe &&
                      !operfilu.validador &&
                      !operfilu.verificador &&
                      !operfilu.credito && (
                        <span className="inline-flex items-center rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 px-2.5 py-1 text-xs font-medium">
                          Usuario
                        </span>
                      )}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    resetDirectPasswordForm();
                    setMostrarModalDirectPassword(true);
                  }}
                  className="inline-flex items-center justify-center gap-2 h-11 px-4 rounded-xl text-sm font-semibold
                    bg-zinc-900 text-white hover:bg-zinc-800
                    dark:bg-amber-500 dark:text-zinc-950 dark:hover:bg-amber-400 transition-colors sm:self-start"
                >
                  <Lock className="w-4 h-4" />
                  Cambiar contraseña
                </button>
              </div>
            </section>

            <div className="grid lg:grid-cols-2 gap-5">
              <section className="rounded-2xl border border-zinc-200/80 dark:border-zinc-800 bg-white/80 dark:bg-zinc-950/55 p-5 sm:p-6">
                <h3 className="font-display text-base font-semibold text-zinc-900 dark:text-white mb-4">
                  Datos personales
                </h3>
                <dl className="space-y-3">
                  {[
                    { label: 'Tipo de documento', value: operfilu.tipodocumento },
                    {
                      label: 'Número de documento',
                      value:
                        operfilu.ndocumento && operfilu.ndocumento !== '0'
                          ? operfilu.ndocumento
                          : 'No registrado',
                    },
                    {
                      label: 'Teléfono',
                      value: operfilu.telefono,
                      icon: Phone,
                    },
                    { label: 'Email', value: operfilu.email, icon: Mail },
                  ].map((item) => (
                    <div
                      key={item.label}
                      className="rounded-xl bg-zinc-50/80 dark:bg-zinc-900/50 px-3.5 py-3 border border-zinc-100 dark:border-zinc-800"
                    >
                      <dt className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400 flex items-center gap-1.5">
                        {item.icon && <item.icon className="w-3.5 h-3.5" />}
                        {item.label}
                      </dt>
                      <dd className="mt-1 text-sm font-semibold text-zinc-900 dark:text-white break-all">
                        {item.value}
                      </dd>
                    </div>
                  ))}
                </dl>
              </section>

              <section className="rounded-2xl border border-zinc-200/80 dark:border-zinc-800 bg-white/80 dark:bg-zinc-950/55 p-5 sm:p-6">
                <h3 className="font-display text-base font-semibold text-zinc-900 dark:text-white mb-4">
                  Organización
                </h3>
                <dl className="space-y-3">
                  {[
                    { label: 'Jefe directo', value: operfilu.datjefe || 'No asignado' },
                    {
                      label: 'Área',
                      value:
                        operfilu.area && operfilu.area !== '0' ? operfilu.area : 'No asignada',
                      icon: Building,
                    },
                    {
                      label: 'Centro de costos',
                      value:
                        operfilu.centrocostos && operfilu.centrocostos !== '0'
                          ? operfilu.centrocostos
                          : 'No asignado',
                    },
                  ].map((item) => (
                    <div
                      key={item.label}
                      className="rounded-xl bg-zinc-50/80 dark:bg-zinc-900/50 px-3.5 py-3 border border-zinc-100 dark:border-zinc-800"
                    >
                      <dt className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400 flex items-center gap-1.5">
                        {item.icon && <item.icon className="w-3.5 h-3.5" />}
                        {item.label}
                      </dt>
                      <dd className="mt-1 text-sm font-semibold text-zinc-900 dark:text-white">
                        {item.value}
                      </dd>
                    </div>
                  ))}
                </dl>
              </section>
            </div>

            <section className="rounded-2xl border border-zinc-200/80 dark:border-zinc-800 bg-white/80 dark:bg-zinc-950/55 p-5 sm:p-6">
              <h3 className="font-display text-base font-semibold text-zinc-900 dark:text-white mb-4">
                Permisos
              </h3>
              <ul className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                {[
                  { key: 'admin', label: 'Administrador', active: operfilu.administrador, icon: Shield },
                  { key: 'jefe', label: 'Jefe', active: operfilu.jefe, icon: UserCheck },
                  { key: 'val', label: 'Validador', active: operfilu.validador, icon: UserCheck },
                  { key: 'ver', label: 'Verificador', active: operfilu.verificador, icon: Shield },
                  { key: 'cred', label: 'Crédito corporativo', active: operfilu.credito, icon: CreditCard },
                ].map((p) => (
                  <li
                    key={p.key}
                    className={`flex items-center gap-3 rounded-xl border px-3.5 py-3 ${
                      p.active
                        ? 'border-amber-500/30 bg-amber-500/10'
                        : 'border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/40 opacity-60'
                    }`}
                  >
                    <p.icon
                      className={`w-4 h-4 ${
                        p.active ? 'text-amber-600 dark:text-amber-400' : 'text-zinc-400'
                      }`}
                    />
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-zinc-900 dark:text-white">{p.label}</p>
                      <p className="text-xs text-zinc-500">{p.active ? 'Activo' : 'Inactivo'}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          </div>
        </ListPageBody>
      </ListPageShell>

      <AppModal
        open={mostrarModalPassword}
        onClose={() => setMostrarModalPassword(false)}
        title="Cambiar Contraseña"
        size="md"
        busy={isLoadingPassword}
        footer={
          pasoPassword === 'solicitar' ? (
            <>
              <ModalCancelButton
                onClick={() => setMostrarModalPassword(false)}
                disabled={isLoadingPassword}
              />
              <ModalPrimaryButton
                onClick={handleSolicitarCodigo}
                disabled={isLoadingPassword}
                loading={isLoadingPassword}
              >
                {!isLoadingPassword && <Mail className="w-4 h-4" />}
                Enviar Código
              </ModalPrimaryButton>
            </>
          ) : (
            <>
              <ModalCancelButton
                onClick={() => setMostrarModalPassword(false)}
                disabled={isLoadingPassword}
              />
              <ModalPrimaryButton
                type="submit"
                form="password-form"
                loading={isLoadingPassword}
              >
                {!isLoadingPassword && <Save className="w-4 h-4" />}
                Actualizar Contraseña
              </ModalPrimaryButton>
            </>
          )
        }
      >
        {passwordErrors.general && (
          <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <p className="text-sm text-red-700 dark:text-red-300">{passwordErrors.general}</p>
          </div>
        )}

        {pasoPassword === 'solicitar' ? (
          <div className="text-center py-2">
            <Mail className="w-16 h-16 text-primary-600 mx-auto mb-4" />
            <p className="text-zinc-600 dark:text-zinc-400 mb-2">
              Se enviará un código de verificación a:
            </p>
            <p className="text-lg font-semibold text-zinc-900 dark:text-white">
              {perfilData?.operfilu.email}
            </p>
          </div>
        ) : (
          <form id="password-form" onSubmit={handleActualizarPassword} className="space-y-4">
            <div>
              <label className={modalLabelClass}>
                Código de Verificación *
              </label>
              <input
                type="text"
                value={passwordData.codigoVerificacion}
                onChange={(e) => handlePasswordChange('codigoVerificacion', e.target.value.replace(/\D/g, ''))}
                maxLength={6}
                className={`${modalFieldClass} text-center font-mono text-lg ${
                  passwordErrors.codigoVerificacion
                    ? 'border-red-300 dark:border-red-600'
                    : ''
                }`}
                placeholder="123456"
                autoComplete="off"
              />
              {passwordErrors.codigoVerificacion && (
                <p className="text-sm text-red-600 dark:text-red-400 mt-1">{passwordErrors.codigoVerificacion}</p>
              )}
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                Código enviado a: {perfilData?.operfilu.email}
              </p>
            </div>

            <div>
              <label className={modalLabelClass}>
                Nueva Contraseña *
              </label>
              <div className="relative">
                <input
                  type={showPasswords.nueva ? 'text' : 'password'}
                  value={passwordData.nuevaPassword}
                  onChange={(e) => handlePasswordChange('nuevaPassword', e.target.value)}
                  className={`${modalFieldClass} pr-10 ${
                    passwordErrors.nuevaPassword
                      ? 'border-red-300 dark:border-red-600'
                      : ''
                  }`}
                  placeholder="Mínimo 6 caracteres"
                />
                <button
                  type="button"
                  onClick={() => togglePasswordVisibility('nueva')}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
                >
                  {showPasswords.nueva ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
              {passwordErrors.nuevaPassword && (
                <p className="text-sm text-red-600 dark:text-red-400 mt-1">{passwordErrors.nuevaPassword}</p>
              )}
            </div>

            <div>
              <label className={modalLabelClass}>
                Confirmar Nueva Contraseña *
              </label>
              <div className="relative">
                <input
                  type={showPasswords.confirmar ? 'text' : 'password'}
                  value={passwordData.confirmarPassword}
                  onChange={(e) => handlePasswordChange('confirmarPassword', e.target.value)}
                  className={`${modalFieldClass} pr-10 ${
                    passwordErrors.confirmarPassword
                      ? 'border-red-300 dark:border-red-600'
                      : ''
                  }`}
                  placeholder="Confirma la nueva contraseña"
                />
                <button
                  type="button"
                  onClick={() => togglePasswordVisibility('confirmar')}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
                >
                  {showPasswords.confirmar ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
              {passwordErrors.confirmarPassword && (
                <p className="text-sm text-red-600 dark:text-red-400 mt-1">{passwordErrors.confirmarPassword}</p>
              )}
            </div>
          </form>
        )}
      </AppModal>

      <AppModal
        open={mostrarModalDirectPassword}
        onClose={() => setMostrarModalDirectPassword(false)}
        title="Cambiar Contraseña"
        size="md"
        busy={isLoadingPassword}
        footer={
          <>
            <ModalCancelButton
              onClick={() => setMostrarModalDirectPassword(false)}
              disabled={isLoadingPassword}
            />
            <button
              type="submit"
              form="direct-password-form"
              disabled={isLoadingPassword}
              className="inline-flex h-9 items-center justify-center gap-2 rounded-lg bg-green-600 px-4 text-sm font-semibold text-white transition-colors hover:bg-green-700 disabled:opacity-50"
            >
              {isLoadingPassword ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              Actualizar Contraseña
            </button>
          </>
        }
      >
        {passwordErrors.general && (
          <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <p className="text-sm text-red-700 dark:text-red-300">{passwordErrors.general}</p>
          </div>
        )}

        <form id="direct-password-form" onSubmit={handleCambiarContrasenaDirecta} className="space-y-4">
          <div>
            <label className={modalLabelClass}>
              Nueva Contraseña *
            </label>
            <div className="relative">
              <input
                type={showPasswords.nueva ? 'text' : 'password'}
                value={directPasswordData.nuevaPassword}
                onChange={(e) => handleDirectPasswordChange('nuevaPassword', e.target.value)}
                className={`${modalFieldClass} pr-10 ${
                  passwordErrors.nuevaPassword
                    ? 'border-red-300 dark:border-red-600'
                    : ''
                }`}
                placeholder="Mínimo 6 caracteres"
              />
              <button
                type="button"
                onClick={() => togglePasswordVisibility('nueva')}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
              >
                {showPasswords.nueva ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
            {passwordErrors.nuevaPassword && (
              <p className="text-sm text-red-600 dark:text-red-400 mt-1">{passwordErrors.nuevaPassword}</p>
            )}
          </div>

          <div>
            <label className={modalLabelClass}>
              Confirmar Nueva Contraseña *
            </label>
            <div className="relative">
              <input
                type={showPasswords.confirmar ? 'text' : 'password'}
                value={directPasswordData.confirmarPassword}
                onChange={(e) => handleDirectPasswordChange('confirmarPassword', e.target.value)}
                className={`${modalFieldClass} pr-10 ${
                  passwordErrors.confirmarPassword
                    ? 'border-red-300 dark:border-red-600'
                    : ''
                }`}
                placeholder="Confirma la nueva contraseña"
              />
              <button
                type="button"
                onClick={() => togglePasswordVisibility('confirmar')}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
              >
                {showPasswords.confirmar ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
            {passwordErrors.confirmarPassword && (
              <p className="text-sm text-red-600 dark:text-red-400 mt-1">{passwordErrors.confirmarPassword}</p>
            )}
          </div>
        </form>
      </AppModal>

      {/* Toast de Notificación */}
      <Toast
        message={toast.message}
        type={toast.type}
        isVisible={toast.isVisible}
        onClose={() => setToast(prev => ({ ...prev, isVisible: false }))}
      />
    </>
  );
};