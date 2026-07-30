import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, MapPin, Clock, Car, Calendar, 
  Loader2, AlertCircle, Send,
  CheckCircle, Eye
} from 'lucide-react';
import { ThemeToggle } from './ThemeToggle';
import { AutocompleteInput } from './AutocompleteInput';
import { PersonalSearchInput } from './PersonalSearchInput';
import { FavoritosModal } from './FavoritosModal';
import { GoogleMap } from './GoogleMap';
import { Toast } from './Toast';
import { AppPageShell } from './ui/ListPageUI';
import {
  AppModal,
  ModalCancelButton,
  ModalPrimaryButton,
  modalFieldClass,
  modalLabelClass,
} from './ui/AppModal';
import { 
  obtenerConfiguracionSolicitud, 
  detectarZona,
  calcularRuta,
  calcularTarifa,
  guardarSolicitud
} from '../services/solicitarService';
import { obtenerSesion } from '../services/authService';
import { guardarPersonal as guardarPersonalService } from '../services/personalService';
import { 
  ConfiguracionSolicitudResponse, 
  SolicitudFormData, 
  Ubicacion,
  SolicitudRequest,
  SolicitudResponse
} from '../types/solicitar';

interface SolicitarServicioProps {
  onVolver: () => void;
  onNavegar: (vista: string) => void;
}

/**
 * Componente principal para solicitar servicios de transporte
 * Incluye formulario completo, mapa interactivo y cálculo de tarifas
 */
export const SolicitarServicio: React.FC<SolicitarServicioProps> = ({ onVolver, onNavegar }) => {
  try {
    const session = obtenerSesion();
    
    // Verificar sesión al cargar el componente
    useEffect(() => {
      if (!session || !session.key || !session.idpersonal || !session.idcliente) {
        console.error('Sesión inválida:', session);
        setError('Sesión no válida. Por favor, inicia sesión nuevamente.');
        return;
      }
      console.log('Sesión válida:', {
        idpersonal: session.idpersonal,
        idcliente: session.idcliente,
        key: session.key ? 'presente' : 'ausente'
      });
    }, []);

    const [configuracion, setConfiguracion] = useState<ConfiguracionSolicitudResponse | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [isSubmitting, setIsSubmitting] = useState(false);
    
    // Estados para fecha y hora actual
    const [fechaActual, setFechaActual] = useState<string>('');
    const [horaActual, setHoraActual] = useState<string>('');
    
    // Estados para ubicaciones
    const [ubicacionOrigen, setUbicacionOrigen] = useState<Ubicacion | null>(null);
    const [ubicacionDestino, setUbicacionDestino] = useState<Ubicacion | null>(null);
    const [zonaOrigen, setZonaOrigen] = useState<string>('');
    const [zonaDestino, setZonaDestino] = useState<string>('');
    const [tiempoZonaOrigen, setTiempoZonaOrigen] = useState<number>(0);
    const [rutaInfo, setRutaInfo] = useState<{
      distancia: number;
      tiempo: number;
      zonaOrigen?: string;
      zonaDestino?: string;
      puntos: Array<{ lat: number; lng: number }>;
    } | null>(null);
    const [isUpdatingFromMarker, setIsUpdatingFromMarker] = useState(false);
    
    // Estados para tarifa
    const [tarifaInfo, setTarifaInfo] = useState<{
      tarifa: number;
      courier: number;
      total: number;
      isLoading: boolean;
    }>({
      tarifa: 0,
      courier: 0,
      total: 0,
      isLoading: false
    });

    const [requiereFactura, setRequiereFactura] = useState(false);
    const IGV_PORCENTAJE = 0.18;

    const costoConIGV = tarifaInfo.total * (1 + IGV_PORCENTAJE);
    const montoIGV = tarifaInfo.total * IGV_PORCENTAJE;
    const costoFinal = requiereFactura ? costoConIGV : tarifaInfo.total;

    // Estados para modales
    const [modalFavoritos, setModalFavoritos] = useState<{
      isOpen: boolean;
      tipo: 'origen' | 'destino';
    }>({
      isOpen: false,
      tipo: 'origen'
    });

    // Estado para modal de agregar personal
    const [modalAgregarPersonal, setModalAgregarPersonal] = useState<{
      isOpen: boolean;
      apellidos: string;
      nombres: string;
      telefono: string;
      tipo: string;
      searchTerm?: string;
    }>({
      isOpen: false,
      apellidos: '',
      nombres: '',
      telefono: '',
      tipo: 'Invitado',
      searchTerm: ''
    });

    // Estado para diálogo de confirmación
    const [dialogoConfirmacion, setDialogoConfirmacion] = useState<{
      isOpen: boolean;
      tipo: 'confirmar' | 'exito';
      response: SolicitudResponse | null;
    }>({
      isOpen: false,
      tipo: 'confirmar',
      response: null
    });

    const [formData, setFormData] = useState<SolicitudFormData>({
      origen: '',
      destino: '',
      tipoServicio: 'inmediato',
      fechaReserva: '',
      horaReserva: '',
      tipoPago: '',
      tipoMovil: '',
      modoUsuario: '',
      tipoServicioDetalle: '',
      observaciones: '',
      centroCostos: '',
      area: '',
      motivo: '',
      detalleMotivo: '',
      personal: undefined
    });

    const [toast, setToast] = useState<{
      isVisible: boolean;
      message: string;
      type: 'success' | 'error';
    }>({
      isVisible: false,
      message: '',
      type: 'success'
    });

    // Establecer fecha y hora actual al cargar
    useEffect(() => {
      const ahora = new Date();
      const fecha = ahora.toISOString().split('T')[0]; // YYYY-MM-DD
      const hora = ahora.toTimeString().slice(0, 5); // HH:MM
      
      setFechaActual(fecha);
      setHoraActual(hora);
      setFormData(prev => ({ 
        ...prev, 
        fechaReserva: fecha,
        horaReserva: hora
      }));
    }, []);

    useEffect(() => {
      cargarConfiguracion();
    }, []);

    const formatearFechaHora = (date: Date) => {
      const fecha = date.getFullYear() + '-' + 
        String(date.getMonth() + 1).padStart(2, '0') + '-' + 
        String(date.getDate()).padStart(2, '0');
      const hora = String(date.getHours()).padStart(2, '0') + ':' + 
        String(date.getMinutes()).padStart(2, '0');
      return { fecha, hora };
    };

    const obtenerFechaHoraServicio = () => {
      const ahora = new Date();

      if (formData.tipoServicio === 'inmediato') {
        ahora.setMinutes(ahora.getMinutes() + tiempoZonaOrigen);
        return formatearFechaHora(ahora);
      }

      // Reserva: verificar si la diferencia con la hora seleccionada es menor al tiempo de zona
      const fechaHoraReserva = new Date(`${formData.fechaReserva}T${formData.horaReserva}:00`);
      const diferenciaMinutos = Math.floor((fechaHoraReserva.getTime() - ahora.getTime()) / (1000 * 60));

      if (tiempoZonaOrigen > 0 && diferenciaMinutos < tiempoZonaOrigen) {
        fechaHoraReserva.setMinutes(fechaHoraReserva.getMinutes() + tiempoZonaOrigen);
        return formatearFechaHora(fechaHoraReserva);
      }

      return { fecha: formData.fechaReserva!, hora: formData.horaReserva! };
    };

    // Función para calcular tarifa del servicio
    const calcularTarifaServicio = async () => {
      if (!ubicacionOrigen || !ubicacionDestino || !rutaInfo || !configuracion) {
        console.log('Faltan datos para calcular tarifa');
        return;
      }

      try {
        setTarifaInfo(prev => ({ ...prev, isLoading: true }));
        
        // Obtener sesión fresca
        const sessionActual = obtenerSesion();
        if (!sessionActual || !sessionActual.idcliente) {
          throw new Error('Sesión no válida');
        }

        const ahora = new Date();
        const fechaTarifa = ahora.getFullYear() + '-' + 
          String(ahora.getMonth() + 1).padStart(2, '0') + '-' + 
          String(ahora.getDate()).padStart(2, '0');
        const horaTarifa = String(ahora.getHours()).padStart(2, '0') + ':' + 
          String(ahora.getMinutes()).padStart(2, '0');

        const tarifaData = {
          modalidad: formData.tipoServicioDetalle === 'Courier' ? 'Courier' : 'Traslado',
          idcliente: sessionActual.idcliente,
          tpago: formData.tipoPago,
          fecha: formData.tipoServicio === 'reserva' ? formData.fechaReserva! : fechaTarifa,
          hora: formData.tipoServicio === 'reserva' ? formData.horaReserva! : horaTarifa,
          nusuarios: 1,
          zorigen: zonaOrigen || rutaInfo.zonaOrigen || '',
          zdestino: zonaDestino || rutaInfo.zonaDestino || '',
          tipomovil: formData.tipoMovil,
          tservicio: formData.tipoServicio === 'reserva' ? 1 : 0,
          ttarifario: 'Traslado',
          plataforma: 'Appintranet',
          distancia: rutaInfo.distancia,
          tiempo: rutaInfo.tiempo
        };

        console.log('Calculando tarifa con datos:', tarifaData);

        const tarifaResponse = await calcularTarifa(tarifaData);

        console.log('Respuesta de tarifa:', tarifaResponse);

        setTarifaInfo({
          tarifa: tarifaResponse.tarifa || 0,
          courier: tarifaResponse.courier || 0,
          total: (tarifaResponse.tarifa || 0) + (tarifaResponse.courier || 0),
          isLoading: false
        });
      } catch (error) {
        console.error('Error al calcular tarifa:', error);
        setTarifaInfo(prev => ({ ...prev, isLoading: false }));
        setToast({
          isVisible: true,
          message: 'Error al calcular tarifa del servicio',
          type: 'error'
        });
      }
    };

    // Funciones para manejar el modal de agregar personal
    const abrirModalAgregarPersonal = (searchTerm?: string) => {
      if (searchTerm) {
        // Intentar separar apellidos y nombres del término de búsqueda
        const partes = searchTerm.trim().split(' ');
        let apellidos = '';
        let nombres = '';
        
        if (partes.length === 1) {
          // Solo un nombre, asumir que es nombre
          nombres = partes[0];
        } else if (partes.length === 2) {
          // Dos partes, asumir apellido nombre
          apellidos = partes[0];
          nombres = partes[1];
        } else if (partes.length > 2) {
          // Más de dos partes, asumir que el último es nombre y el resto apellidos
          nombres = partes[partes.length - 1];
          apellidos = partes.slice(0, -1).join(' ');
        }
        
        setModalAgregarPersonal({
          isOpen: true,
          apellidos,
          nombres,
          telefono: '',
          tipo: 'Invitado',
          searchTerm
        });
      } else {
        setModalAgregarPersonal({
          isOpen: true,
          apellidos: '',
          nombres: '',
          telefono: '',
          tipo: 'Invitado',
          searchTerm: ''
        });
      }
    };

    const cerrarModalAgregarPersonal = () => {
      setModalAgregarPersonal({
        isOpen: false,
        apellidos: '',
        nombres: '',
        telefono: '',
        tipo: 'Invitado',
        searchTerm: ''
      });
    };

    const handleInputChangePersonal = (campo: 'apellidos' | 'nombres' | 'telefono' | 'tipo', valor: string) => {
      setModalAgregarPersonal(prev => ({ ...prev, [campo]: valor }));
    };

    const guardarPersonal = async () => {
      try {
        // Validar que todos los campos estén completos
        if (!modalAgregarPersonal.apellidos || !modalAgregarPersonal.nombres || !modalAgregarPersonal.telefono) {
          setToast({
            isVisible: true,
            message: 'Todos los campos son obligatorios',
            type: 'error'
          });
          return;
        }

        // Obtener sesión
        const session = obtenerSesion();
        if (!session || !session.idcliente) {
          setToast({
            isVisible: true,
            message: 'Sesión no válida',
            type: 'error'
          });
          return;
        }

        // Preparar datos del personal (similar a PersonalManagement)
        const personalData = {
          idpersonal: 0, // Nuevo registro
          idcliente: session.idcliente,
          tipodocumento: 'DNI', // Por defecto
          ndocumento: '', // Opcional para este contexto
          apellidos: modalAgregarPersonal.apellidos.trim(),
          nombres: modalAgregarPersonal.nombres.trim(),
          telefono: modalAgregarPersonal.telefono.trim(),
          email: '', // Opcional
          emailverificador: '', // Opcional
          datjefe: '', // Opcional
          area: '', // Opcional
          centrocostos: '', // Opcional
          administrador: false, // Por defecto
          jefe: false, // Por defecto
          validador: false, // Por defecto
          credito: false, // Por defecto
          idestado: 1, // Activo por defecto
          tipo: modalAgregarPersonal.tipo, // Usar el valor seleccionado del combobox
          cargo: '' // Opcional
        };

        // Importar y usar el servicio existente
        const response = await guardarPersonalService(personalData);
        
        // Mostrar mensaje de éxito
        setToast({
          isVisible: true,
          message: 'Personal agregado exitosamente',
          type: 'success'
        });

        // Cerrar modal
        cerrarModalAgregarPersonal();

        // Recargar la configuración para que aparezca en el dropdown
        await actualizarListaPersonal();
        
        // Después de recargar, buscar y seleccionar automáticamente el nuevo usuario
        setTimeout(async () => {
          if (configuracion) {
            const apellidos = modalAgregarPersonal.apellidos.trim();
            const nombres = modalAgregarPersonal.nombres.trim();
            const nombreCompleto = `${apellidos} ${nombres}`;
            
            // Buscar el nuevo personal en la lista actualizada
            const nuevoPersonal = configuracion.aipersonal.find(p => {
              const personalName = p.personal.trim().toLowerCase();
              const searchCompleto = nombreCompleto.toLowerCase();
              
              // Búsqueda por nombre completo
              if (personalName === searchCompleto) return true;
              if (personalName.includes(searchCompleto)) return true;
              
              // Búsqueda por partes del nombre
              const partesPersonal = personalName.split(' ');
              const partesBusqueda = searchCompleto.split(' ');
              
              return partesBusqueda.every(parte => 
                partesPersonal.some(partePersonal => partePersonal.includes(parte))
              );
            });
            
            if (nuevoPersonal) {
              // Actualizar el formulario para seleccionar el nuevo usuario
              setFormData(prev => ({
                ...prev,
                personal: nuevoPersonal.idpersonal
              }));
              
              setToast({
                isVisible: true,
                message: `${nuevoPersonal.personal} ha sido seleccionado automáticamente`,
                type: 'success'
              });
            } else {
              setToast({
                isVisible: true,
                message: `Usuario agregado exitosamente. Por favor, selecciónelo manualmente del listado.`,
                type: 'success'
              });
            }
          }
        }, 200);
        
      } catch (error) {
        setToast({
          isVisible: true,
          message: error instanceof Error ? error.message : 'Error al agregar personal',
          type: 'error'
        });
      }
    };

    // Efecto para recalcular tarifa cuando cambien los valores relevantes
    useEffect(() => {
      if (ubicacionOrigen && ubicacionDestino && rutaInfo && configuracion) {
        console.log('Recalculando tarifa por cambio en dependencias');
        calcularTarifaServicio();
      }
    }, [
      ubicacionOrigen,
      ubicacionDestino, 
      rutaInfo,
      formData.tipoMovil,
      formData.tipoPago,
      formData.tipoServicio,
      formData.fechaReserva,
      formData.horaReserva,
      formData.tipoServicioDetalle
    ]);

    const cargarConfiguracion = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const config = await obtenerConfiguracionSolicitud();
        setConfiguracion(config);
        
        // Establecer valores por defecto
        let tipoPagoDefault = '';
        if (config.aipagos.length > 0) {
          // Buscar si existe "Corporativo", si no usar el primero
          const corporativo = config.aipagos.find(p => p.tipo.toLowerCase() === 'corporativo');
          tipoPagoDefault = corporativo ? corporativo.tipo : config.aipagos[0].tipo;
        }
        
        // Verificar configuración "Area centrocostos fijo"
        const areaCentrosFijo = config.aiconfiguracion?.find(c => 
          c.opcion.toLowerCase().includes('area centrocostos fijo')
        )?.condicion || false;

        console.log('Configuración al cargar:');
        console.log('- Area centrocostos fijo:', areaCentrosFijo);
        console.log('- Centro de costos desde oidatos:', config.oidatos?.centrocostos);
        console.log('- Area desde oidatos:', config.oidatos?.area);
        console.log('- Configuraciones disponibles:', config.aiconfiguracion);

        // Establecer valores por defecto de configuración
        setFormData(prev => ({ 
          ...prev, 
          tipoPago: tipoPagoDefault,
          tipoMovil: config.aimovil.length > 0 ? config.aimovil[0].tipo : '',
          motivo: config.aimotivo.length > 0 ? config.aimotivo[0].motivo : '',
          modoUsuario: 'Para mí',
          tipoServicioDetalle: 'Traslado',
          // Si "Area centrocostos fijo" es true, usar valores de oidatos y bloquear
          // Si es false, permitir selección libre
          centroCostos: areaCentrosFijo 
            ? (config.oidatos?.centrocostos || '') 
            : (config.oidatos?.centrocostos || ''),
          area: areaCentrosFijo 
            ? (config.oidatos?.area || '') 
            : (config.oidatos?.area || '')
        }));
        
      } catch (error) {
        setError(error instanceof Error ? error.message : 'Error desconocido');
      } finally {
        setIsLoading(false);
      }
    };

    // Función para actualizar solo la lista de personal sin resetear el formulario
    const actualizarListaPersonal = async () => {
      try {
        const config = await obtenerConfiguracionSolicitud();
        setConfiguracion(prev => prev ? { ...prev, aipersonal: config.aipersonal } : config);
      } catch (error) {
        console.error('Error al actualizar lista de personal:', error);
        setToast({
          isVisible: true,
          message: 'Error al actualizar lista de personal',
          type: 'error'
        });
      }
    };

    const obtenerConfiguracionOpcion = (opcion: string): boolean => {
      if (!configuracion?.aiconfiguracion) return false;
      
      console.log('Buscando configuración para:', opcion);
      console.log('Configuraciones disponibles:', configuracion.aiconfiguracion);
      
      const config = configuracion.aiconfiguracion.find(c => 
        c.opcion.toLowerCase().includes(opcion.toLowerCase())
      );
      
      console.log('Configuración encontrada:', config);
      return config?.condicion || false;
    };

    // Determinar si los campos son editables y si se muestran
    const esCorporativo = formData.tipoPago === 'Corporativo';
    
    // Verificar configuraciones
    const areaCentrosFijo = obtenerConfiguracionOpcion('Area centrocostos fijo');
    const centroCostosRequerido = obtenerConfiguracionOpcion('Centro de costos');
    const areaRequerida = obtenerConfiguracionOpcion('Area');
    const motivoRequerido = obtenerConfiguracionOpcion('Motivo de solicitud');
    const detalleRequerido = obtenerConfiguracionOpcion('Detalle de motivo');

    // Si "Area centrocostos fijo" es true, los campos están bloqueados
    // Si es false, se aplican las validaciones individuales
    const camposEditables = {
      centroCostos: !areaCentrosFijo,
      area: !areaCentrosFijo,
      motivo: !motivoRequerido,
      detalle: !detalleRequerido
    };

    // Configuraciones de validación para campos obligatorios
    const camposObligatorios = {
      centroCostos: esCorporativo && (areaCentrosFijo || centroCostosRequerido),
      area: esCorporativo && (areaCentrosFijo || areaRequerida),
      motivo: esCorporativo && motivoRequerido,
      detalle: esCorporativo && detalleRequerido
    };

    console.log('Estado actual de validaciones:');
    console.log('- Es corporativo:', esCorporativo);
    console.log('- Area centrocostos fijo:', areaCentrosFijo);
    console.log('- Campos editables:', camposEditables);
    console.log('- Campos obligatorios:', camposObligatorios);
    console.log('- Datos del usuario (oidatos):', configuracion?.oidatos);
    console.log('- FormData actual:', formData);



    const handleOrigenChange = async (direccion: string, lat?: number, lng?: number) => {
      try {
        console.log('handleOrigenChange llamado con:', { direccion, lat, lng });
        
        setFormData(prev => ({ ...prev, origen: direccion }));
        
        if (lat && lng) {
          console.log('Estableciendo ubicación origen:', { lat, lng, direccion });
          setUbicacionOrigen({ lat, lng, direccion });
          
          // Si también tenemos destino, calcular ruta
          if (ubicacionDestino) {
            console.log('Calculando ruta con destino existente');
            await calcularRutaCompleta({ lat, lng, direccion }, ubicacionDestino);
          }
        } else {
          console.log('Limpiando ubicación origen');
          setUbicacionOrigen(null);
          setRutaInfo(null);
          setTarifaInfo({ tarifa: 0, courier: 0, total: 0, isLoading: false });
        }
      } catch (error) {
        console.error('Error en handleOrigenChange:', error);
        setToast({
          isVisible: true,
          message: 'Error al actualizar origen',
          type: 'error'
        });
      }
    };

    const handleDestinoChange = async (direccion: string, lat?: number, lng?: number) => {
      setFormData(prev => ({ ...prev, destino: direccion }));
      
      if (lat && lng) {
        setUbicacionDestino({ lat, lng, direccion });
        
        // Si también tenemos origen, calcular ruta
        if (ubicacionOrigen) {
          await calcularRutaCompleta(ubicacionOrigen, { lat, lng, direccion });
        }
      } else {
        setUbicacionDestino(null);
        setRutaInfo(null);
        setTarifaInfo({ tarifa: 0, courier: 0, total: 0, isLoading: false });
      }
    };

    const calcularRutaCompleta = async (origen: Ubicacion, destino: Ubicacion) => {
      try {
        console.log('Calculando ruta desde:', origen, 'hacia:', destino);
        
        // Calcular ruta
        const rutaResponse = await calcularRuta(origen.lat, origen.lng, destino.lat, destino.lng);
        console.log('Respuesta de ruta:', rutaResponse);
        
        // Detectar zonas
        const [zonaOrigenResponse, zonaDestinoResponse] = await Promise.all([
          detectarZona(origen.lat, origen.lng),
          detectarZona(destino.lat, destino.lng)
        ]);
        
        console.log('Zona origen:', zonaOrigenResponse);
        console.log('Zona destino:', zonaDestinoResponse);
        
        // Guardar zonas en variables separadas
        const zonaOrigenObtenida = zonaOrigenResponse.oozona?.zona || '';
        const zonaDestinoObtenida = zonaDestinoResponse.oozona?.zona || '';
        const tiempoZona = zonaOrigenResponse.oozona?.tiempo || 0;
        
        setZonaOrigen(zonaOrigenObtenida);
        setZonaDestino(zonaDestinoObtenida);
        setTiempoZonaOrigen(tiempoZona);
        
        console.log('Tiempo zona origen:', tiempoZona, 'minutos');
        
        console.log('Zonas establecidas - Origen:', zonaOrigenObtenida, 'Destino:', zonaDestinoObtenida);
        
        setRutaInfo({
          distancia: rutaResponse.distance,
          tiempo: rutaResponse.time,
          zonaOrigen: zonaOrigenObtenida,
          zonaDestino: zonaDestinoObtenida,
          puntos: Array.isArray(rutaResponse.route) ? rutaResponse.route : [],
        });
        
      } catch (error) {
        console.error('Error al calcular ruta:', error);
        setRutaInfo(null);
        setToast({
          isVisible: true,
          message: 'Error al calcular ruta. Intenta nuevamente.',
          type: 'error'
        });
      }
    };

    const handleFavoritoSelect = (direccion: string, lat: number, lng: number) => {
      if (modalFavoritos.tipo === 'origen') {
        handleOrigenChange(direccion, lat, lng);
      } else {
        handleDestinoChange(direccion, lat, lng);
      }
    };

    const handleMapLocationSelect = (lat: number, lng: number, address: string) => {
      // Por ahora, establecer como destino
      handleDestinoChange(address, lat, lng);
    };

    // Función para manejar el arrastre de markers
    const handleMarkerDrag = async (type: 'origen' | 'destino', lat: number, lng: number, address: string) => {
      setIsUpdatingFromMarker(true);
      
      try {
        if (type === 'origen') {
          // Actualizar origen cuando se mueve el marker
          setUbicacionOrigen({ lat, lng, direccion: address });
          setFormData(prev => ({ ...prev, origen: address }));
          
          // Si también tenemos destino, recalcular ruta
          if (ubicacionDestino) {
            await calcularRutaCompleta({ lat, lng, direccion: address }, ubicacionDestino);
          }
        } else if (type === 'destino') {
          // Actualizar destino cuando se mueve el marker
          setUbicacionDestino({ lat, lng, direccion: address });
          setFormData(prev => ({ ...prev, destino: address }));
          
          // Si también tenemos origen, recalcular ruta
          if (ubicacionOrigen) {
            await calcularRutaCompleta(ubicacionOrigen, { lat, lng, direccion: address });
          }
        }
        
        // Mostrar mensaje de éxito
        setToast({
          isVisible: true,
          message: `Ubicación de ${type === 'origen' ? 'origen' : 'destino'} actualizada`,
          type: 'success'
        });
      } catch (error) {
        setToast({
          isVisible: true,
          message: 'Error al actualizar ubicación desde el mapa',
          type: 'error'
        });
      } finally {
        setIsUpdatingFromMarker(false);
      }
    };

    const validarFormulario = (): boolean => {
      if (!ubicacionOrigen) {
        setToast({
          isVisible: true,
          message: 'Debe seleccionar una dirección de origen válida',
          type: 'error'
        });
        return false;
      }

      if (!ubicacionDestino) {
        setToast({
          isVisible: true,
          message: 'Debe seleccionar una dirección de destino válida',
          type: 'error'
        });
        return false;
      }

      if (!rutaInfo) {
        setToast({
          isVisible: true,
          message: 'Debe calcular la ruta antes de continuar',
          type: 'error'
        });
        return false;
      }

      // Validación específica para modo "Para otro"
      if (formData.modoUsuario === 'Para otro' && !formData.personal) {
        setToast({
          isVisible: true,
          message: 'Debe seleccionar un personal para el servicio',
          type: 'error'
        });
        return false;
      }

      // Validaciones específicas para tipo de pago Corporativo
      if (esCorporativo) {
        // Validar centro de costos
        if (camposObligatorios.centroCostos && !(formData.centroCostos || '').trim()) {
          setToast({
            isVisible: true,
            message: 'Debe seleccionar un centro de costos',
            type: 'error'
          });
          return false;
        }

        // Validar área
        if (camposObligatorios.area && !(formData.area || '').trim()) {
          setToast({
            isVisible: true,
            message: 'Debe seleccionar un área',
            type: 'error'
          });
          return false;
        }

        // Validar motivo
        if (camposObligatorios.motivo && !(formData.motivo || '').trim()) {
          setToast({
            isVisible: true,
            message: 'Debe seleccionar un motivo de solicitud',
            type: 'error'
          });
          return false;
        }

        // Validar detalle de motivo
        if (camposObligatorios.detalle && !(formData.detalleMotivo || '').trim()) {
          setToast({
            isVisible: true,
            message: 'Debe escribir el detalle del motivo',
            type: 'error'
          });
          return false;
        }
      }

      // Validación específica para reservas
      if (formData.tipoServicio === 'reserva') {
        if (!formData.fechaReserva || !formData.horaReserva) {
          setToast({
            isVisible: true,
            message: 'Debe especificar fecha y hora para la reserva',
            type: 'error'
          });
          return false;
        }

        // Validar que la reserva no sea en el pasado
        const ahora = new Date();
        const fechaHoraReserva = new Date(`${formData.fechaReserva}T${formData.horaReserva}:00`);
        if (fechaHoraReserva.getTime() <= ahora.getTime()) {
          setToast({
            isVisible: true,
            message: 'La fecha y hora de reserva debe ser posterior a la hora actual.',
            type: 'error'
          });
          return false;
        }
      }
      return true;
    };

    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      
      if (!validarFormulario() || !configuracion || !ubicacionOrigen || !ubicacionDestino || !rutaInfo) {
        return;
      }

      // Mostrar diálogo de confirmación antes de enviar
      setDialogoConfirmacion({
        isOpen: true,
        tipo: 'confirmar',
        response: null
      });
    };

    const confirmarSolicitud = async () => {
      const session = obtenerSesion();
      
      if (!session || !session.key || !session.idpersonal || !session.idcliente) {
        setToast({
          isVisible: true,
          message: 'Sesión no válida. Por favor, inicia sesión nuevamente.',
          type: 'error'
        });
        return;
      }

      if (!configuracion || !ubicacionOrigen || !ubicacionDestino || !rutaInfo) {
        return;
      }

      try {
        setDialogoConfirmacion(prev => ({ ...prev, isOpen: false }));
        setIsSubmitting(true);
        setError(null);

        // Obtener sesión fresca
        const sessionActual = obtenerSesion();
        if (!sessionActual || !sessionActual.idcliente) {
          throw new Error('Sesión no válida');
        }

        // Preparar datos para la solicitud
        const fechaHoraServicio = obtenerFechaHoraServicio();

        const solicitudData: SolicitudRequest = {
          idcliente: sessionActual.idcliente.toString(),
          tservicio: formData.tipoServicioDetalle === 'Courier' ? 'Courier' : 'Traslado',
          idpersonal: session.idpersonal,
          solicitante: configuracion.oidatos?.personal || '',
          centrocostos: formData.tipoPago === 'Corporativo' ? (formData.centroCostos || '') : '',
          area: formData.tipoPago === 'Corporativo' ? (formData.area || '') : '',
          motivo: formData.tipoPago === 'Corporativo' ? (formData.motivo || '') : '',
          motivodetalle: formData.tipoPago === 'Corporativo' ? (formData.detalleMotivo || '') : '',
          personalt: formData.modoUsuario === 'Para otro' && formData.personal 
            ? configuracion.aipersonal.find(p => p.idpersonal === formData.personal)?.personal || ''
            : configuracion.oidatos?.personal || '',
          formas: formData.tipoServicio === 'reserva' ? 'Reserva' : 'Inmediato',
          fecha: fechaHoraServicio.fecha,
          hora: fechaHoraServicio.hora,
          pago: formData.tipoPago,
          movil: formData.tipoMovil,
          subtotal: tarifaInfo.tarifa,
          costototal: tarifaInfo.total,
          zorigen: zonaOrigen || rutaInfo.zonaOrigen || '',
          latitudeorigen: ubicacionOrigen.lat,
          longitudeorigen: ubicacionOrigen.lng,
          direccionorigen: ubicacionOrigen.direccion,
          zdestino: zonaDestino || rutaInfo.zonaDestino || '',
          latitudedestino: ubicacionDestino.lat,
          longitudedestino: ubicacionDestino.lng,
          direcciondestino: ubicacionDestino.direccion,
          distancia: rutaInfo.distancia,
          tiempo: rutaInfo.tiempo,
          courier: tarifaInfo.courier,
          observaciones: formData.observaciones,
          ipproceso: '10.0.0.0',
          operador: 'Intranet'
        };

        console.log('Enviando solicitud:', solicitudData);
        
        const response = await guardarSolicitud(solicitudData);
        
        console.log('Respuesta de solicitud:', response);
        
        // Mostrar diálogo de éxito
        setDialogoConfirmacion({
          isOpen: true,
          tipo: 'exito',
          response: response
        });
        
        // Mostrar toast con número de servicio
        setToast({
          isVisible: true,
          message: `Servicio #${response.idreserva} creado exitosamente`,
          type: 'success'
        });
        
      } catch (error) {
        setToast({
          isVisible: true,
          message: error instanceof Error ? error.message : 'Error al enviar solicitud',
          type: 'error'
        });
      } finally {
        setIsSubmitting(false);
      }
    };

    // Efecto para recalcular tarifa cuando cambien los valores relevantes
    useEffect(() => {
      if (ubicacionOrigen && ubicacionDestino && rutaInfo && configuracion) {
        console.log('Recalculando tarifa por cambio en dependencias');
        calcularTarifaServicio();
      }
    }, [
      ubicacionOrigen,
      ubicacionDestino, 
      rutaInfo,
      formData.tipoMovil,
      formData.tipoPago,
      formData.tipoServicio,
      formData.fechaReserva,
      formData.horaReserva,
      formData.tipoServicioDetalle
    ]);

    const formatearMoneda = (monto: number): string => {
      return `S/ ${monto.toFixed(2)}`;
    };

    const formatearTiempo = (minutos: number): string => {
      if (minutos < 60) {
        return `${Math.round(minutos)} min`;
      }
      const horas = Math.floor(minutos / 60);
      const mins = Math.round(minutos % 60);
      return `${horas}h ${mins}min`;
    };

    const formatearDistancia = (km: number): string => {
      if (km < 1) {
        return `${Math.round(km * 1000)} m`;
      }
      return `${km.toFixed(1)} km`;
    };

    if (isLoading) {
      return (
        <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="w-12 h-12 animate-spin text-primary-600 mx-auto mb-4" />
            <p className="text-zinc-600 dark:text-zinc-400">Cargando configuración...</p>
          </div>
        </div>
      );
    }

    if (error) {
      return (
        <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex items-center justify-center">
          <div className="text-center max-w-md mx-auto p-6">
            <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-zinc-900 dark:text-white mb-2">
              Error al cargar configuración
            </h2>
            <p className="text-zinc-600 dark:text-zinc-400 mb-4">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors duration-200"
            >
              Reintentar
            </button>
          </div>
        </div>
      );
    }

    if (!configuracion) return null;

    return (
      <AppPageShell>
        {/* Header */}
        <header className="shrink-0 border-b border-zinc-200/80 dark:border-zinc-800/80 mb-4">
          <div className="flex items-center justify-between h-14">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={onVolver}
                className="inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-white transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                Volver
              </button>
              <div className="h-6 w-px bg-zinc-200 dark:bg-zinc-800" />
              <h1 className="font-display text-lg font-semibold text-zinc-900 dark:text-white flex items-center gap-2">
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/15 text-amber-600 dark:text-amber-400">
                  <Car className="w-4 h-4" />
                </span>
                Solicitar servicio
              </h1>
            </div>
            <ThemeToggle />
          </div>
        </header>

        <div className="w-full flex-1 pb-4">
          <div className="grid lg:grid-cols-3 gap-6">
            
            {/* Formulario */}
            <div className="lg:col-span-1 space-y-6">
              <form onSubmit={handleSubmit} className="space-y-6">
                
                {/* Ubicaciones */}
                <div className="zm-card-static p-5">
                  <h3 className="zm-section-title mb-4 flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-amber-500" />
                    Ubicaciones
                  </h3>
                  
                  <div className="mb-4 rounded-xl border border-amber-500/20 bg-amber-500/10 px-3.5 py-3">
                    <p className="text-sm text-amber-900 dark:text-amber-100/90 leading-relaxed">
                      Arrastra los marcadores en el mapa para ajustar origen y destino. Las direcciones se actualizan solas.
                    </p>
                  </div>
                  
                  <div className="space-y-4">
                    <AutocompleteInput
                      label="Origen"
                      placeholder="¿Desde dónde te recogemos?"
                      value={formData.origen}
                      onChange={handleOrigenChange}
                      onFavoriteClick={() => setModalFavoritos({ isOpen: true, tipo: 'origen' })}
                      showFavoriteButton={true}
                    />
                    
                    <AutocompleteInput
                      label="Destino"
                      placeholder="¿A dónde te llevamos?"
                      value={formData.destino}
                      onChange={handleDestinoChange}
                      onFavoriteClick={() => setModalFavoritos({ isOpen: true, tipo: 'destino' })}
                      showFavoriteButton={true}
                    />
                  </div>
                </div>



                {/* Programación */}
                <div className="zm-card-static p-5">
                  <h3 className="zm-section-title mb-4 flex items-center gap-2">
                    <Clock className="w-5 h-5 text-amber-500" />
                    Programación
                  </h3>
                  
                  <div className="space-y-4">
                    {/* Tipo de servicio */}
                    <div>
                      <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                        ¿Cuándo necesitas el servicio?
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => setFormData(prev => ({ ...prev, tipoServicio: 'inmediato' }))}
                          className={`p-3 rounded-lg border-2 transition-all duration-200 ${
                            formData.tipoServicio === 'inmediato'
                              ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300'
                              : 'border-zinc-200 dark:border-zinc-700 hover:border-gray-400 dark:hover:border-gray-500 text-zinc-700 dark:text-zinc-300'
                          }`}
                        >
                          <div className="text-center">
                            <Clock className="w-5 h-5 mx-auto mb-1" />
                            <span className="text-sm font-medium">Ahora</span>
                          </div>
                        </button>
                        <button
                          type="button"
                          onClick={() => setFormData(prev => ({ ...prev, tipoServicio: 'reserva' }))}
                          className={`p-3 rounded-lg border-2 transition-all duration-200 ${
                            formData.tipoServicio === 'reserva'
                              ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300'
                              : 'border-zinc-200 dark:border-zinc-700 hover:border-gray-400 dark:hover:border-gray-500 text-zinc-700 dark:text-zinc-300'
                          }`}
                        >
                          <div className="text-center">
                            <Calendar className="w-5 h-5 mx-auto mb-1" />
                            <span className="text-sm font-medium">Reservar</span>
                          </div>
                        </button>
                      </div>
                    </div>

                    {/* Fecha y hora de reserva */}
                    {formData.tipoServicio === 'reserva' && (
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                            Fecha
                          </label>
                          <input
                            type="date"
                            value={formData.fechaReserva}
                            onChange={(e) => setFormData(prev => ({ ...prev, fechaReserva: e.target.value }))}
                            min={fechaActual}
                            className="zm-input"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                            Hora
                          </label>
                          <input
                            type="time"
                            value={formData.horaReserva}
                            onChange={(e) => setFormData(prev => ({ ...prev, horaReserva: e.target.value }))}
                            className="zm-input"
                            required
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Configuración */}
                <div className="zm-card-static p-5">
                  <h3 className="zm-section-title mb-4 flex items-center gap-2">
                    <Car className="w-5 h-5 text-amber-500" />
                    Configuración
                  </h3>
                  
                  <div className="space-y-4">
                    <div className="grid md:grid-cols-2 gap-4">
                      {/* Tipo de pago */}
                      <div>
                        <label className="zm-label">
                          Tipo de pago
                        </label>
                        <select
                          value={formData.tipoPago}
                          onChange={(e) => setFormData(prev => ({ ...prev, tipoPago: e.target.value }))}
                          className="zm-input"
                          required
                        >
                          {configuracion.aipagos.map((pago) => (
                            <option key={pago.tipo} value={pago.tipo}>
                              {pago.tipo}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Tipo de móvil */}
                      <div>
                        <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                          Tipo de móvil
                        </label>
                        <select
                          value={formData.tipoMovil}
                          onChange={(e) => setFormData(prev => ({ ...prev, tipoMovil: e.target.value }))}
                          className="zm-input"
                          required
                        >
                          {configuracion.aimovil.map((movil) => (
                            <option key={movil.tipo} value={movil.tipo}>
                              {movil.tipo}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Modo de usuario */}
                      <div>
                        <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                          Modo de usuario
                        </label>
                        <select
                          value={formData.modoUsuario}
                          onChange={(e) => setFormData(prev => ({ ...prev, modoUsuario: e.target.value }))}
                          className="zm-input"
                          required
                        >
                          <option value="Para mí">Para mí</option>
                          <option value="Para otro">Para otro</option>
                        </select>
                      </div>

                      {/* Tipo de servicio */}
                      <div>
                        <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                          Tipo de servicio
                        </label>
                        <select
                          value={formData.tipoServicioDetalle}
                          onChange={(e) => setFormData(prev => ({ ...prev, tipoServicioDetalle: e.target.value }))}
                          className="zm-input"
                          required
                        >
                          <option value="Traslado">Traslado</option>
                          <option value="Courier">Courier</option>
                        </select>
                      </div>
                    </div>

                    {/* Factura */}
                    <div className="flex items-center justify-between p-3 bg-zinc-50 dark:bg-zinc-800/50 rounded-lg">
                      <div>
                        <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">¿Requiere factura?</span>
                        <p className="text-xs text-zinc-500 dark:text-zinc-400">Se aplicará IGV (18%) al costo total</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setRequiereFactura(!requiereFactura)}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 ${
                          requiereFactura ? 'bg-primary-500' : 'bg-gray-300 dark:bg-gray-600'
                        }`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200 ${
                            requiereFactura ? 'translate-x-6' : 'translate-x-1'
                          }`}
                        />
                      </button>
                    </div>

                    {/* Personal - Solo si es "Para otro" */}
                    {formData.modoUsuario === 'Para otro' && (
                      <PersonalSearchInput
                        label="Seleccionar personal"
                        placeholder="Buscar personal..."
                        value={formData.personal}
                        onChange={(idpersonal) => setFormData(prev => ({ ...prev, personal: idpersonal }))}
                        personalList={configuracion.aipersonal}
                        onAddPersonal={(searchTerm) => abrirModalAgregarPersonal(searchTerm)}
                      />
                    )}

                    {/* Campos corporativos - Solo mostrar si es Corporativo */}
                    {esCorporativo && (
                      <div className="space-y-4 border-t border-zinc-200 dark:border-zinc-700 pt-4">
                        <h4 className="text-md font-semibold text-zinc-900 dark:text-white">
                          Información Corporativa
                        </h4>
                        
                        <div className="grid md:grid-cols-2 gap-4">
                          {/* Centro de costos */}
                          <div className="col-span-2">
                            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                              Centro de costos {camposObligatorios.centroCostos && <span className="text-red-500">*</span>}
                            </label>
                            {camposEditables.centroCostos ? (
                              <select
                                value={formData.centroCostos}
                                onChange={(e) => setFormData(prev => ({ ...prev, centroCostos: e.target.value }))}
                                className="zm-input"
                                required={camposObligatorios.centroCostos}
                              >
                                <option value="">Seleccionar centro de costos</option>
                                {configuracion.aicentrocostos.map((centro) => (
                                  <option key={centro.centrocostos} value={centro.centrocostos}>
                                    {centro.centrocostos}
                                  </option>
                                ))}
                              </select>
                            ) : (
                              <input
                                type="text"
                                value={configuracion.oidatos?.centrocostos || 'Centro de costos asignado'}
                                className="w-full px-3 py-2 border border-zinc-200 dark:border-zinc-700 rounded-lg bg-gray-100 dark:bg-gray-600 text-zinc-700 dark:text-zinc-300 cursor-not-allowed"
                                readOnly
                              />
                            )}
                          </div>

                          {/* Área */}
                          <div className="col-span-2">
                            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                              Área {camposObligatorios.area && <span className="text-red-500">*</span>}
                            </label>
                            {camposEditables.area ? (
                              <select
                                value={formData.area}
                                onChange={(e) => setFormData(prev => ({ ...prev, area: e.target.value }))}
                                className="zm-input"
                                required={camposObligatorios.area}
                              >
                                <option value="">Seleccionar área</option>
                                {configuracion.aiarea.map((area) => (
                                  <option key={area.area} value={area.area}>
                                    {area.area}
                                  </option>
                                ))}
                              </select>
                            ) : (
                              <input
                                type="text"
                                value={configuracion.oidatos?.area || 'Área asignada'}
                                className="w-full px-3 py-2 border border-zinc-200 dark:border-zinc-700 rounded-lg bg-gray-100 dark:bg-gray-600 text-zinc-700 dark:text-zinc-300 cursor-not-allowed"
                                readOnly
                              />
                            )}
                          </div>
                        </div>

                        <div className="space-y-4">
                          {/* Motivo */}
                          <div>
                            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                              Motivo de solicitud {camposObligatorios.motivo && <span className="text-red-500">*</span>}
                            </label>
                            {camposEditables.motivo ? (
                              <select
                                value={formData.motivo}
                                onChange={(e) => setFormData(prev => ({ ...prev, motivo: e.target.value }))}
                                className="zm-input"
                                required={camposObligatorios.motivo}
                              >
                                <option value="">Seleccionar motivo</option>
                                {configuracion.aimotivo.map((motivo) => (
                                  <option key={motivo.motivo} value={motivo.motivo}>
                                    {motivo.motivo}
                                  </option>
                                ))}
                              </select>
                            ) : (
                              <input
                                type="text"
                                value={formData.motivo || "Motivo predeterminado"}
                                className="w-full px-3 py-2 border border-zinc-200 dark:border-zinc-700 rounded-lg bg-gray-100 dark:bg-gray-600 text-zinc-700 dark:text-zinc-300 cursor-not-allowed"
                                readOnly
                              />
                            )}
                          </div>

                          {/* Detalle del motivo */}
                          {(camposEditables.detalle || camposObligatorios.detalle) && (
                            <div>
                              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                                Detalle del motivo {camposObligatorios.detalle && <span className="text-red-500">*</span>}
                              </label>
                              <textarea
                                value={formData.detalleMotivo ?? ''}
                                onChange={(e) => {
                                  const value = e.target.value;
                                  if (value.length <= 250) {
                                    setFormData(prev => ({ ...prev, detalleMotivo: value }));
                                  }
                                }}
                                rows={3}
                                maxLength={250}
                                className="w-full px-3 py-2 border border-zinc-200 dark:border-zinc-700 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white resize-none"
                                placeholder="Describe el detalle del motivo..."
                                required={camposObligatorios.detalle}
                              />
                                                             <div className="text-right text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                                 {(formData.detalleMotivo ?? '').length}/250 caracteres
                               </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Observaciones */}
                    <div>
                      <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                        Observaciones
                      </label>
                      <textarea
                        value={formData.observaciones}
                        onChange={(e) => {
                          const value = e.target.value;
                          if (value.length <= 250) {
                            setFormData(prev => ({ ...prev, observaciones: value }));
                          }
                        }}
                        rows={3}
                        maxLength={250}
                        className="w-full px-3 py-2 border border-zinc-200 dark:border-zinc-700 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white resize-none"
                        placeholder="Observaciones adicionales..."
                      />
                      <div className="text-right text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                        {formData.observaciones.length}/250 caracteres
                      </div>
                    </div>
                  </div>
                </div>

                {/* Información de Ruta y Tarifa */}
                {rutaInfo && tarifaInfo.total > 0 && (
                  <div className="bg-gradient-to-r from-primary-50 to-secondary-50 dark:from-primary-900/20 dark:to-secondary-900/20 rounded-xl p-6 border border-primary-200 dark:border-primary-700">
                    <div className="text-center">
                      <div className="text-3xl font-bold text-primary-600 dark:text-primary-400 mb-2">
                        {tarifaInfo.isLoading ? (
                          <div className="flex items-center justify-center">
                            <Loader2 className="w-6 h-6 animate-spin mr-2" />
                            Calculando...
                          </div>
                        ) : (
                          formatearMoneda(tarifaInfo.total)
                        )}
                      </div>
                      
                      <div className="flex items-center justify-center space-x-6 text-sm text-zinc-600 dark:text-zinc-400">
                        <div className="flex items-center">
                          <MapPin className="w-4 h-4 mr-1" />
                          {formatearDistancia(rutaInfo.distancia)}
                        </div>
                        <div className="flex items-center">
                          <Clock className="w-4 h-4 mr-1" />
                          {formatearTiempo(rutaInfo.tiempo)}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Botón de envío */}
                <button
                  type="submit"
                  disabled={isSubmitting || !ubicacionOrigen || !ubicacionDestino || !rutaInfo || tarifaInfo.total <= 0}
                  className="w-full flex justify-center items-center py-4 px-6 rounded-xl text-white font-semibold bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-400 focus:ring-offset-2 focus:ring-offset-transparent transform transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none shadow-lg hover:shadow-xl group"
                >
                  {isSubmitting ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      <Send className="w-5 h-5 mr-2 group-hover:translate-x-1 transition-transform duration-200" />
                      <span>Solicitar Servicio</span>
                    </>
                  )}
                </button>
              </form>
            </div>

                        {/* Mapa */}
            <div className="lg:col-span-2">
              <div className="relative zm-card-static overflow-hidden" style={{ height: 'calc(100vh - 8rem)' }}>
                <div className="absolute top-4 right-4 z-[1000] rounded-xl bg-white/95 dark:bg-zinc-900/95 backdrop-blur-md shadow-lg p-3 border border-zinc-200 dark:border-zinc-800">
                  <div className="flex items-center space-x-2 text-sm text-zinc-600 dark:text-zinc-400">
                    <div className="w-3 h-3 bg-emerald-500 rounded-full"></div>
                    <span>Origen</span>
                  </div>
                  <div className="flex items-center space-x-2 text-sm text-zinc-600 dark:text-zinc-400 mt-1">
                    <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                    <span>Destino</span>
                  </div>
                  {rutaInfo?.puntos && rutaInfo.puntos.length > 0 && (
                    <div className="flex items-center space-x-2 text-sm text-amber-600 dark:text-amber-400 mt-1">
                      <div className="w-3 h-1 rounded bg-amber-500"></div>
                      <span>Ruta</span>
                    </div>
                  )}
                  {isUpdatingFromMarker && (
                    <div className="mt-2 pt-2 border-t border-zinc-200 dark:border-zinc-800">
                      <div className="flex items-center space-x-2 text-xs text-amber-600 dark:text-amber-400">
                        <Loader2 className="w-3 h-3 animate-spin" />
                        <span>Actualizando…</span>
                      </div>
                    </div>
                  )}
                </div>
                
                                  <GoogleMap
                    origen={ubicacionOrigen || undefined}
                    destino={ubicacionDestino || undefined}
                    rutaPolyline={rutaInfo?.puntos || []}
                    onLocationSelect={handleMapLocationSelect}
                    onMarkerDrag={handleMarkerDrag}
                    useCustomPins={true}
                    className="h-full w-full"
                  />
              </div>
            </div>
        </div>
      </div>

      {/* Modal de Favoritos */}
      <FavoritosModal
        isOpen={modalFavoritos.isOpen}
        onClose={() => setModalFavoritos({ isOpen: false, tipo: 'origen' })}
        onSelectFavorito={handleFavoritoSelect}
        tipo={modalFavoritos.tipo}
      />

      <AppModal
        open={dialogoConfirmacion.isOpen}
        onClose={() => {
          if (dialogoConfirmacion.tipo === 'confirmar' && !isSubmitting) {
            setDialogoConfirmacion({ isOpen: false, tipo: 'confirmar', response: null });
          }
        }}
        title={
          dialogoConfirmacion.tipo === 'confirmar'
            ? 'Confirmar solicitud'
            : '¡Servicio generado!'
        }
        subtitle={
          dialogoConfirmacion.tipo === 'exito' && dialogoConfirmacion.response
            ? `Servicio #${dialogoConfirmacion.response.idreserva}`
            : undefined
        }
        size="md"
        busy={isSubmitting}
        footer={
          dialogoConfirmacion.tipo === 'confirmar' ? (
            <>
              <ModalCancelButton
                onClick={() =>
                  setDialogoConfirmacion({ isOpen: false, tipo: 'confirmar', response: null })
                }
                disabled={isSubmitting}
              />
              <ModalPrimaryButton onClick={confirmarSolicitud} loading={isSubmitting}>
                <Send className="w-4 h-4" />
                Confirmar
              </ModalPrimaryButton>
            </>
          ) : (
            <>
              <ModalCancelButton
                onClick={() => {
                  setDialogoConfirmacion({ isOpen: false, tipo: 'confirmar', response: null });
                  onVolver();
                }}
              >
                Dashboard
              </ModalCancelButton>
              <ModalPrimaryButton
                onClick={() => {
                  setDialogoConfirmacion({ isOpen: false, tipo: 'confirmar', response: null });
                  onNavegar('mis-servicios');
                }}
              >
                <Eye className="w-4 h-4" />
                Mis Servicios
              </ModalPrimaryButton>
            </>
          )
        }
      >
        {dialogoConfirmacion.tipo === 'confirmar' ? (
          <div className="space-y-3 text-sm">
            <div className="flex justify-between gap-3">
              <span className="text-zinc-500 shrink-0">Origen</span>
              <span className="text-zinc-900 dark:text-white text-right font-medium">
                {ubicacionOrigen?.direccion}
              </span>
            </div>
            <div className="flex justify-between gap-3">
              <span className="text-zinc-500 shrink-0">Destino</span>
              <span className="text-zinc-900 dark:text-white text-right font-medium">
                {ubicacionDestino?.direccion}
              </span>
            </div>
            <div className="flex justify-between gap-3">
              <span className="text-zinc-500">Tipo</span>
              <span className="text-zinc-900 dark:text-white font-medium">
                {formData.tipoServicio === 'inmediato' ? 'Inmediato' : 'Reserva'}
              </span>
            </div>
            {formData.tipoServicio === 'reserva' && (
              <div className="flex justify-between gap-3">
                <span className="text-zinc-500">Fecha/Hora</span>
                <span className="text-zinc-900 dark:text-white font-medium">
                  {formData.fechaReserva} {formData.horaReserva}
                </span>
              </div>
            )}
            <div className="flex justify-between gap-3 pt-2 border-t border-zinc-200 dark:border-zinc-800">
              <span className="text-zinc-500">Total</span>
              <span className="font-display text-lg font-bold text-amber-600 dark:text-amber-400">
                {formatearMoneda(tarifaInfo.total)}
              </span>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-3 text-sm text-zinc-600 dark:text-zinc-300">
            <CheckCircle className="w-5 h-5 text-emerald-500 shrink-0" />
            El servicio se registró correctamente.
          </div>
        )}
      </AppModal>

      {/* Toast de Notificación */}
      <Toast
        message={toast.message}
        type={toast.type}
        isVisible={toast.isVisible}
        onClose={() => setToast(prev => ({ ...prev, isVisible: false }))}
      />

      <AppModal
        open={modalAgregarPersonal.isOpen}
        onClose={cerrarModalAgregarPersonal}
        title="Agregar personal"
        subtitle={
          modalAgregarPersonal.searchTerm
            ? `Búsqueda: "${modalAgregarPersonal.searchTerm}"`
            : undefined
        }
        size="md"
        footer={
          <>
            <ModalCancelButton onClick={cerrarModalAgregarPersonal} />
            <ModalPrimaryButton
              onClick={guardarPersonal}
              disabled={
                !modalAgregarPersonal.apellidos ||
                !modalAgregarPersonal.nombres ||
                !modalAgregarPersonal.telefono
              }
            >
              Guardar
            </ModalPrimaryButton>
          </>
        }
      >
        <div className="space-y-3">
          <div>
            <label className={modalLabelClass}>Apellidos *</label>
            <input
              type="text"
              value={modalAgregarPersonal.apellidos}
              onChange={(e) => handleInputChangePersonal('apellidos', e.target.value)}
              className={modalFieldClass}
              placeholder="Ingrese apellidos"
              required
            />
          </div>
          <div>
            <label className={modalLabelClass}>Nombres *</label>
            <input
              type="text"
              value={modalAgregarPersonal.nombres}
              onChange={(e) => handleInputChangePersonal('nombres', e.target.value)}
              className={modalFieldClass}
              placeholder="Ingrese nombres"
              required
            />
          </div>
          <div>
            <label className={modalLabelClass}>Teléfono *</label>
            <input
              type="tel"
              value={modalAgregarPersonal.telefono}
              onChange={(e) => handleInputChangePersonal('telefono', e.target.value)}
              className={modalFieldClass}
              placeholder="Ingrese teléfono"
              required
            />
          </div>
        </div>
      </AppModal>
    </AppPageShell>
  );
  } catch (error) {
    console.error('Error inesperado en SolicitarServicio:', error);
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-zinc-900 dark:text-white mb-2">
            Error inesperado
          </h2>
          <p className="text-zinc-600 dark:text-zinc-400 mb-4">
            Ha ocurrido un error inesperado. Por favor, intenta nuevamente o contacta al soporte.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors duration-200"
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }
};