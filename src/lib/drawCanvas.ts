import type { Annotation, ExportSize, MapSettings, MapSource } from "../types/map";
import { drawAnnotations } from "./annotations";
import { getExportSize, getGridMetrics, getMapDrawSize } from "./mapMath";

export interface RenderResult {
  canvas: HTMLCanvasElement;
  warnings: string[];
}

export interface DrawCompositionOptions {
  additionalAnnotations?: Annotation[];
  mapOffset?: { x: number; y: number };
}

function snapCoordinate(value: number, lineWidth: number, shouldSnap: boolean): number {
  if (!shouldSnap) {
    return value;
  }

  return lineWidth === 1 ? Math.round(value) + 0.5 : Math.round(value);
}

function normalizedLineWidth(value: number): number {
  return Math.max(1, Math.round(value));
}

export function getMapAppearanceFilter(settings: MapSettings): string {
  return [
    `grayscale(${settings.mapGrayscale ? 100 : 0}%)`,
    `brightness(${Math.max(0, settings.mapBrightness)}%)`,
    `contrast(${Math.max(0, settings.mapContrast)}%)`,
    `saturate(${Math.max(0, settings.mapSaturation)}%)`,
  ].join(" ");
}

export function getSampledAnnotationFilter(settings: MapSettings): string {
  return getMapAppearanceFilter(settings);
}

export function getMapOpacity(settings: MapSettings): number {
  return Math.max(0, Math.min(100, settings.mapOpacity)) / 100;
}

function fillCanvasBackground(context: CanvasRenderingContext2D, width: number, height: number): void {
  context.clearRect(0, 0, width, height);
  context.fillStyle = "#f3f4f6";
  context.fillRect(0, 0, width, height);
}

function drawMapLayer(
  context: CanvasRenderingContext2D,
  width: number,
  height: number,
  settings: MapSettings,
  source: MapSource,
  mapOffset: { x: number; y: number } = { x: 0, y: 0 },
  applyAppearance = true,
  applyOpacity = true,
): void {
  const { mapDrawSize } = getMapDrawSize({ width, height }, settings);

  context.save();
  context.globalAlpha = applyOpacity ? getMapOpacity(settings) : 1;
  context.filter = applyAppearance ? getMapAppearanceFilter(settings) : "none";
  context.translate(width / 2 + mapOffset.x, height / 2 + mapOffset.y);
  context.rotate((settings.rotation * Math.PI) / 180);
  context.drawImage(source.image, -mapDrawSize / 2, -mapDrawSize / 2, mapDrawSize, mapDrawSize);
  context.restore();
}

function drawGrid(
  context: CanvasRenderingContext2D,
  width: number,
  height: number,
  settings: MapSettings,
  source: MapSource,
): void {
  const { smallGridStepPx: smallStep, largeGridStepPx: largeStep } = getGridMetrics(settings, { width, height }, source);

  if ((!settings.showSmallGrid && !settings.showLargeGrid) || (smallStep < 2 && largeStep < 2)) {
    return;
  }

  const rotationRadians = (settings.gridRotation * Math.PI) / 180;
  const isRotated = Math.abs(settings.gridRotation % 360) > 0.001;
  const overscan = isRotated ? Math.ceil(Math.hypot(width, height)) : 0;
  const minX = -overscan;
  const maxX = width + overscan;
  const minY = -overscan;
  const maxY = height + overscan;
  const centerX = width / 2 + settings.gridOffsetX;
  const centerY = height / 2 + settings.gridOffsetY;

  const drawLines = (step: number, lineWidth: number, strokeStyle: string) => {
    if (step < 2) {
      return;
    }

    context.save();
    context.lineWidth = lineWidth;
    context.strokeStyle = strokeStyle;

    const startX = minX + ((((centerX - minX) % step) + step) % step);
    for (let x = startX; x <= maxX; x += step) {
      const snappedX = snapCoordinate(x, lineWidth, !isRotated);
      context.beginPath();
      context.moveTo(snappedX, minY);
      context.lineTo(snappedX, maxY);
      context.stroke();
    }

    const startY = minY + ((((centerY - minY) % step) + step) % step);
    for (let y = startY; y <= maxY; y += step) {
      const snappedY = snapCoordinate(y, lineWidth, !isRotated);
      context.beginPath();
      context.moveTo(minX, snappedY);
      context.lineTo(maxX, snappedY);
      context.stroke();
    }

    context.restore();
  };

  context.save();
  context.translate(width / 2, height / 2);
  context.rotate(rotationRadians);
  context.translate(-width / 2, -height / 2);

  if (settings.showSmallGrid) {
    drawLines(smallStep, normalizedLineWidth(settings.smallGridLineWidth), settings.smallGridColor);
  }
  if (settings.showLargeGrid) {
    drawLines(largeStep, normalizedLineWidth(settings.largeGridLineWidth), settings.largeGridColor);
  }

  context.restore();
}

export function drawComposition(
  context: CanvasRenderingContext2D,
  size: ExportSize,
  settings: MapSettings,
  source: MapSource,
  options: DrawCompositionOptions = {},
): string[] {
  const warnings = [...source.warnings];
  const { width, height } = size;
  const { mapDrawSize } = getMapDrawSize(size, settings);
  const annotations = settings.showDrawings ? [...settings.annotations, ...(options.additionalAnnotations ?? [])] : [];
  const belowGridAnnotations = annotations.filter((annotation) => annotation.layer === "belowGrid");
  const aboveGridAnnotations = annotations.filter((annotation) => annotation.layer === "aboveGrid");

  if (source.width < mapDrawSize || source.height < mapDrawSize) {
    warnings.push("Standard source image may be too low-resolution for this export size.");
  }

  fillCanvasBackground(context, width, height);
  drawMapLayer(context, width, height, settings, source, options.mapOffset);

  const annotationFilter = getSampledAnnotationFilter(settings);
  const annotationOpacity = getMapOpacity(settings);
  drawAnnotations(context, belowGridAnnotations, annotationFilter, annotationOpacity, size);

  if (settings.showSmallGrid || settings.showLargeGrid) {
    drawGrid(context, width, height, settings, source);
  }

  drawAnnotations(context, aboveGridAnnotations, annotationFilter, annotationOpacity, size);

  return [...new Set(warnings)];
}

export function renderMapOnlyCanvas(settings: MapSettings, source: MapSource, size: ExportSize, options: { applyAppearance?: boolean; applyOpacity?: boolean } = {}): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.width = size.width;
  canvas.height = size.height;
  const context = canvas.getContext("2d");
  if (!context) {
    throw new Error("Canvas is not available in this browser.");
  }

  fillCanvasBackground(context, size.width, size.height);
  drawMapLayer(context, size.width, size.height, settings, source, undefined, options.applyAppearance ?? true, options.applyOpacity ?? true);
  return canvas;
}

export function renderExportCanvas(settings: MapSettings, source: MapSource): RenderResult {
  const size = getExportSize(settings);
  const canvas = document.createElement("canvas");
  canvas.width = size.width;
  canvas.height = size.height;
  const context = canvas.getContext("2d");
  if (!context) {
    throw new Error("Canvas is not available in this browser.");
  }

  const warnings = drawComposition(context, size, settings, source);
  return { canvas, warnings };
}
