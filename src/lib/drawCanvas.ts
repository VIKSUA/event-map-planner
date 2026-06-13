import type { ExportSize, MapSettings, MapSource } from "../types/map";
import { getExportSize, getGridMetrics, getMapDrawSize } from "./mapMath";

export interface RenderResult {
  canvas: HTMLCanvasElement;
  warnings: string[];
}

function snapCoordinate(value: number, lineWidth: number): number {
  return lineWidth === 1 ? Math.round(value) + 0.5 : Math.round(value);
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

  drawLines(smallStep, 1, "rgba(8, 16, 32, 0.22)");
  drawLines(largeStep, width > 2400 ? 2 : 1, "rgba(0, 80, 170, 0.72)");
}

export function drawComposition(
  context: CanvasRenderingContext2D,
  size: ExportSize,
  settings: MapSettings,
  source: MapSource,
): string[] {
  const warnings = [...source.warnings];
  const { width, height } = size;
  const { mapDrawSize } = getMapDrawSize(size, settings);

  if (source.width < mapDrawSize || source.height < mapDrawSize) {
    warnings.push("Source image may be too low-resolution for this export size. Use High/Ultra mode.");
  }

  context.clearRect(0, 0, width, height);
  context.fillStyle = "#f3f4f6";
  context.fillRect(0, 0, width, height);

  context.save();
  context.globalAlpha = Math.max(0, Math.min(100, settings.mapOpacity)) / 100;
  context.translate(width / 2, height / 2);
  context.rotate((settings.rotation * Math.PI) / 180);
  context.drawImage(source.image, -mapDrawSize / 2, -mapDrawSize / 2, mapDrawSize, mapDrawSize);
  context.restore();

  if (settings.showGrid) {
    drawGrid(context, width, height, settings, source);
  }

  return [...new Set(warnings)];
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
