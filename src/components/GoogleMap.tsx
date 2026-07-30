import React, { useEffect, useRef, useCallback } from 'react';
import { MapContainer, TileLayer, useMap } from 'react-leaflet';
import L from 'leaflet';
import { useTheme } from '../contexts/ThemeContext';
import { safeRemoveLayer, isValidCoord } from '../utils/leafletUtils';

import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({ iconRetinaUrl: markerIcon2x, iconUrl: markerIcon, shadowUrl: markerShadow });

const DARK_TILE = 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png';
const LIGHT_TILE = 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png';

// API OSRM para calcular rutas (gratuita)
const OSRM_API = 'https://router.project-osrm.org/route/v1/driving';

interface GoogleMapProps {
  origen?: { lat: number; lng: number; direccion: string };
  destino?: { lat: number; lng: number; direccion: string };
  conductor?: { lat: number; lng: number; nombre: string; angulo?: number };
  puntosIntermedios?: Array<{ lat: number; lng: number; direccion: string }>;
  todosLosPuntos?: Array<{ lat: number; lng: number; direccion: string }>;
  rutaConductor?: Array<{ lat: number; lng: number }>;
  rutaGPS?: Array<{ lat: number; lng: number }>;
  /** Polyline de la API geo (prioridad sobre OSRM) */
  rutaPolyline?: Array<{ lat: number; lng: number }>;
  mostrarRutaCompleta?: boolean;
  onLocationSelect?: (lat: number, lng: number, address: string) => void;
  onMarkerDrag?: (type: 'origen' | 'destino', lat: number, lng: number, address: string) => void;
  onRouteCalculated?: (distance: string, duration: string) => void;
  useCustomPins?: boolean;
  className?: string;
}

// Decodificar polyline de OSRM
function decodePolyline(encoded: string): [number, number][] {
  const points: [number, number][] = [];
  let index = 0, lat = 0, lng = 0;
  while (index < encoded.length) {
    let b, shift = 0, result = 0;
    do { b = encoded.charCodeAt(index++) - 63; result |= (b & 0x1f) << shift; shift += 5; } while (b >= 0x20);
    lat += (result & 1) ? ~(result >> 1) : (result >> 1);
    shift = 0; result = 0;
    do { b = encoded.charCodeAt(index++) - 63; result |= (b & 0x1f) << shift; shift += 5; } while (b >= 0x20);
    lng += (result & 1) ? ~(result >> 1) : (result >> 1);
    points.push([lat / 1e5, lng / 1e5]);
  }
  return points;
}

function MapController({
  isDark,
  origen,
  destino,
  conductor,
  todosLosPuntos,
  puntosIntermedios,
  rutaGPS,
  rutaPolyline,
  rutaConductor,
  mostrarRutaCompleta,
  onLocationSelect,
  onMarkerDrag,
  onRouteCalculated,
  markersRef,
  polylinesRef
}: {
  isDark: boolean;
  origen?: { lat: number; lng: number; direccion: string };
  destino?: { lat: number; lng: number; direccion: string };
  conductor?: { lat: number; lng: number; nombre: string; angulo?: number };
  todosLosPuntos: Array<{ lat: number; lng: number; direccion: string }>;
  puntosIntermedios: Array<{ lat: number; lng: number; direccion: string }>;
  rutaGPS: Array<{ lat: number; lng: number }>;
  rutaPolyline: Array<{ lat: number; lng: number }>;
  rutaConductor: Array<{ lat: number; lng: number }>;
  mostrarRutaCompleta: boolean;
  onLocationSelect?: (lat: number, lng: number, address: string) => void;
  onMarkerDrag?: (type: 'origen' | 'destino', lat: number, lng: number, address: string) => void;
  onRouteCalculated?: (distance: string, duration: string) => void;
  markersRef: React.MutableRefObject<L.Marker[]>;
  polylinesRef: React.MutableRefObject<L.Polyline[]>;
}) {
  const map = useMap();
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const fitDoneRef = useRef(false);

  // Cambiar tiles según tema
  useEffect(() => {
    if (tileLayerRef.current) {
      tileLayerRef.current.setUrl(isDark ? DARK_TILE : LIGHT_TILE);
    }
  }, [isDark]);

  // Click en mapa
  useEffect(() => {
    if (!onLocationSelect) return;
    const handleClick = (e: L.LeafletMouseEvent) => {
      onLocationSelect(e.latlng.lat, e.latlng.lng, `${e.latlng.lat.toFixed(6)}, ${e.latlng.lng.toFixed(6)}`);
    };
    map.on('click', handleClick);
    return () => { map.off('click', handleClick); };
  }, [map, onLocationSelect]);

  // Calcular ruta con OSRM
  const calculateRoute = useCallback(async (points: Array<{ lat: number; lng: number }>) => {
    if (points.length < 2) return null;
    
    try {
      const coords = points.map(p => `${p.lng},${p.lat}`).join(';');
      const url = `${OSRM_API}/${coords}?overview=full&geometries=polyline`;
      
      const response = await fetch(url);
      const data = await response.json();
      
      if (data.code === 'Ok' && data.routes && data.routes[0]) {
        const route = data.routes[0];
        const distanceKm = (route.distance / 1000).toFixed(1);
        const durationMin = Math.ceil(route.duration / 60);
        const geometry = decodePolyline(route.geometry);
        
        if (onRouteCalculated) {
          onRouteCalculated(`${distanceKm} km`, `${durationMin} min`);
        }
        
        return geometry;
      }
    } catch (error) {
      console.error('Error calculando ruta:', error);
    }
    return null;
  }, [onRouteCalculated]);

  // Crear marcadores y rutas
  useEffect(() => {
    markersRef.current.forEach(safeRemoveLayer);
    markersRef.current = [];
    polylinesRef.current.forEach(safeRemoveLayer);
    polylinesRef.current = [];

    const bounds = L.latLngBounds([]);

    const createSvgIcon = (color: string, label?: string, size: number = 40) => {
      const svg = label 
        ? `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
            <circle cx="${size/2}" cy="${size/2}" r="${size/2 - 4}" fill="${color}" stroke="white" stroke-width="4"/>
            <text x="${size/2}" y="${size/2 + 5}" text-anchor="middle" fill="white" font-size="14" font-weight="bold">${label}</text>
          </svg>`
        : `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
            <circle cx="${size/2}" cy="${size/2}" r="${size/2 - 4}" fill="${color}" stroke="white" stroke-width="4"/>
            <circle cx="${size/2}" cy="${size/2}" r="${size/4}" fill="white"/>
          </svg>`;
      
      return L.divIcon({
        html: `<img src="data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}" style="width:${size}px;height:${size}px;" />`,
        iconSize: [size, size],
        iconAnchor: [size/2, size/2],
        className: ''
      });
    };

    const routePoints: Array<{ lat: number; lng: number }> = [];

    // Si hay todosLosPuntos, usar esos
    if (todosLosPuntos.length > 0) {
      todosLosPuntos.forEach((punto, index) => {
        if (!isValidCoord(punto.lat, punto.lng)) return;
        
        const isOrigen = index === 0;
        const isDestino = index === todosLosPuntos.length - 1;
        
        let icon: L.DivIcon;
        let popupText: string;
        
        if (isOrigen) {
          icon = createSvgIcon('#10b981');
          popupText = `<b style="color:#10b981">Origen</b><br/>${punto.direccion}`;
        } else if (isDestino) {
          icon = createSvgIcon('#ef4444');
          popupText = `<b style="color:#ef4444">Destino</b><br/>${punto.direccion}`;
        } else {
          icon = createSvgIcon('#f59e0b', String(index), 36);
          popupText = `<b style="color:#f59e0b">Punto ${index}</b><br/>${punto.direccion}`;
        }

        const marker = L.marker([punto.lat, punto.lng], { 
          icon,
          draggable: onMarkerDrag && (isOrigen || isDestino)
        }).addTo(map);
        
        marker.bindPopup(popupText);

        if (onMarkerDrag && (isOrigen || isDestino)) {
          marker.on('dragend', () => {
            const pos = marker.getLatLng();
            onMarkerDrag(isOrigen ? 'origen' : 'destino', pos.lat, pos.lng, `${pos.lat.toFixed(6)}, ${pos.lng.toFixed(6)}`);
          });
        }

        markersRef.current.push(marker);
        bounds.extend([punto.lat, punto.lng]);
        routePoints.push({ lat: punto.lat, lng: punto.lng });
      });
    } else {
      // Usar origen y destino individuales
      if (origen && isValidCoord(origen.lat, origen.lng)) {
        const icon = createSvgIcon('#10b981');
        const marker = L.marker([origen.lat, origen.lng], { icon, draggable: !!onMarkerDrag }).addTo(map);
        marker.bindPopup(`<b style="color:#10b981">Origen</b><br/>${origen.direccion}`);
        
        if (onMarkerDrag) {
          marker.on('dragend', () => {
            const pos = marker.getLatLng();
            onMarkerDrag('origen', pos.lat, pos.lng, `${pos.lat.toFixed(6)}, ${pos.lng.toFixed(6)}`);
          });
        }
        
        markersRef.current.push(marker);
        bounds.extend([origen.lat, origen.lng]);
        routePoints.push({ lat: origen.lat, lng: origen.lng });
      }

      // Puntos intermedios
      puntosIntermedios.forEach((punto, index) => {
        if (!isValidCoord(punto.lat, punto.lng)) return;
        const icon = createSvgIcon('#f59e0b', String(index + 1), 36);
        const marker = L.marker([punto.lat, punto.lng], { icon }).addTo(map);
        marker.bindPopup(`<b style="color:#f59e0b">Punto ${index + 1}</b><br/>${punto.direccion}`);
        markersRef.current.push(marker);
        bounds.extend([punto.lat, punto.lng]);
        routePoints.push({ lat: punto.lat, lng: punto.lng });
      });

      if (destino && isValidCoord(destino.lat, destino.lng)) {
        const icon = createSvgIcon('#ef4444');
        const marker = L.marker([destino.lat, destino.lng], { icon, draggable: !!onMarkerDrag }).addTo(map);
        marker.bindPopup(`<b style="color:#ef4444">Destino</b><br/>${destino.direccion}`);
        
        if (onMarkerDrag) {
          marker.on('dragend', () => {
            const pos = marker.getLatLng();
            onMarkerDrag('destino', pos.lat, pos.lng, `${pos.lat.toFixed(6)}, ${pos.lng.toFixed(6)}`);
          });
        }
        
        markersRef.current.push(marker);
        bounds.extend([destino.lat, destino.lng]);
        routePoints.push({ lat: destino.lat, lng: destino.lng });
      }
    }

    // Conductor
    if (conductor && isValidCoord(conductor.lat, conductor.lng)) {
      const conductorSvg = `<svg width="44" height="44" viewBox="0 0 44 44" xmlns="http://www.w3.org/2000/svg">
        <circle cx="22" cy="22" r="18" fill="#3b82f6" stroke="white" stroke-width="4"/>
        <path d="M22 12 L28 28 L22 24 L16 28 Z" fill="white"/>
      </svg>`;
      const conductorIcon = L.divIcon({
        html: `<img src="data:image/svg+xml;charset=UTF-8,${encodeURIComponent(conductorSvg)}" style="width:44px;height:44px;" />`,
        iconSize: [44, 44],
        iconAnchor: [22, 22],
        className: ''
      });
      
      const marker = L.marker([conductor.lat, conductor.lng], { icon: conductorIcon }).addTo(map);
      marker.bindPopup(`<b style="color:#3b82f6">Conductor</b><br/>${conductor.nombre}`);
      markersRef.current.push(marker);
      bounds.extend([conductor.lat, conductor.lng]);
    }

    // Si hay GPS real (finalizado), solo esa línea — evita doble ruta planificada + GPS
    const gpsCoords: [number, number][] = rutaGPS
      .filter((p) => isValidCoord(p.lat, p.lng))
      .map((p) => [p.lat, p.lng]);

    if (gpsCoords.length > 1) {
      const polyline = L.polyline(gpsCoords, {
        color: '#10b981',
        weight: 5,
        opacity: 0.9,
      }).addTo(map);
      polylinesRef.current.push(polyline);
      gpsCoords.forEach((coord) => bounds.extend(coord));
    } else {
      // En curso / pendiente: una sola ruta (conductor → punto, geo API o OSRM)
      const conductorCoords: [number, number][] = rutaConductor
        .filter((p) => isValidCoord(p.lat, p.lng))
        .map((p) => [p.lat, p.lng]);

      const geoCoords: [number, number][] = rutaPolyline
        .filter((p) => isValidCoord(p.lat, p.lng))
        .map((p) => [p.lat, p.lng]);

      if (conductorCoords.length > 1) {
        const polyline = L.polyline(conductorCoords, {
          color: '#f59e0b',
          weight: 5,
          opacity: 0.9,
        }).addTo(map);
        polylinesRef.current.push(polyline);
        conductorCoords.forEach((coord) => bounds.extend(coord));
      } else if (geoCoords.length > 1) {
        const polyline = L.polyline(geoCoords, {
          color: '#f59e0b',
          weight: 5,
          opacity: 0.9,
        }).addTo(map);
        polylinesRef.current.push(polyline);
        geoCoords.forEach((coord) => bounds.extend(coord));
      } else if (routePoints.length >= 2) {
        calculateRoute(routePoints).then((geometry) => {
          if (geometry && geometry.length > 0) {
            const polyline = L.polyline(geometry, {
              color: '#f59e0b',
              weight: 5,
              opacity: 0.9,
            }).addTo(map);
            polylinesRef.current.push(polyline);
          }
        });
      }
    }

    // Ajustar vista cuando hay origen/destino o cambia la ruta
    if (bounds.isValid()) {
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 16 });
      fitDoneRef.current = true;
    }
  }, [
    map,
    origen,
    destino,
    conductor,
    todosLosPuntos,
    puntosIntermedios,
    rutaGPS,
    rutaPolyline,
    rutaConductor,
    mostrarRutaCompleta,
    onMarkerDrag,
    calculateRoute,
    markersRef,
    polylinesRef,
  ]);

  return (
    <TileLayer
      ref={(ref) => { tileLayerRef.current = ref; }}
      url={isDark ? DARK_TILE : LIGHT_TILE}
      attribution='&copy; <a href="https://carto.com/">CARTO</a>'
    />
  );
}

export const GoogleMap: React.FC<GoogleMapProps> = ({
  origen,
  destino,
  conductor,
  puntosIntermedios = [],
  todosLosPuntos = [],
  rutaConductor = [],
  rutaGPS = [],
  rutaPolyline = [],
  mostrarRutaCompleta = false,
  onLocationSelect,
  onMarkerDrag,
  onRouteCalculated,
  useCustomPins = false,
  className = ''
}) => {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';
  const markersRef = useRef<L.Marker[]>([]);
  const polylinesRef = useRef<L.Polyline[]>([]);

  const defaultCenter: [number, number] = [-12.0464, -77.0428];

  return (
    <div className={`relative overflow-hidden ${className}`} style={{ width: '100%', height: '100%' }}>
      <MapContainer
        center={defaultCenter}
        zoom={13}
        style={{ width: '100%', height: '100%' }}
        zoomControl={true}
      >
        <MapController
          isDark={isDark}
          origen={origen}
          destino={destino}
          conductor={conductor}
          todosLosPuntos={todosLosPuntos}
          puntosIntermedios={puntosIntermedios}
          rutaGPS={rutaGPS}
          rutaPolyline={rutaPolyline}
          rutaConductor={rutaConductor}
          mostrarRutaCompleta={mostrarRutaCompleta}
          onLocationSelect={onLocationSelect}
          onMarkerDrag={onMarkerDrag}
          onRouteCalculated={onRouteCalculated}
          markersRef={markersRef}
          polylinesRef={polylinesRef}
        />
      </MapContainer>
    </div>
  );
};
