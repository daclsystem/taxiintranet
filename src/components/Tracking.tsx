import React, { useEffect, useRef, useState } from 'react';
import {
  ArrowLeft,
  Loader2,
  AlertCircle,
  MapPin,
  Clock,
  User,
  Car,
  Phone,
  X,
  RefreshCw,
} from 'lucide-react';
import { obtenerTracking, obtenerRuta } from '../services/trackingService';
import { TrackingResponse, RutaResponse } from '../types/tracking';
import { ThemeToggle } from './ThemeToggle';
import { GoogleMap } from './GoogleMap';
import { AppPageShell } from './ui/ListPageUI';

interface TrackingProps {
  token: string;
  onVolver: () => void;
  /** modal = encima del listado. page = pantalla completa. */
  variant?: 'modal' | 'page';
}

/**
 * Tracking: mapa + datos al costado (overlay o página).
 */
export const Tracking: React.FC<TrackingProps> = ({ token, onVolver, variant = 'modal' }) => {
  const isModal = variant === 'modal';
  const [trackingData, setTrackingData] = useState<TrackingResponse | null>(null);
  const [rutaData, setRutaData] = useState<RutaResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const mapKeyRef = useRef<string>('');

  useEffect(() => {
    cargarTracking();
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [token]);

  useEffect(() => {
    if (!trackingData) return;
    const { otservicio } = trackingData;

    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    if ([8, 9, 10, 11].includes(otservicio.idestado)) {
      intervalRef.current = setInterval(() => {
        cargarTracking(true);
      }, 20000);
    }

    if (
      otservicio.idestado === 8 &&
      trackingData.aotpuntos.length > 0 &&
      otservicio.latitude &&
      otservicio.longitude &&
      otservicio.latitude !== 0 &&
      otservicio.longitude !== 0
    ) {
      const primerPunto = trackingData.aotpuntos[0];
      if (
        primerPunto.latitude &&
        primerPunto.longitude &&
        primerPunto.latitude !== 0 &&
        primerPunto.longitude !== 0
      ) {
        obtenerRutaConductor(
          otservicio.latitude,
          otservicio.longitude,
          primerPunto.latitude,
          primerPunto.longitude
        );
      }
    }

    const newMapKey = `${trackingData.aotpuntos.map((p) => `${p.latitude}-${p.longitude}`).join('|')}`;
    if (mapKeyRef.current !== newMapKey) {
      mapKeyRef.current = newMapKey;
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [trackingData]);

  const cargarTracking = async (silent = false) => {
    try {
      if (!silent) {
        setIsLoading(true);
        setError(null);
      }
      const data = await obtenerTracking(token);
      setTrackingData(data);
    } catch (err) {
      if (!silent) {
        setError(err instanceof Error ? err.message : 'Error desconocido');
      }
    } finally {
      if (!silent) setIsLoading(false);
    }
  };

  const obtenerRutaConductor = async (
    conductorLat: number,
    conductorLng: number,
    destinoLat: number,
    destinoLng: number
  ) => {
    try {
      const ruta = await obtenerRuta(conductorLat, conductorLng, destinoLat, destinoLng);
      setRutaData(ruta);
    } catch {
      setRutaData(null);
    }
  };

  const formatearMoneda = (monto: number) => `S/ ${(monto || 0).toFixed(2)}`;

  if (isLoading && !trackingData) {
    return (
      <div className="h-dvh bg-surface flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-10 h-10 animate-spin text-amber-500 mx-auto mb-3" />
          <p className="text-sm text-zinc-500">Cargando tracking...</p>
        </div>
      </div>
    );
  }

  if (error && !trackingData) {
    return (
      <div className="h-dvh bg-surface flex items-center justify-center p-6">
        <div className="text-center max-w-md">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-3" />
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-white mb-2">
            Error al cargar tracking
          </h2>
          <p className="text-sm text-zinc-500 mb-4">{error}</p>
          <button
            type="button"
            onClick={() => cargarTracking()}
            className="h-10 px-4 rounded-xl text-sm font-semibold bg-amber-500 text-zinc-950 hover:bg-amber-400"
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  if (!trackingData) return null;

  const { otservicio, aotpuntos, asrutagps } = trackingData;
  const esPendiente = otservicio.idestado === 7;
  const esEnCamino = otservicio.idestado === 8;
  const esCompletado = [12, 13, 14].includes(otservicio.idestado);
  const enVivo = [8, 9, 10, 11].includes(otservicio.idestado);
  const origen = aotpuntos[0]?.direccion || otservicio.direccionorigen;
  const destino =
    aotpuntos[aotpuntos.length - 1]?.direccion || otservicio.direcciondestino;

  const puntosRecorrido =
    aotpuntos.length > 0
      ? aotpuntos
      : [
          { item: 1, direccion: origen, latitude: 0, longitude: 0 },
          { item: 2, direccion: destino, latitude: 0, longitude: 0 },
        ];

  const content = (
    <>
      <header className="shrink-0 border-b border-zinc-200/80 dark:border-zinc-800/80 mb-2 px-1">
        <div className="flex items-center justify-between h-12 gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <button
              type="button"
              onClick={onVolver}
              className="inline-flex items-center gap-1.5 text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white"
            >
              {isModal ? <X className="w-4 h-4" /> : <ArrowLeft className="w-4 h-4" />}
              {isModal ? 'Cerrar' : 'Volver'}
            </button>
            <div className="h-5 w-px bg-zinc-200 dark:bg-zinc-800" />
            <div className="min-w-0">
              <h1 className="font-display text-sm font-semibold text-zinc-900 dark:text-white truncate">
                Tracking #{otservicio.idservicio}
              </h1>
            </div>
            {enVivo && (
              <span className="hidden sm:inline-flex items-center gap-1.5 text-[11px] font-medium text-emerald-600 dark:text-emerald-400 ml-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                En vivo
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => cargarTracking()}
              className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800"
              title="Actualizar"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
            {!isModal && <ThemeToggle />}
          </div>
        </div>
      </header>

      {/* Mapa + datos al costado */}
      <div className="flex-1 min-h-0 flex flex-col lg:flex-row gap-2">
        <div className="flex-1 min-h-[40vh] lg:min-h-0 rounded-xl overflow-hidden border border-zinc-200/80 dark:border-zinc-800 bg-zinc-900">
          {trackingData && (
            <GoogleMap
              key={mapKeyRef.current}
              origen={
                aotpuntos.length > 0
                  ? {
                      lat: aotpuntos[0].latitude,
                      lng: aotpuntos[0].longitude,
                      direccion: aotpuntos[0].direccion,
                    }
                  : undefined
              }
              destino={
                aotpuntos.length > 1
                  ? {
                      lat: aotpuntos[aotpuntos.length - 1].latitude,
                      lng: aotpuntos[aotpuntos.length - 1].longitude,
                      direccion: aotpuntos[aotpuntos.length - 1].direccion,
                    }
                  : undefined
              }
              conductor={
                !esPendiente &&
                !esCompletado &&
                otservicio.latitude &&
                otservicio.longitude
                  ? {
                      lat: otservicio.latitude,
                      lng: otservicio.longitude,
                      nombre: otservicio.nombres,
                      angulo: otservicio.angulo,
                    }
                  : undefined
              }
              todosLosPuntos={aotpuntos.map((punto) => ({
                lat: punto.latitude,
                lng: punto.longitude,
                direccion: punto.direccion,
              }))}
              rutaConductor={
                esEnCamino && rutaData?.route
                  ? rutaData.route.map((point) => ({
                      lat: point.y,
                      lng: point.x,
                    }))
                  : []
              }
              rutaGPS={
                esCompletado
                  ? asrutagps.map((punto) => ({
                      lat: punto.latitude,
                      lng: punto.longitude,
                    }))
                  : []
              }
              mostrarRutaCompleta={esCompletado}
              className="h-full w-full min-h-[40vh]"
            />
          )}
        </div>

        <aside className="w-full lg:w-80 xl:w-96 shrink-0 max-h-[45vh] lg:max-h-none overflow-y-auto rounded-xl border border-zinc-200/80 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/60 p-3 space-y-3">
          <div>
            <div className="flex items-center justify-between gap-2 mb-2">
              <span
                className="inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold"
                style={{
                  backgroundColor: otservicio.colorcelda,
                  color: otservicio.colortexto,
                }}
              >
                {otservicio.estado}
              </span>
              <span className="font-display text-xl font-bold text-amber-600 dark:text-amber-400">
                {formatearMoneda(otservicio.costototal)}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="flex items-center gap-1.5 text-zinc-600 dark:text-zinc-300">
                <Clock className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                <span className="truncate">
                  {otservicio.fecha} · {otservicio.hora}
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-zinc-600 dark:text-zinc-300">
                <User className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                <span className="truncate">{otservicio.tipo}</span>
              </div>
            </div>
            {esEnCamino && rutaData?.time != null && (
              <p className="mt-2 text-xs font-medium text-amber-600 dark:text-amber-400">
                Al primer punto: {Math.round(rutaData.time)} min ·{' '}
                {rutaData.distance?.toFixed(1)} km
              </p>
            )}
          </div>

          {!esPendiente && (
            <div className="pt-2 border-t border-zinc-200 dark:border-zinc-800">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500 mb-2">
                Conductor
              </p>
              <div className="flex items-center gap-3">
                <img
                  src={otservicio.foto}
                  alt="Conductor"
                  className="h-11 w-11 rounded-full object-cover ring-2 ring-amber-500/25 shrink-0"
                />
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-zinc-900 dark:text-white truncate">
                    {otservicio.nombres}
                  </p>
                  <p className="text-xs text-zinc-500 flex items-center gap-1 mt-0.5">
                    <Car className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate">
                      {otservicio.nplaca} · {otservicio.datmovil}
                    </span>
                  </p>
                  {esEnCamino && !esCompletado && otservicio.telefonoprincipal && (
                    <a
                      href={`tel:${otservicio.telefonoprincipal}`}
                      className="inline-flex items-center gap-1 text-xs font-medium text-amber-600 dark:text-amber-400 mt-1"
                    >
                      <Phone className="w-3.5 h-3.5" />
                      {otservicio.telefonoprincipal}
                    </a>
                  )}
                </div>
              </div>
            </div>
          )}

          <div className="pt-2 border-t border-zinc-200 dark:border-zinc-800">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500 mb-2">
              Recorrido
            </p>
            <div className="space-y-2.5">
              {puntosRecorrido.map((punto, index, arr) => (
                <div key={punto.item ?? index} className="flex items-start gap-2.5">
                  <div
                    className={`mt-0.5 inline-flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full ${
                      index === 0
                        ? 'bg-emerald-500/15 text-emerald-600'
                        : index === arr.length - 1
                          ? 'bg-red-500/15 text-red-500'
                          : 'bg-sky-500/15 text-sky-500'
                    }`}
                  >
                    <MapPin className="w-3.5 h-3.5" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[11px] font-semibold text-zinc-500">
                      {index === 0
                        ? 'Origen'
                        : index === arr.length - 1
                          ? 'Destino'
                          : `Punto ${index + 1}`}
                    </p>
                    <p className="text-sm text-zinc-900 dark:text-white leading-snug">
                      {punto.direccion}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </aside>
      </div>
    </>
  );

  if (isModal) {
    return (
      <div className="fixed inset-0 z-[70]">
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onVolver} />
        <div className="absolute inset-2 sm:inset-4 md:inset-6 flex flex-col rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 shadow-2xl overflow-hidden p-3">
          {content}
        </div>
      </div>
    );
  }

  return <AppPageShell scrollable={false}>{content}</AppPageShell>;
};
