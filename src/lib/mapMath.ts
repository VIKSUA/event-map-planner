import type { ExportSize, MapRenderMetrics, MapSettings, MapSource, Orientation, PageFormat } from "../types/map";

const EARTH_CIRCUMFERENCE_METERS_PER_PIXEL = 156543.03392;
const EARTH_RADIUS_METERS = 6378137;

export const DEFAULT_SETTINGS: MapSettings = {
  apiKey: "",
  latitude: 43.655463,
  longitude: -79.587222,
  zoom: 18,
  rotation: 44,
  scale: 165,
  unit: "meters",
  smallGridMeters: 1,
  largeGridMeters: 10,
  smallGridFeet: 12,
  largeGridFeet: 60,
  gridOffsetX: 0,
  gridOffsetY: 0,
  format: "letter",
  orientation: "portrait",
  exportWidth: 2000,
  mapOpacity: 100,
  showGrid: true,
  resolutionMode: "standard",
};

export function feetToMeters(feet: number): number {
  return feet * 0.3048;
}

export function metersPerPixel(latitude: number, zoom: number): number {
  const latitudeRadians = (latitude * Math.PI) / 180;
  return (EARTH_CIRCUMFERENCE_METERS_PER_PIXEL * Math.cos(latitudeRadians)) / 2 ** zoom;
}

export function getGridMeters(settings: MapSettings): { small: number; large: number } {
  if (settings.unit === "feet") {
    return {
      small: feetToMeters(settings.smallGridFeet),
      large: feetToMeters(settings.largeGridFeet),
    };
  }

  return {
    small: settings.smallGridMeters,
    large: settings.largeGridMeters,
  };
}

export function getMapDrawSize(size: ExportSize, settings: MapSettings): { baseMapDrawSize: number; mapDrawSize: number; userScaleFactor: number } {
  const baseMapDrawSize = Math.sqrt(size.width ** 2 + size.height ** 2);
  const userScaleFactor = Math.max(settings.scale / 100, 0.01);
  return {
    baseMapDrawSize,
    mapDrawSize: baseMapDrawSize * userScaleFactor,
    userScaleFactor,
  };
}

export function getGridMetrics(settings: MapSettings, size: ExportSize, source: MapSource): MapRenderMetrics {
  const gridMeters = getGridMeters(settings);
  const webMercatorMetersPerPixel = metersPerPixel(settings.latitude, settings.zoom);
  const { baseMapDrawSize, mapDrawSize, userScaleFactor } = getMapDrawSize(size, settings);
  const sourceMetersPerImagePixel = webMercatorMetersPerPixel / source.googleStaticScale;
  const sourceToCanvasScale = mapDrawSize / source.width;
  const effectiveMetersPerCanvasPixel = sourceMetersPerImagePixel / sourceToCanvasScale;

  return {
    webMercatorMetersPerPixel,
    googleStaticScale: source.googleStaticScale,
    sourceImageWidth: source.width,
    sourceImageHeight: source.height,
    requestedStaticLogicalSize: source.requestedStaticLogicalSize,
    tileCount: source.tileCount,
    baseMapDrawSize,
    mapDrawSize,
    userScaleFactor,
    sourceToCanvasScale,
    totalMapScale: sourceToCanvasScale,
    effectiveMetersPerCanvasPixel,
    smallGridStepPx: gridMeters.small / effectiveMetersPerCanvasPixel,
    largeGridStepPx: gridMeters.large / effectiveMetersPerCanvasPixel,
  };
}

export function formatRatio(format: PageFormat, orientation: Orientation): number {
  if (format === "square") {
    return 1;
  }

  if (format === "letter") {
    return orientation === "portrait" ? 8.5 / 11 : 11 / 8.5;
  }

  return orientation === "portrait" ? 210 / 297 : 297 / 210;
}

export function getExportSize(settings: MapSettings): ExportSize {
  const width = Math.max(64, Math.round(settings.exportWidth));
  const height = Math.round(width / formatRatio(settings.format, settings.orientation));
  return { width, height };
}

export function getPrintSize(format: PageFormat, orientation: Orientation): ExportSize | null {
  if (format === "square") {
    return null;
  }

  if (format === "letter") {
    return orientation === "portrait" ? { width: 2550, height: 3300 } : { width: 3300, height: 2550 };
  }

  return orientation === "portrait" ? { width: 2480, height: 3508 } : { width: 3508, height: 2480 };
}

export function moveByMeters(
  latitude: number,
  longitude: number,
  direction: "left" | "right" | "up" | "down",
  meters: number,
  rotationDegrees: number,
): { latitude: number; longitude: number } {
  const rotation = (rotationDegrees * Math.PI) / 180;
  let eastMeters = 0;
  let northMeters = 0;

  if (direction === "left") {
    eastMeters = -Math.cos(rotation) * meters;
    northMeters = Math.sin(rotation) * meters;
  } else if (direction === "right") {
    eastMeters = Math.cos(rotation) * meters;
    northMeters = -Math.sin(rotation) * meters;
  } else if (direction === "up") {
    eastMeters = Math.sin(rotation) * meters;
    northMeters = Math.cos(rotation) * meters;
  } else {
    eastMeters = -Math.sin(rotation) * meters;
    northMeters = -Math.cos(rotation) * meters;
  }

  const latitudeRadians = (latitude * Math.PI) / 180;
  const nextLatitude = latitude + (northMeters / EARTH_RADIUS_METERS) * (180 / Math.PI);
  const nextLongitude =
    longitude + (eastMeters / (EARTH_RADIUS_METERS * Math.cos(latitudeRadians))) * (180 / Math.PI);

  return { latitude: nextLatitude, longitude: nextLongitude };
}

export function latLngToWorldPixel(latitude: number, longitude: number, zoom: number): { x: number; y: number } {
  const sinLatitude = Math.sin((latitude * Math.PI) / 180);
  const worldSize = 256 * 2 ** zoom;

  return {
    x: ((longitude + 180) / 360) * worldSize,
    y: (0.5 - Math.log((1 + sinLatitude) / (1 - sinLatitude)) / (4 * Math.PI)) * worldSize,
  };
}

export function worldPixelToLatLng(x: number, y: number, zoom: number): { latitude: number; longitude: number } {
  const worldSize = 256 * 2 ** zoom;
  const longitude = (x / worldSize) * 360 - 180;
  const n = Math.PI - (2 * Math.PI * y) / worldSize;
  const latitude = (180 / Math.PI) * Math.atan(0.5 * (Math.exp(n) - Math.exp(-n)));

  return { latitude, longitude };
}
