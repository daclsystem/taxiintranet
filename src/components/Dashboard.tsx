import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Car, MapPin, Clock, User, LogOut, FileText, 
  History, Users, DollarSign, CheckCircle, Shield, Building,
  MessageCircle, Phone, Mail, Loader2, AlertCircle, Calendar,
  TrendingUp, Activity, ArrowUpRight
} from 'lucide-react';
import { limpiarSesion } from '../services/authService';
import { obtenerDatosPrincipales, obtenerReporte } from '../services/dashboardService';
import { PrincipalResponse, MenuOption, ReporteData } from '../types/dashboard';
import { ThemeToggle } from './ThemeToggle';
import { ConfirmDialog } from './ConfirmDialog';
import { AppPageShell } from './ui/ListPageUI';
import { APP_VERSION } from '../utils/appVersion';
import { MENU_PATHS, PATHS } from '../routes/paths';

const ICON_TILE =
  'inline-flex items-center justify-center w-12 h-12 rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/20';

/**
 * Dashboard principal de Z Movilidad con menú dinámico basado en permisos
 */
export const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const [datosUsuario, setDatosUsuario] = useState<PrincipalResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Inicializar directamente con el mes actual
  const obtenerMesActual = () => {
    const fechaActual = new Date();
    const añoActual = fechaActual.getFullYear();
    const mesActualNumero = fechaActual.getMonth(); // 0-11
    const nombresMeses = [
      'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
      'Julio', 'Agosto', 'Setiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ];
    return `${nombresMeses[mesActualNumero]} ${añoActual}`;
  };

  const [mesSeleccionado, setMesSeleccionado] = useState<string>(obtenerMesActual());
  const [reporteData, setReporteData] = useState<ReporteData[]>([]);
  const [isLoadingReporte, setIsLoadingReporte] = useState(false);
  const [mostrarConfirmacionSalir, setMostrarConfirmacionSalir] = useState(false);

  useEffect(() => {
    cargarDatosPrincipales();
  }, []);

  useEffect(() => {
    if (datosUsuario && mesSeleccionado) {
      cargarReporte(mesSeleccionado);
    }
  }, [datosUsuario, mesSeleccionado]);

  // Generar opciones de meses (solo actual y anterior)
  const generarOpcionesMeses = () => {
    const fechaActual = new Date();
    const añoActual = fechaActual.getFullYear();
    const mesActualNumero = fechaActual.getMonth(); // 0-11
    
    // Array de nombres de meses en español
    const nombresMeses = [
      'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
      'Julio', 'Agosto', 'Setiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ];
    
    // Mes actual
    const mesActual = `${nombresMeses[mesActualNumero]} ${añoActual}`;
    
    // Mes anterior
    let mesAnteriorNumero = mesActualNumero - 1;
    let añoAnterior = añoActual;
    if (mesAnteriorNumero < 0) {
      mesAnteriorNumero = 11; // Diciembre
      añoAnterior = añoActual - 1;
    }
    const mesAnterior = `${nombresMeses[mesAnteriorNumero]} ${añoAnterior}`;
    
    return [
      { mesanio: mesActual },    // Mes actual primero (será el seleccionado por defecto)
      { mesanio: mesAnterior }   // Mes anterior segundo
    ];
  };

  const cargarDatosPrincipales = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const datos = await obtenerDatosPrincipales();
      setDatosUsuario(datos);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Error desconocido');
    } finally {
      setIsLoading(false);
    }
  };

  const cargarReporte = async (consulta: string) => {
    try {
      setIsLoadingReporte(true);
      const reporte = await obtenerReporte(consulta);
      setReporteData(reporte.areported);
    } catch (error) {
      console.error('Error al cargar reporte:', error);
      setReporteData([]);
    } finally {
      setIsLoadingReporte(false);
    }
  };

  const handleLogout = () => {
    setMostrarConfirmacionSalir(true);
  };

  const confirmarSalir = () => {
    limpiarSesion();
    navigate(PATHS.login, { replace: true });
  };

  // Función para formatear moneda
  const formatearMoneda = (monto: number): string => {
    return `S/ ${monto.toFixed(2)}`;
  };

  // Función para obtener el máximo valor del gráfico
  const obtenerMaximoGrafico = (): number => {
    if (reporteData.length === 0) return 100;
    return Math.max(...reporteData.map(item => item.total));
  };

  // Generar opciones de menú basadas en permisos
  const generarOpcionesMenu = (): MenuOption[] => {
    if (!datosUsuario) return [];

    const { oaiprincipal } = datosUsuario;
    const opciones: MenuOption[] = [];

    // Opciones principales (siempre visibles)
    opciones.push(
      {
        id: 'solicitar',
        titulo: 'Solicitar',
        descripcion: 'Nuevo servicio de transporte',
        icono: Car,
        color: ICON_TILE,
        categoria: 'principal'
      },
      {
        id: 'mis-servicios',
        titulo: 'Mis Servicios',
        descripcion: 'Pendientes y en ejecución',
        icono: MapPin,
        color: ICON_TILE,
        categoria: 'principal'
      },
      {
        id: 'historial',
        titulo: 'Historial',
        descripcion: 'Tus servicios anteriores',
        icono: History,
        color: ICON_TILE,
        categoria: 'principal'
      },
      {
        id: 'perfil',
        titulo: 'Perfil',
        descripcion: 'Datos y contraseña',
        icono: User,
        color: ICON_TILE,
        categoria: 'principal'
      }
    );

    if (oaiprincipal.administrador) {
      opciones.push(
        {
          id: 'servicios-personal',
          titulo: 'Servicios Personal',
          descripcion: 'Servicios de otros usuarios',
          icono: Users,
          color: ICON_TILE,
          categoria: 'admin'
        },
        {
          id: 'historial-personal',
          titulo: 'Historial Personal',
          descripcion: 'Historial del equipo',
          icono: FileText,
          color: ICON_TILE,
          categoria: 'admin'
        },
        {
          id: 'validar-servicios',
          titulo: 'Aprobación',
          descripcion: 'Confirmar solicitudes',
          icono: CheckCircle,
          color: ICON_TILE,
          categoria: 'admin'
        },
        {
          id: 'verificar-servicios',
          titulo: 'Revisión',
          descripcion: 'Revisar servicios',
          icono: Shield,
          color: ICON_TILE,
          categoria: 'admin'
        },
        {
          id: 'personal',
          titulo: 'Personal',
          descripcion: 'Gestionar usuarios',
          icono: Users,
          color: ICON_TILE,
          categoria: 'admin'
        },
        {
          id: 'centro-costos',
          titulo: 'Centro Costos',
          descripcion: 'Gestionar centros',
          icono: DollarSign,
          color: ICON_TILE,
          categoria: 'admin'
        },
        {
          id: 'area',
          titulo: 'Área',
          descripcion: 'Gestionar áreas',
          icono: Building,
          color: ICON_TILE,
          categoria: 'admin'
        }
      );
    } else {
      if (oaiprincipal.validador) {
        opciones.push({
          id: 'validar-servicios',
          titulo: 'Aprobación',
          descripcion: 'Confirmar solicitudes',
          icono: CheckCircle,
          color: ICON_TILE,
          categoria: 'validador'
        });
      }

      if (oaiprincipal.verificador) {
        opciones.push({
          id: 'verificar-servicios',
          titulo: 'Revisión',
          descripcion: 'Revisar servicios',
          icono: Shield,
          color: ICON_TILE,
          categoria: 'verificador'
        });
      }

      if (oaiprincipal.jefe) {
        opciones.push(
          {
            id: 'servicios-personal',
            titulo: 'Servicios Personal',
            descripcion: 'Servicios de otros usuarios',
            icono: Users,
            color: ICON_TILE,
            categoria: 'jefe'
          },
          {
            id: 'historial-personal',
            titulo: 'Historial Personal',
            descripcion: 'Historial del equipo',
            icono: FileText,
            color: ICON_TILE,
            categoria: 'jefe'
          }
        );
      }
    }

    opciones.push(
      {
        id: 'escribenos',
        titulo: 'Escríbenos',
        descripcion: 'WhatsApp de soporte',
        icono: MessageCircle,
        color: ICON_TILE,
        categoria: 'contacto'
      },
      {
        id: 'llamanos',
        titulo: 'Llámanos',
        descripcion: 'Contacto telefónico',
        icono: Phone,
        color: ICON_TILE,
        categoria: 'contacto'
      },
      {
        id: 'correo',
        titulo: 'Correo',
        descripcion: 'Escribir por email',
        icono: Mail,
        color: ICON_TILE,
        categoria: 'contacto'
      }
    );

    return opciones;
  };

  const opcionesMenu = generarOpcionesMenu();

  const handleContacto = (opcionId: string) => {
    if (opcionId === 'escribenos') {
      window.open(
        'https://api.whatsapp.com/send?phone=51987708676&text=necesito%20ayuda',
        '_blank'
      );
      return;
    }
    if (opcionId === 'llamanos') {
      window.open('tel:+51015144400', '_self');
      return;
    }
    if (opcionId === 'correo') {
      window.open('mailto:reservas@zmovilidad.com', '_self');
    }
  };

  const opcionesPrincipales = opcionesMenu.filter((op) => op.categoria === 'principal');
  const opcionesAdmin = opcionesMenu.filter((op) =>
    ['admin', 'validador', 'verificador', 'jefe'].includes(op.categoria)
  );
  const opcionesContacto = opcionesMenu.filter((op) => op.categoria === 'contacto');

  const AdminCard = ({ opcion }: { opcion: MenuOption }) => {
    const IconComponent = opcion.icono;
    const ruta = MENU_PATHS[opcion.id];
    if (!ruta) return null;
    return (
      <Link
        to={ruta}
        className="group flex items-center gap-4 rounded-2xl border border-zinc-200/80 dark:border-zinc-800 bg-white/70 dark:bg-zinc-900/70 px-5 py-5 min-h-[5.75rem]
          hover:border-amber-500/40 hover:bg-amber-500/[0.06] transition-all duration-200"
      >
        <span className={`${opcion.color} flex-shrink-0 group-hover:scale-105 transition-transform`}>
          <IconComponent className="w-5 h-5" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-base font-semibold text-zinc-900 dark:text-white truncate">
            {opcion.titulo}
          </span>
          <span className="block text-sm text-zinc-500 dark:text-zinc-400 truncate mt-0.5">
            {opcion.descripcion}
          </span>
        </span>
        <ArrowUpRight className="w-5 h-5 text-zinc-400 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
      </Link>
    );
  };

  const SupportChip = ({ opcion }: { opcion: MenuOption }) => {
    const IconComponent = opcion.icono;
    return (
      <button
        type="button"
        onClick={() => handleContacto(opcion.id)}
        className="inline-flex items-center gap-2.5 rounded-full border border-zinc-200 dark:border-zinc-800
          bg-white/60 dark:bg-zinc-900/60 px-4 py-2.5 text-sm font-medium text-zinc-700 dark:text-zinc-200
          hover:border-amber-500/40 hover:text-amber-700 dark:hover:text-amber-300 transition-colors"
      >
        <IconComponent className="w-4 h-4 text-amber-600 dark:text-amber-400" />
        {opcion.titulo}
      </button>
    );
  };

  const solicitar = opcionesPrincipales.find((o) => o.id === 'solicitar');
  const accesosRapidos = opcionesPrincipales.filter((o) => o.id !== 'solicitar');
  const enProceso = datosUsuario?.aaiprocesod?.length ?? 0;
  const enHistorial = datosUsuario?.aaihistoriald?.length ?? 0;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center">
        <div className="text-center animate-fade-in">
          <Loader2 className="w-12 h-12 animate-spin text-primary-600 mx-auto mb-4" />
          <p className="text-zinc-600 dark:text-zinc-400">Cargando dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6 zm-card-static animate-slide-up">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-zinc-900 dark:text-white mb-2">
            Error al cargar datos
          </h2>
          <p className="text-zinc-600 dark:text-zinc-400 mb-4">{error}</p>
          <button
            onClick={cargarDatosPrincipales}
            className="zm-btn-primary"
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  if (!datosUsuario) return null;

  const { oaiprincipal } = datosUsuario;

  return (
    <>
    <AppPageShell>
      <header className="shrink-0 border-b border-zinc-200/80 dark:border-zinc-800/80 bg-white/70 dark:bg-zinc-950/70 backdrop-blur-xl mb-4">
        <div className="flex justify-between items-center h-14">
          <Link to={PATHS.home} className="flex items-center group">
            <img
              src={`${import.meta.env.BASE_URL}logoz.png`}
              alt="Z Movilidad"
              className="h-9 w-9 rounded-full ring-1 ring-amber-500/30"
            />
            <div className="ml-3">
              <h1 className="font-display text-lg font-bold text-zinc-900 dark:text-white leading-tight">
                Z Movilidad
              </h1>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400">Intranet · v{APP_VERSION}</p>
            </div>
          </Link>

          <div className="flex items-center gap-2 sm:gap-3">
            <ThemeToggle />
            <div className="flex items-center gap-2.5 pl-2 sm:pl-3 border-l border-zinc-200 dark:border-zinc-800">
              <img
                src={oaiprincipal.foto}
                alt="Foto de perfil"
                className="w-9 h-9 rounded-full object-cover ring-2 ring-amber-500/30"
              />
              <div className="hidden sm:block">
                <p className="text-sm font-semibold text-zinc-900 dark:text-white leading-tight">
                  {oaiprincipal.datcliente}
                </p>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  {oaiprincipal.nombrecomercial}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleLogout}
              className="inline-flex items-center gap-2 px-3 py-2 text-sm rounded-xl text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Salir</span>
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 w-full pb-4">
        {/* Hero: marca + acción principal */}
        <section className="relative overflow-hidden rounded-2xl border border-zinc-200/80 dark:border-zinc-800 bg-white/80 dark:bg-zinc-950/60 backdrop-blur-sm mb-5 animate-fade-in">
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute -top-24 -right-16 h-72 w-72 rounded-full bg-amber-500/15 blur-3xl" />
            <div className="absolute -bottom-28 -left-20 h-72 w-72 rounded-full bg-amber-600/10 blur-3xl" />
          </div>

          <div className="relative px-5 py-5 sm:px-8 sm:py-6">
            <p className="font-display text-3xl sm:text-4xl font-bold tracking-tight text-zinc-900 dark:text-white mb-1">
              Z Movilidad
            </p>
            <p className="text-base sm:text-lg text-zinc-600 dark:text-zinc-300 mb-1">
              Hola, {oaiprincipal.datcliente}
            </p>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-5">
              Solicita y administra tus servicios de transporte corporativo desde un solo lugar.
            </p>

            <div className="flex flex-col lg:flex-row lg:items-end gap-6 lg:gap-10">
              {solicitar && (
                <Link
                  to={PATHS.solicitar}
                  className="group inline-flex items-center justify-between gap-4 rounded-2xl px-6 py-5
                    bg-zinc-900 text-white dark:bg-amber-500 dark:text-zinc-950
                    hover:bg-zinc-800 dark:hover:bg-amber-400 transition-all duration-200
                    shadow-lg shadow-amber-500/10 min-w-[min(100%,20rem)]"
                >
                  <span className="flex items-center gap-3">
                    <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-white/10 dark:bg-zinc-950/15">
                      <Car className="w-5 h-5" />
                    </span>
                    <span>
                      <span className="block font-display text-lg font-semibold leading-tight">
                        {solicitar.titulo}
                      </span>
                      <span className="block text-sm opacity-80 mt-0.5">
                        {solicitar.descripcion}
                      </span>
                    </span>
                  </span>
                  <ArrowUpRight className="w-5 h-5 opacity-70 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                </Link>
              )}

              <div className="flex flex-wrap gap-2">
                {accesosRapidos.map((opcion) => {
                  const Icon = opcion.icono;
                  const ruta = MENU_PATHS[opcion.id];
                  if (!ruta) return null;
                  return (
                    <Link
                      key={opcion.id}
                      to={ruta}
                      className="inline-flex items-center gap-2 rounded-xl border border-zinc-200 dark:border-zinc-700
                        bg-zinc-50/80 dark:bg-zinc-900/80 px-3.5 py-2.5 text-sm font-medium
                        text-zinc-700 dark:text-zinc-200 hover:border-amber-500/40 hover:text-amber-700 dark:hover:text-amber-300 transition-colors"
                    >
                      <Icon className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                      {opcion.titulo}
                    </Link>
                  );
                })}
              </div>
            </div>

            <div className="mt-5 flex flex-wrap gap-3 text-xs sm:text-sm text-zinc-500 dark:text-zinc-400">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-zinc-100 dark:bg-zinc-900 px-3 py-1.5 border border-zinc-200/80 dark:border-zinc-800">
                <Activity className="w-3.5 h-3.5 text-amber-500" />
                {enProceso} en proceso
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-zinc-100 dark:bg-zinc-900 px-3 py-1.5 border border-zinc-200/80 dark:border-zinc-800">
                <History className="w-3.5 h-3.5 text-amber-500" />
                {enHistorial} en historial
              </span>
            </div>
          </div>
        </section>

        {opcionesAdmin.length > 0 && (
          <section className="mb-5 animate-fade-in-delay-1">
            <div className="flex items-end justify-between gap-3 mb-3">
              <div>
                <h3 className="font-display text-lg font-semibold text-zinc-900 dark:text-white">
                  Administración
                </h3>
                <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-0.5">
                  Herramientas de gestión según tus permisos
                </p>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-3">
              {opcionesAdmin.map((opcion) => (
                <AdminCard key={opcion.id} opcion={opcion} />
              ))}
            </div>
          </section>
        )}

        <section className="mb-5 animate-fade-in-delay-2">
          <div className="rounded-2xl border border-zinc-200/80 dark:border-zinc-800 bg-white/50 dark:bg-zinc-950/40 px-5 py-4 flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
            <p className="text-sm font-medium text-zinc-600 dark:text-zinc-300 sm:mr-auto">
              ¿Necesitas ayuda?
            </p>
            <div className="flex flex-wrap gap-2">
              {opcionesContacto.map((opcion) => (
                <SupportChip key={opcion.id} opcion={opcion} />
              ))}
            </div>
          </div>
        </section>

        {datosUsuario && (
          <div className="mb-8">
            <div className="zm-card-static p-6">
              <div className="flex items-center justify-between mb-4 gap-3 flex-wrap">
                <h3 className="zm-section-title flex items-center">
                  <Calendar className="w-5 h-5 mr-2 text-amber-600 dark:text-amber-400" />
                  Reporte mensual
                </h3>
                <div className="flex items-center space-x-3">
                  <select
                    value={mesSeleccionado}
                    onChange={(e) => setMesSeleccionado(e.target.value)}
                    className="zm-input w-auto min-w-[180px] py-2"
                  >
                    {generarOpcionesMeses().map((mes) => (
                      <option key={mes.mesanio} value={mes.mesanio}>
                        {mes.mesanio}
                      </option>
                    ))}
                  </select>
                  {isLoadingReporte && (
                    <Loader2 className="w-5 h-5 animate-spin text-amber-500" />
                  )}
                </div>
              </div>

              {reporteData.length > 0 ? (
                <div className="rounded-xl bg-zinc-50/80 dark:bg-zinc-900/50 border border-zinc-100 dark:border-zinc-800 p-4">
                  <div className="relative h-64">
                    <svg className="absolute inset-0 w-full h-full" style={{ zIndex: 2 }}>
                      <defs>
                        <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                          <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.9" />
                          <stop offset="100%" stopColor="#d97706" stopOpacity="0.9" />
                        </linearGradient>
                      </defs>
                      {reporteData.length > 1 && (
                        <polyline
                          fill="none"
                          stroke="url(#lineGradient)"
                          strokeWidth="3"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          points={reporteData.map((item, index) => {
                            const maxCuenta = Math.max(...reporteData.map((d) => d.cuenta), 1);
                            const x = (index / (reporteData.length - 1)) * 100;
                            const y = 100 - (item.cuenta / maxCuenta) * 80;
                            return `${x}%,${y}%`;
                          }).join(' ')}
                        />
                      )}
                      {reporteData.map((item, index) => {
                        const maxCuenta = Math.max(...reporteData.map((d) => d.cuenta), 1);
                        const x = (index / (reporteData.length - 1)) * 100;
                        const y = 100 - (item.cuenta / maxCuenta) * 80;
                        return (
                          <g key={`point-${index}`}>
                            <circle
                              cx={`${x}%`}
                              cy={`${y}%`}
                              r="4"
                              fill="#f59e0b"
                              stroke="#18181b"
                              strokeWidth="2"
                            />
                            <text
                              x={`${x}%`}
                              y={`${y - 8}%`}
                              textAnchor="middle"
                              className="text-xs fill-amber-600 dark:fill-amber-400 font-semibold"
                            >
                              {item.cuenta}
                            </text>
                          </g>
                        );
                      })}
                    </svg>

                    <div className="flex items-end justify-between h-full space-x-2" style={{ zIndex: 1 }}>
                      {reporteData.map((item) => {
                        const altura = (item.total / obtenerMaximoGrafico()) * 100;
                        return (
                          <div key={item.dia} className="flex flex-col items-center flex-1">
                            <div className="flex flex-col items-center mb-2 min-h-[60px] justify-end">
                              <span className="text-[10px] sm:text-xs text-zinc-500 dark:text-zinc-400 mb-1">
                                {formatearMoneda(item.total)}
                              </span>
                            </div>
                            <div
                              className="w-full rounded-t-md transition-all duration-500 opacity-90 bg-gradient-to-t from-amber-600 to-amber-400 hover:from-amber-500 hover:to-amber-300"
                              style={{ height: `${altura}%`, minHeight: '4px' }}
                            />
                            <div className="mt-2 text-xs sm:text-sm font-semibold text-zinc-600 dark:text-zinc-300">
                              {item.dia}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div className="mt-4 flex flex-col sm:flex-row justify-between gap-3 text-sm text-zinc-600 dark:text-zinc-400">
                    <div className="flex items-center gap-5">
                      <div className="flex items-center gap-2">
                        <div className="w-3.5 h-3.5 rounded bg-gradient-to-t from-amber-600 to-amber-400" />
                        <span>Montos (S/)</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-1 rounded bg-amber-500" />
                        <span>Viajes</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-1">
                        <TrendingUp className="w-4 h-4 text-amber-500" />
                        Total: {formatearMoneda(reporteData.reduce((sum, item) => sum + item.total, 0))}
                      </div>
                      <div className="flex items-center gap-1">
                        <Activity className="w-4 h-4 text-amber-500" />
                        Viajes: {reporteData.reduce((sum, item) => sum + item.cuenta, 0)}
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-zinc-500 dark:text-zinc-400">
                  {isLoadingReporte ? 'Cargando reporte...' : 'No hay datos para el mes seleccionado'}
                </div>
              )}
            </div>
          </div>
        )}

        {datosUsuario && (
          <div className="grid lg:grid-cols-2 gap-5 mb-8">
            <div className="zm-card-static p-6">
              <h3 className="zm-section-title mb-4 flex items-center">
                <Clock className="w-5 h-5 mr-2 text-amber-500" />
                En proceso
                <span className="ml-2 text-sm font-normal text-zinc-500">({datosUsuario.aaiprocesod.length})</span>
              </h3>
              {datosUsuario.aaiprocesod.length > 0 ? (
                <div className="overflow-x-auto overflow-y-auto max-h-[min(50vh,28rem)]">
                  <table className="zm-table">
                    <thead>
                      <tr>
                        <th># Servicio</th>
                        <th>Fecha</th>
                        <th>Hora</th>
                        <th>Origen</th>
                        <th className="!text-right">Costo</th>
                        <th className="!text-center">Estado</th>
                      </tr>
                    </thead>
                    <tbody>
                      {datosUsuario.aaiprocesod.map((servicio) => (
                        <tr key={servicio.idservicio}>
                          <td className="font-mono text-xs">#{servicio.idservicio}</td>
                          <td>{servicio.fecha}</td>
                          <td>{servicio.hora}</td>
                          <td className="max-w-[200px] truncate text-zinc-500" title={servicio.direccionorigen}>
                            {servicio.direccionorigen}
                          </td>
                          <td className="text-right font-semibold">
                            {formatearMoneda(servicio.costototal)}
                          </td>
                          <td className="text-center">
                            <span
                              className="px-2 py-0 rounded-full text-[11px] font-medium"
                              style={{
                                backgroundColor: servicio.colorcelda,
                                color: servicio.colortexto,
                              }}
                            >
                              {servicio.estado}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-10">
                  <Clock className="w-10 h-10 text-zinc-400 mx-auto mb-3" />
                  <p className="text-zinc-500 dark:text-zinc-400">No hay servicios en proceso</p>
                </div>
              )}
            </div>

            <div className="zm-card-static p-6">
              <h3 className="zm-section-title mb-4 flex items-center">
                <History className="w-5 h-5 mr-2 text-amber-500" />
                Historial reciente
                <span className="ml-2 text-sm font-normal text-zinc-500">({datosUsuario.aaihistoriald.length})</span>
              </h3>
              {datosUsuario.aaihistoriald.length > 0 ? (
                <div className="overflow-x-auto overflow-y-auto max-h-[min(50vh,28rem)]">
                  <table className="zm-table">
                    <thead>
                      <tr>
                        <th># Servicio</th>
                        <th>Fecha</th>
                        <th>Hora</th>
                        <th>Origen</th>
                        <th className="!text-right">Costo</th>
                        <th className="!text-center">Estado</th>
                      </tr>
                    </thead>
                    <tbody>
                      {datosUsuario.aaihistoriald.slice(0, 10).map((servicio) => (
                        <tr key={servicio.idservicio}>
                          <td className="font-mono text-xs">#{servicio.idservicio}</td>
                          <td>{servicio.fecha}</td>
                          <td>{servicio.hora}</td>
                          <td className="max-w-[200px] truncate text-zinc-500" title={servicio.direccionorigen}>
                            {servicio.direccionorigen}
                          </td>
                          <td className="text-right font-semibold">
                            {formatearMoneda(servicio.costototal)}
                          </td>
                          <td className="text-center">
                            <span
                              className="px-2 py-0 rounded-full text-[11px] font-medium"
                              style={{
                                backgroundColor: servicio.colorcelda,
                                color: servicio.colortexto,
                              }}
                            >
                              {servicio.estado}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-10">
                  <History className="w-10 h-10 text-zinc-400 mx-auto mb-3" />
                  <p className="text-zinc-500 dark:text-zinc-400">No hay servicios en el historial</p>
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </AppPageShell>

      {/* Diálogo de Confirmación para Salir */}
      <ConfirmDialog
        isOpen={mostrarConfirmacionSalir}
        title="Confirmar Salida"
        message="¿Estás seguro de que deseas cerrar sesión? Tendrás que volver a iniciar sesión para acceder."
        confirmText="Sí, salir"
        cancelText="Cancelar"
        onConfirm={confirmarSalir}
        onCancel={() => setMostrarConfirmacionSalir(false)}
        type="warning"
      />
    </>
  );
};