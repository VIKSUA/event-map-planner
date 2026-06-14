import type { ExportSize, MapRenderMetrics, MapSettings, MapSource, Orientation, PageFormat } from "../types/map";
import { DEFAULT_APPEARANCE_BY_MODE } from "./appearancePresets";
import {
  DEFAULT_APPEARANCE_MODE,
  DEFAULT_LARGE_GRID_COLOR,
  DEFAULT_LARGE_GRID_FEET,
  DEFAULT_LARGE_GRID_LINE_WIDTH,
  DEFAULT_LARGE_GRID_METERS,
  DEFAULT_GRID_OFFSET_X,
  DEFAULT_GRID_OFFSET_Y,
  DEFAULT_GRID_ROTATION,
  DEFAULT_LATITUDE,
  DEFAULT_LONGITUDE,
  DEFAULT_MAP_LABELS_ENABLED,
  DEFAULT_MAP_BRIGHTNESS,
  DEFAULT_MAP_CONTRAST,
  DEFAULT_MAP_GRAYSCALE,
  DEFAULT_MAP_OPACITY,
  DEFAULT_MAP_SATURATION,
  DEFAULT_PAINT_BRUSH_RADIUS,
  DEFAULT_PAINT_COLOR,
  DEFAULT_PAINT_COLOR_MODE,
  DEFAULT_PAINT_MODE,
  DEFAULT_PAINT_SAMPLE_SIZE,
  DEFAULT_DRAWING_LAYER,
  DEFAULT_RESOLUTION_MODE,
  DEFAULT_ROTATION,
  DEFAULT_SCALE,
  DEFAULT_SMALL_GRID_COLOR,
  DEFAULT_SMALL_GRID_FEET,
  DEFAULT_SMALL_GRID_LINE_WIDTH,
  DEFAULT_SMALL_GRID_METERS,
  DEFAULT_SHOW_GRID,
  DEFAULT_SHOW_DRAWINGS,
  DEFAULT_SHOW_LARGE_GRID,
  DEFAULT_SHOW_SMALL_GRID,
  DEFAULT_UNIT,
  DEFAULT_ZOOM,
  DEFAULT_ZOOM_SCALE_LOCKED,
} from "./mapConstants";

const EARTH_CIRCUMFERENCE_METERS_PER_PIXEL = 156543.03392;
const EARTH_RADIUS_METERS = 6378137;

export const DEFAULT_SETTINGS: MapSettings = {
  apiKey: "",
  latitude: DEFAULT_LATITUDE,
  longitude: DEFAULT_LONGITUDE,
  zoom: DEFAULT_ZOOM,
  mapLabelsEnabled: DEFAULT_MAP_LABELS_ENABLED,
  rotation: DEFAULT_ROTATION,
  scale: DEFAULT_SCALE,
  isZoomScaleLocked: DEFAULT_ZOOM_SCALE_LOCKED,
  unit: DEFAULT_UNIT,
  smallGridMeters: DEFAULT_SMALL_GRID_METERS,
  largeGridMeters: DEFAULT_LARGE_GRID_METERS,
  smallGridFeet: DEFAULT_SMALL_GRID_FEET,
  largeGridFeet: DEFAULT_LARGE_GRID_FEET,
  gridOffsetX: DEFAULT_GRID_OFFSET_X,
  gridOffsetY: DEFAULT_GRID_OFFSET_Y,
  gridRotation: DEFAULT_GRID_ROTATION,
  showSmallGrid: DEFAULT_SHOW_SMALL_GRID,
  showLargeGrid: DEFAULT_SHOW_LARGE_GRID,
  smallGridColor: DEFAULT_SMALL_GRID_COLOR,
  largeGridColor: DEFAULT_LARGE_GRID_COLOR,
  smallGridLineWidth: DEFAULT_SMALL_GRID_LINE_WIDTH,
  largeGridLineWidth: DEFAULT_LARGE_GRID_LINE_WIDTH,
  activeAppearanceMode: DEFAULT_APPEARANCE_MODE,
  appearanceByMode: DEFAULT_APPEARANCE_BY_MODE,
  mapGrayscale: DEFAULT_MAP_GRAYSCALE,
  mapBrightness: DEFAULT_MAP_BRIGHTNESS,
  mapContrast: DEFAULT_MAP_CONTRAST,
  mapSaturation: DEFAULT_MAP_SATURATION,
  format: "letter",
  orientation: "portrait",
  exportWidth: 2000,
  mapOpacity: DEFAULT_MAP_OPACITY,
  showGrid: DEFAULT_SHOW_GRID,
  resolutionMode: DEFAULT_RESOLUTION_MODE,
  paintMode: DEFAULT_PAINT_MODE,
  paintColor: DEFAULT_PAINT_COLOR,
  paintColorMode: DEFAULT_PAINT_COLOR_MODE,
  paintBrushRadius: DEFAULT_PAINT_BRUSH_RADIUS,
  paintSampleSize: DEFAULT_PAINT_SAMPLE_SIZE,
  showDrawings: DEFAULT_SHOW_DRAWINGS,
  drawingLayer: DEFAULT_DRAWING_LAYER,
  annotations: [],
  paintStrokes: [],
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
  const screenDelta =
    direction === "left"
      ? { x: -meters, y: 0 }
      : direction === "right"
        ? { x: meters, y: 0 }
        : direction === "up"
          ? { x: 0, y: -meters }
          : { x: 0, y: meters };

  return moveCenterByScreenMeters(latitude, longitude, screenDelta.x, screenDelta.y, rotationDegrees);
}

export function moveCenterByScreenMeters(
  latitude: number,
  longitude: number,
  screenDxMeters: number,
  screenDyMeters: number,
  rotationDegrees: number,
): { latitude: number; longitude: number } {
  const rotation = (rotationDegrees * Math.PI) / 180;

  // The button describes desired image movement on screen; map center moves opposite in map axes.
  const unrotatedImageX = screenDxMeters * Math.cos(rotation) + screenDyMeters * Math.sin(rotation);
  const unrotatedImageY = -screenDxMeters * Math.sin(rotation) + screenDyMeters * Math.cos(rotation);
  const eastMeters = -unrotatedImageX;
  const northMeters = unrotatedImageY;

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
