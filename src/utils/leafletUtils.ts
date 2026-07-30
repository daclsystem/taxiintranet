import L from 'leaflet';

export const safeRemoveLayer = (layer: L.Layer | null | undefined): void => {
  try {
    if (layer && (layer as any)._map) layer.remove();
  } catch { /* layer already removed or map destroyed */ }
};

export const safeRemoveLayers = (layers: L.Layer[]): void => {
  layers.forEach(safeRemoveLayer);
};

export const isValidCoord = (lat: any, lng: any): boolean => {
  const latNum = Number(lat);
  const lngNum = Number(lng);
  if (!isFinite(latNum) || !isFinite(lngNum)) return false;
  if (Math.abs(latNum) < 0.001 && Math.abs(lngNum) < 0.001) return false;
  if (latNum < -90 || latNum > 90 || lngNum < -180 || lngNum > 180) return false;
  return true;
};
