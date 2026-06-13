export type Unit = "meters" | "feet";
export type PageFormat = "square" | "letter" | "a4";
export type Orientation = "portrait" | "landscape";
export type ResolutionMode = "standard" | "high" | "ultra";
export type AppearanceMode = "screen" | "printBw";
export type PaintMode = "off" | "pick" | "brush";

export interface PaintPoint {
  x: number;
  y: number;
}

export interface PaintStroke {
  id: string;
  color: string;
  radius: number;
  points: PaintPoint[];
}

export interface AppearanceSettings {
  mapGrayscale: boolean;
  mapBrightness: number;
  mapContrast: number;
  mapSaturation: number;
  mapOpacity: number;
  smallGridColor: string;
  largeGridColor: string;
  smallGridLineWidth: number;
  largeGridLineWidth: number;
}

export interface MapSettings {
  apiKey: string;
  latitude: number;
  longitude: number;
  zoom: number;
  rotation: number;
  scale: number;
  isZoomScaleLocked: boolean;
  unit: Unit;
  smallGridMeters: number;
  largeGridMeters: number;
  smallGridFeet: number;
  largeGridFeet: number;
  gridOffsetX: number;
  gridOffsetY: number;
  smallGridColor: string;
  largeGridColor: string;
  smallGridLineWidth: number;
  largeGridLineWidth: number;
  activeAppearanceMode: AppearanceMode;
  appearanceByMode: Record<AppearanceMode, AppearanceSettings>;
  mapGrayscale: boolean;
  mapBrightness: number;
  mapContrast: number;
  mapSaturation: number;
  format: PageFormat;
  orientation: Orientation;
  exportWidth: number;
  mapOpacity: number;
  showGrid: boolean;
  resolutionMode: ResolutionMode;
  paintMode: PaintMode;
  paintColor: string;
  paintBrushRadius: number;
  paintSampleSize: number;
  paintStrokes: PaintStroke[];
}

export interface ExportSize {
  width: number;
  height: number;
}

export interface MapSource {
  image: CanvasImageSource;
  width: number;
  height: number;
  googleStaticScale: number;
  requestedStaticLogicalSize: number;
  tileCount: 1 | 2 | 3;
  warnings: string[];
}

export interface MapRenderMetrics {
  webMercatorMetersPerPixel: number;
  googleStaticScale: number;
  sourceImageWidth: number;
  sourceImageHeight: number;
  requestedStaticLogicalSize: number;
  tileCount: number;
  baseMapDrawSize: number;
  mapDrawSize: number;
  userScaleFactor: number;
  sourceToCanvasScale: number;
  totalMapScale: number;
  effectiveMetersPerCanvasPixel: number;
  smallGridStepPx: number;
  largeGridStepPx: number;
}

export interface PanelPosition {
  x: number;
  y: number;
}
