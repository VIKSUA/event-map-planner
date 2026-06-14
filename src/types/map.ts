export type Unit = "meters" | "feet";
export type PageFormat = "square" | "letter" | "a4";
export type Orientation = "portrait" | "landscape";
export type ResolutionMode = "standard" | "high" | "ultra";
export type AppearanceMode = "screen" | "printBw";
export type PaintMode = "pan" | "pick" | "brush" | "line" | "rect" | "text";
export type AnnotationLayer = "belowGrid" | "aboveGrid";
export type DrawingLayer = AnnotationLayer;
export type AnnotationColorMode = "sampled" | "manual";

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

export interface BrushAnnotation {
  id: string;
  type: "brush";
  color: string;
  baseColor: string;
  colorMode: AnnotationColorMode;
  followMapAppearance: boolean;
  layer: AnnotationLayer;
  size: number;
  points: PaintPoint[];
}

export interface LineAnnotation {
  id: string;
  type: "line";
  color: string;
  baseColor: string;
  colorMode: AnnotationColorMode;
  followMapAppearance: boolean;
  layer: AnnotationLayer;
  width: number;
  start: PaintPoint;
  end: PaintPoint;
}

export interface RectAnnotation {
  id: string;
  type: "rect";
  color: string;
  baseColor: string;
  colorMode: AnnotationColorMode;
  followMapAppearance: boolean;
  layer: AnnotationLayer;
  width: number;
  x: number;
  y: number;
  widthPx: number;
  heightPx: number;
}

export interface TextAnnotation {
  id: string;
  type: "text";
  color: string;
  baseColor: string;
  colorMode: "manual";
  followMapAppearance: false;
  layer: AnnotationLayer;
  fontSize: number;
  x: number;
  y: number;
  text: string;
}

export type Annotation = BrushAnnotation | LineAnnotation | RectAnnotation | TextAnnotation;

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
  mapLabelsEnabled: boolean;
  demoOffsetX: number;
  demoOffsetY: number;
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
  gridRotation: number;
  showSmallGrid: boolean;
  showLargeGrid: boolean;
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
  paintColorMode: AnnotationColorMode;
  paintBrushRadius: number;
  paintSampleSize: number;
  showDrawings: boolean;
  drawingLayer: DrawingLayer;
  annotations: Annotation[];
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
