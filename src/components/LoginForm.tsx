import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Phone,
  Mail,
  Loader2,
  ArrowRight,
  Eye,
  EyeOff,
  ArrowLeft,
  AlertCircle,
  Lock,
  CheckCircle2,
} from 'lucide-react';
import {
  solicitarCodigo,
  verificarCodigo,
  guardarSesion,
  loginPorEmail,
  recuperarPassword,
  actualizarPassword,
} from '../services/authService';
import { CodeInput } from './CodeInput';
import { Toast } from './Toast';
import { ThemeToggle } from './ThemeToggle';
import { APP_VERSION } from '../utils/appVersion';
import { PATHS } from '../routes/paths';

interface FormData {
  telefono: string;
  email: string;
  password: string;
  codigo: string;
  nuevaPassword: string;
  codigoRecuperacion: string;
}

interface FormErrors {
  telefono?: string;
  email?: string;
  password?: string;
  codigo?: string;
  nuevaPassword?: string;
  codigoRecuperacion?: string;
  general?: string;
}

type LoginMethod = 'email' | 'phone';
type AuthStep = 'login' | 'verify-code' | 'recover-password';

const LOGO_URL = 'https://clientes.zmovilidad.app/media/logoz.png';
const RESEND_COOLDOWN_SEC = 45;

/**
 * Login moderno nivel producto (split brand + formulario limpio).
 */
export const LoginForm: React.FC = () => {
  const navigate = useNavigate();
  const [loginMethod, setLoginMethod] = useState<LoginMethod>('email');
  const [authStep, setAuthStep] = useState<AuthStep>('login');
  const [formData, setFormData] = useState<FormData>({
    telefono: '',
    email: '',
    password: '',
    codigo: '',
    nuevaPassword: '',
    codigoRecuperacion: '',
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [idPersonalRecuperacion, setIdPersonalRecuperacion] = useState<number | null>(null);
  const [resendIn, setResendIn] = useState(0);
  const [toast, setToast] = useState<{
    isVisible: boolean;
    message: string;
    type: 'success' | 'error';
  }>({
    isVisible: false,
    message: '',
    type: 'success',
  });

  useEffect(() => {
    if (resendIn <= 0) return;
    const timer = setTimeout(() => setResendIn((s) => s - 1), 1000);
    return () => clearTimeout(timer);
  }, [resendIn]);

  const validateEmailForm = (): boolean => {
    const newErrors: FormErrors = {};
    if (!formData.email.trim()) newErrors.email = 'El usuario es requerido';
    if (!formData.password.trim()) newErrors.password = 'La contraseña es requerida';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validatePhoneForm = (): boolean => {
    const newErrors: FormErrors = {};
    const phoneRegex = /^9\d{8}$/;
    if (!formData.telefono) {
      newErrors.telefono = 'El número de teléfono es requerido';
    } else if (!phoneRegex.test(formData.telefono)) {
      newErrors.telefono = 'Ingresa un número válido (9 dígitos, comenzando con 9)';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateEmailForm()) return;
    setIsLoading(true);
    setErrors({});
    try {
      const response = await loginPorEmail(formData.email.trim(), formData.password);
      if (response.estatus === 200) {
        guardarSesion({
          idpersonal: response.idpersonal,
          idcliente: response.idcliente,
          key: response.key || '',
        });
        navigate(PATHS.home, { replace: true });
      } else {
        setErrors({
          general: response.message || 'Error al iniciar sesión. Verifica tus credenciales.',
        });
      }
    } catch (error) {
      setErrors({
        general: error instanceof Error ? error.message : 'Error de conexión',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handlePhoneLogin = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!validatePhoneForm()) return;
    setIsLoading(true);
    setErrors({});
    try {
      const response = await solicitarCodigo(formData.telefono);
      if (response.estatus === 200) {
        setAuthStep('verify-code');
        setResendIn(RESEND_COOLDOWN_SEC);
        setToast({ isVisible: true, message: 'Código enviado por SMS', type: 'success' });
      } else {
        setErrors({
          general: response.message || 'Error al enviar código. Intenta nuevamente.',
        });
      }
    } catch (error) {
      setErrors({
        general: error instanceof Error ? error.message : 'Error de conexión',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCodeComplete = async (codigo: string) => {
    setFormData((prev) => ({ ...prev, codigo }));
    setIsLoading(true);
    setErrors({});
    try {
      const response = await verificarCodigo({
        telefono: formData.telefono,
        codigo,
        vapp: APP_VERSION,
        notificacion: '',
        plataforma: 'intranet',
      });
      if (response.estatus === 200) {
        guardarSesion({
          idpersonal: response.idpersonal,
          idcliente: response.idcliente,
          key: response.key || '',
        });
        navigate(PATHS.home, { replace: true });
      } else {
        setErrors({
          general: response.message || 'Código incorrecto. Intenta nuevamente.',
        });
      }
    } catch (error) {
      setErrors({
        general: error instanceof Error ? error.message : 'Error de conexión',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!formData.email.trim()) {
      setErrors({ email: 'Ingresa tu usuario para recuperar la contraseña' });
      setLoginMethod('email');
      return;
    }
    setIsLoading(true);
    setErrors({});
    try {
      const response = await recuperarPassword(formData.email.trim());
      if (response.estatus === 200) {
        setIdPersonalRecuperacion(response.idpersonal);
        setAuthStep('recover-password');
        setToast({
          isVisible: true,
          message: 'Código de recuperación enviado a tu correo',
          type: 'success',
        });
      } else {
        setErrors({
          general: response.message || 'Error al enviar código de recuperación',
        });
      }
    } catch (error) {
      setErrors({
        general: error instanceof Error ? error.message : 'Error de conexión',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: FormErrors = {};
    if (!formData.codigoRecuperacion.trim()) {
      newErrors.codigoRecuperacion = 'El código es requerido';
    } else if (formData.codigoRecuperacion.length !== 6) {
      newErrors.codigoRecuperacion = 'El código debe tener 6 dígitos';
    }
    if (!formData.nuevaPassword.trim()) {
      newErrors.nuevaPassword = 'La nueva contraseña es requerida';
    } else if (formData.nuevaPassword.length < 6) {
      newErrors.nuevaPassword = 'La contraseña debe tener al menos 6 caracteres';
    }
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    if (!idPersonalRecuperacion) {
      setErrors({ general: 'Error en el proceso de recuperación' });
      return;
    }
    setIsLoading(true);
    setErrors({});
    try {
      const response = await actualizarPassword(
        idPersonalRecuperacion,
        formData.codigoRecuperacion,
        formData.nuevaPassword
      );
      if (response.estatus === 200) {
        setToast({
          isVisible: true,
          message: 'Contraseña actualizada. Ya puedes iniciar sesión.',
          type: 'success',
        });
        setTimeout(() => resetForm(), 1600);
      } else {
        setErrors({
          general: response.message || 'Error al actualizar contraseña',
        });
      }
    } catch (error) {
      setErrors({
        general: error instanceof Error ? error.message : 'Error de conexión',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field] || errors.general) {
      setErrors((prev) => ({ ...prev, [field]: undefined, general: undefined }));
    }
  };

  const resetForm = () => {
    setAuthStep('login');
    setFormData({
      telefono: '',
      email: '',
      password: '',
      codigo: '',
      nuevaPassword: '',
      codigoRecuperacion: '',
    });
    setErrors({});
    setIdPersonalRecuperacion(null);
    setResendIn(0);
  };

  const inputClass = (hasError?: boolean) =>
    [
      'zm-input h-12',
      hasError ? 'zm-input-error' : '',
    ].join(' ');

  const title =
    authStep === 'recover-password'
      ? 'Recuperar acceso'
      : authStep === 'verify-code'
        ? 'Verifica tu número'
        : 'Iniciar sesión';

  const subtitle =
    authStep === 'recover-password' ? (
      <>
        Código enviado a{' '}
        <span className="font-medium text-zinc-900 dark:text-zinc-100">{formData.email}</span>
      </>
    ) : authStep === 'verify-code' ? (
      <>
        Enviamos un SMS a{' '}
        <span className="font-medium text-zinc-900 dark:text-zinc-100">+51 {formData.telefono}</span>
      </>
    ) : (
      'Gestiona tus servicios de transporte corporativo'
    );

  return (
    <>
      <div className="min-h-screen w-full flex bg-white dark:bg-zinc-950">
        {/* —— Panel marca (desktop) —— */}
        <aside className="hidden lg:flex lg:w-[46%] xl:w-[48%] relative overflow-hidden text-white">
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{
              backgroundImage:
                'url("https://images.pexels.com/photos/1427541/pexels-photo-1427541.jpeg?auto=compress&cs=tinysrgb&w=1600&h=2000&fit=crop")',
            }}
          />
          <div className="absolute inset-0 bg-zinc-950/55" />
          <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/40 to-amber-900/30" />

          {/* Orbes suaves */}
          <div className="absolute -top-24 -left-16 w-80 h-80 rounded-full bg-amber-400/25 blur-3xl animate-fade-in" />
          <div className="absolute bottom-10 right-0 w-96 h-96 rounded-full bg-orange-500/20 blur-3xl" />

          <div className="relative z-10 flex flex-col justify-between w-full p-10 xl:p-14">
            <div className="flex items-center gap-3">
              <img src={LOGO_URL} alt="Z Movilidad" className="h-11 w-11 object-contain drop-shadow-lg" />
              <span className="font-display text-xl font-semibold tracking-tight">Z Movilidad</span>
            </div>

            <div className="max-w-md animate-slide-up">
              <p className="text-amber-300/90 text-sm font-medium tracking-wide mb-4">Intranet corporativa</p>
              <h2 className="font-display text-4xl xl:text-5xl font-semibold leading-[1.1] tracking-tight mb-5">
                Movilidad simple,
                <br />
                operación clara.
              </h2>
              <p className="text-white/70 text-base leading-relaxed max-w-sm">
                Solicita, valida y da seguimiento a tus servicios desde un solo lugar.
              </p>

              <ul className="mt-10 space-y-3">
                {['Solicitud en minutos', 'Seguimiento en tiempo real', 'Control por roles'].map((item) => (
                  <li key={item} className="flex items-center gap-3 text-sm text-white/80">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white/10 border border-white/15">
                      <CheckCircle2 className="w-3.5 h-3.5 text-amber-300" />
                    </span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            <p className="text-xs text-white/40">© {new Date().getFullYear()} Z Movilidad · v{APP_VERSION}</p>
          </div>
        </aside>

        {/* —— Formulario —— */}
        <section className="flex-1 flex flex-col relative min-h-screen">
          <div className="absolute top-4 right-4 z-20 sm:top-6 sm:right-6">
            <ThemeToggle />
          </div>

          {/* Marca mobile */}
          <div className="lg:hidden px-6 pt-8 pb-2 flex items-center gap-3">
            <img src={LOGO_URL} alt="Z Movilidad" className="h-10 w-10 object-contain" />
            <div>
              <p className="font-display font-semibold text-zinc-900 dark:text-white leading-tight">Z Movilidad</p>
              <p className="text-xs text-zinc-500">Intranet</p>
            </div>
          </div>

          <div className="flex-1 flex items-center justify-center px-6 py-10 sm:px-10">
            <div className="w-full max-w-[400px] animate-fade-in">
              <div className="mb-8">
                <h1 className="font-display text-[1.75rem] sm:text-[2rem] font-semibold tracking-tight text-zinc-900 dark:text-white">
                  {title}
                </h1>
                <p className="mt-2 text-[15px] text-zinc-500 dark:text-zinc-400 leading-relaxed">{subtitle}</p>
              </div>

              {errors.general && (
                <div
                  className="mb-5 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 dark:bg-red-950/40 dark:border-red-900 px-3.5 py-3"
                  role="alert"
                >
                  <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-red-700 dark:text-red-300 leading-snug">{errors.general}</p>
                </div>
              )}

              {/* Recuperación */}
              {authStep === 'recover-password' && (
                <form onSubmit={handleUpdatePassword} className="space-y-4">
                  <div>
                    <label htmlFor="codigoRecuperacion" className="zm-label">
                      Código de verificación
                    </label>
                    <input
                      type="text"
                      id="codigoRecuperacion"
                      value={formData.codigoRecuperacion}
                      onChange={(e) =>
                        handleInputChange('codigoRecuperacion', e.target.value.replace(/\D/g, ''))
                      }
                      maxLength={6}
                      inputMode="numeric"
                      autoComplete="one-time-code"
                      className={`${inputClass(!!errors.codigoRecuperacion)} text-center tracking-[0.4em] font-mono text-lg`}
                      placeholder="••••••"
                    />
                    {errors.codigoRecuperacion && (
                      <p className="zm-field-error">{errors.codigoRecuperacion}</p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="nuevaPassword" className="zm-label">
                      Nueva contraseña
                    </label>
                    <div className="relative">
                      <input
                        type={showNewPassword ? 'text' : 'password'}
                        id="nuevaPassword"
                        value={formData.nuevaPassword}
                        onChange={(e) => handleInputChange('nuevaPassword', e.target.value)}
                        autoComplete="new-password"
                        className={`${inputClass(!!errors.nuevaPassword)} pr-11`}
                        placeholder="Mínimo 6 caracteres"
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className="absolute inset-y-0 right-0 px-3 flex items-center text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200"
                        aria-label={showNewPassword ? 'Ocultar' : 'Mostrar'}
                      >
                        {showNewPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                      </button>
                    </div>
                    {errors.nuevaPassword && (
                      <p className="zm-field-error">{errors.nuevaPassword}</p>
                    )}
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="login-btn-primary group"
                  >
                    {isLoading ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <>
                        Actualizar contraseña
                        <ArrowRight className="w-4 h-4 ml-2 transition-transform group-hover:translate-x-0.5" />
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={resetForm}
                    disabled={isLoading}
                    className="login-btn-ghost"
                  >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Volver al login
                  </button>
                </form>
              )}

              {/* SMS verify */}
              {authStep === 'verify-code' && (
                <div className="space-y-6">
                  <CodeInput
                    length={6}
                    onComplete={handleCodeComplete}
                    disabled={isLoading}
                    error={!!errors.general}
                  />

                  {isLoading && (
                    <div className="flex items-center justify-center gap-2 text-sm text-zinc-500">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Verificando…
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={() => {
                      setAuthStep('login');
                      setErrors({});
                      setLoginMethod('phone');
                    }}
                    disabled={isLoading}
                    className="login-btn-ghost"
                  >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Cambiar número
                  </button>

                  <button
                    type="button"
                    onClick={() => void handlePhoneLogin()}
                    disabled={isLoading || resendIn > 0}
                    className="w-full text-center text-sm font-medium text-amber-700 hover:text-amber-800 dark:text-amber-400 disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    {resendIn > 0 ? `Reenviar en ${resendIn}s` : 'Reenviar código'}
                  </button>
                </div>
              )}

              {/* Login */}
              {authStep === 'login' && (
                <>
                  <div className="mb-6 grid grid-cols-2 p-1 rounded-xl bg-zinc-100 dark:bg-zinc-900/80 border border-zinc-200 dark:border-zinc-800">
                    <button
                      type="button"
                      onClick={() => {
                        setLoginMethod('email');
                        setErrors({});
                      }}
                      className={`flex items-center justify-center gap-2 h-10 rounded-lg text-sm font-semibold transition-all ${
                        loginMethod === 'email'
                          ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-sm ring-1 ring-zinc-200/80 dark:ring-zinc-700'
                          : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
                      }`}
                    >
                      <Mail className="w-4 h-4" />
                      Usuario
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setLoginMethod('phone');
                        setErrors({});
                      }}
                      className={`flex items-center justify-center gap-2 h-10 rounded-lg text-sm font-semibold transition-all ${
                        loginMethod === 'phone'
                          ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-sm ring-1 ring-zinc-200/80 dark:ring-zinc-700'
                          : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
                      }`}
                    >
                      <Phone className="w-4 h-4" />
                      Teléfono
                    </button>
                  </div>

                  {loginMethod === 'email' ? (
                    <form onSubmit={handleEmailLogin} className="space-y-5">
                      <div>
                        <label htmlFor="email" className="zm-label">
                          Usuario
                        </label>
                        <div className="relative">
                          <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none w-[18px] h-[18px]" />
                          <input
                            type="text"
                            id="email"
                            value={formData.email}
                            onChange={(e) => handleInputChange('email', e.target.value)}
                            autoComplete="username"
                            spellCheck={false}
                            autoFocus
                            className={`${inputClass(!!errors.email)} pl-11`}
                            placeholder="usuario"
                          />
                        </div>
                        {errors.email && <p className="zm-field-error">{errors.email}</p>}
                      </div>

                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <label htmlFor="password" className="text-sm font-medium text-zinc-900 dark:text-zinc-100 opacity-85">
                            Contraseña
                          </label>
                          <button
                            type="button"
                            onClick={() => void handleForgotPassword()}
                            disabled={isLoading}
                            className="text-sm font-medium text-amber-700 hover:text-amber-800 dark:text-amber-400 disabled:opacity-50"
                          >
                            ¿Olvidaste?
                          </button>
                        </div>
                        <div className="relative">
                          <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none w-[18px] h-[18px]" />
                          <input
                            type={showPassword ? 'text' : 'password'}
                            id="password"
                            value={formData.password}
                            onChange={(e) => handleInputChange('password', e.target.value)}
                            autoComplete="current-password"
                            className={`${inputClass(!!errors.password)} pl-11 pr-11`}
                            placeholder="••••••••"
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute inset-y-0 right-0 px-3 flex items-center text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200"
                            aria-label={showPassword ? 'Ocultar' : 'Mostrar'}
                          >
                            {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                          </button>
                        </div>
                        {errors.password && <p className="zm-field-error">{errors.password}</p>}
                      </div>

                      <button type="submit" disabled={isLoading} className="login-btn-primary group mt-2">
                        {isLoading ? (
                          <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                          <>
                            Continuar
                            <ArrowRight className="w-4 h-4 ml-2 transition-transform group-hover:translate-x-0.5" />
                          </>
                        )}
                      </button>
                    </form>
                  ) : (
                    <form onSubmit={(e) => void handlePhoneLogin(e)} className="space-y-5">
                      <div>
                        <label htmlFor="telefono" className="zm-label">
                          Celular
                        </label>
                        <div className="flex">
                          <span className="inline-flex items-center h-12 px-3.5 rounded-l-xl border border-r-0 border-zinc-200 bg-zinc-100 text-sm font-medium text-zinc-600 dark:bg-zinc-800 dark:border-zinc-700 dark:text-zinc-300">
                            +51
                          </span>
                          <input
                            type="tel"
                            id="telefono"
                            value={formData.telefono}
                            onChange={(e) =>
                              handleInputChange('telefono', e.target.value.replace(/\D/g, '').slice(0, 9))
                            }
                            inputMode="numeric"
                            autoComplete="tel-national"
                            autoFocus
                            className={`${inputClass(!!errors.telefono)} rounded-l-none`}
                            placeholder="9XXXXXXXX"
                          />
                        </div>
                        {errors.telefono ? (
                          <p className="zm-field-error">{errors.telefono}</p>
                        ) : (
                          <p className="zm-field-hint">Te enviaremos un código de 6 dígitos</p>
                        )}
                      </div>

                      <button type="submit" disabled={isLoading} className="login-btn-primary group">
                        {isLoading ? (
                          <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                          <>
                            Enviar código
                            <ArrowRight className="w-4 h-4 ml-2 transition-transform group-hover:translate-x-0.5" />
                          </>
                        )}
                      </button>
                    </form>
                  )}

                  <p className="mt-8 text-center text-sm text-zinc-500">
                    ¿Necesitas ayuda?{' '}
                    <button
                      type="button"
                      onClick={() =>
                        window.open(
                          'mailto:administracion@zmovilidad.com?subject=Soporte%20Z%20Movilidad',
                          '_blank'
                        )
                      }
                      className="font-medium text-zinc-900 dark:text-white hover:text-amber-700 dark:hover:text-amber-400 transition-colors"
                    >
                      Contactar soporte
                    </button>
                  </p>
                </>
              )}
            </div>
          </div>
        </section>
      </div>

      <Toast
        message={toast.message}
        type={toast.type}
        isVisible={toast.isVisible}
        onClose={() => setToast((prev) => ({ ...prev, isVisible: false }))}
      />
    </>
  );
};
