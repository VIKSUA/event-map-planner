export type Unit = "meters" | "feet";
export type PageFormat = "square" | "letter" | "a4";
export type Orientation = "portrait" | "landscape";
export type ResolutionMode = "standard" | "high" | "ultra";

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
  format: PageFormat;
  orientation: Orientation;
  exportWidth: number;
  mapOpacity: number;
  showGrid: boolean;
  resolutionMode: ResolutionMode;
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
