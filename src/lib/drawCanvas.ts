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

function snapCoordinate(value: number, lineWidth: number): number {
  return lineWidth === 1 ? Math.round(value) + 0.5 : Math.round(value);
}

function normalizedLineWidth(value: number): number {
  return Math.max(1, Math.round(value));
}

function mapFilter(settings: MapSettings): string {
  return [
    `grayscale(${settings.mapGrayscale ? 100 : 0}%)`,
    `brightness(${Math.max(0, settings.mapBrightness)}%)`,
    `contrast(${Math.max(0, settings.mapContrast)}%)`,
    `saturate(${Math.max(0, settings.mapSaturation)}%)`,
  ].join(" ");
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
): void {
  const { mapDrawSize } = getMapDrawSize({ width, height }, settings);

  context.save();
  context.globalAlpha = Math.max(0, Math.min(100, settings.mapOpacity)) / 100;
  context.filter = mapFilter(settings);
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

  if (smallStep < 2 || largeStep < 2) {
    return;
  }

  const centerX = width / 2 + settings.gridOffsetX;
  const centerY = height / 2 + settings.gridOffsetY;

  const drawLines = (step: number, lineWidth: number, strokeStyle: string) => {
    context.save();
    context.lineWidth = lineWidth;
    context.strokeStyle = strokeStyle;

    const startX = ((centerX % step) + step) % step;
    for (let x = startX; x <= width; x += step) {
      const snappedX = snapCoordinate(x, lineWidth);
      context.beginPath();
      context.moveTo(snappedX, 0);
      context.lineTo(snappedX, height);
      context.stroke();
    }

    const startY = ((centerY % step) + step) % step;
    for (let y = startY; y <= height; y += step) {
      const snappedY = snapCoordinate(y, lineWidth);
      context.beginPath();
      context.moveTo(0, snappedY);
      context.lineTo(width, snappedY);
      context.stroke();
    }

    context.restore();
  };

  drawLines(smallStep, normalizedLineWidth(settings.smallGridLineWidth), settings.smallGridColor);
  drawLines(largeStep, normalizedLineWidth(settings.largeGridLineWidth), settings.largeGridColor);
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

  drawAnnotations(context, belowGridAnnotations);

  if (settings.showGrid) {
    drawGrid(context, width, height, settings, source);
  }

  drawAnnotations(context, aboveGridAnnotations);

  return [...new Set(warnings)];
}

export function renderMapOnlyCanvas(settings: MapSettings, source: MapSource, size: ExportSize): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.width = size.width;
  canvas.height = size.height;
  const context = canvas.getContext("2d");
  if (!context) {
    throw new Error("Canvas is not available in this browser.");
  }

  fillCanvasBackground(context, size.width, size.height);
  drawMapLayer(context, size.width, size.height, settings, source);
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
