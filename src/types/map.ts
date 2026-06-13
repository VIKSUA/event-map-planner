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
  unit: Unit;
  smallGridMeters: number;
  largeGridMeters: number;
  smallGridFeet: number;
  largeGridFeet: number;
  gridOffsetX: number;
  gridOffsetY: number;
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
  warnings: string[];
}

export interface PanelPosition {
  x: number;
  y: number;
}
