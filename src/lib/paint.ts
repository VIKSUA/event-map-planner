import type { PaintPoint, PaintStroke } from "../types/map";

export function createPaintStroke(color: string, radius: number, point: PaintPoint): PaintStroke {
  const id =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(16).slice(2)}`;

  return {
    id,
    color,
    radius,
    points: [point],
  };
}

export function shouldAddPaintPoint(stroke: PaintStroke, point: PaintPoint): boolean {
  const lastPoint = stroke.points[stroke.points.length - 1];
  if (!lastPoint) {
    return true;
  }

  const minDistance = Math.max(4, stroke.radius * 0.4);
  return Math.hypot(point.x - lastPoint.x, point.y - lastPoint.y) >= minDistance;
}

function toHex(value: number): string {
  return Math.round(value).toString(16).padStart(2, "0");
}

export function sampleAverageColor(imageData: ImageData, centerX: number, centerY: number, sampleSize: number): string | null {
  const halfSize = Math.max(1, Math.round(sampleSize / 2));
  const minX = Math.max(0, Math.round(centerX) - halfSize);
  const maxX = Math.min(imageData.width - 1, Math.round(centerX) + halfSize);
  const minY = Math.max(0, Math.round(centerY) - halfSize);
  const maxY = Math.min(imageData.height - 1, Math.round(centerY) + halfSize);
  let red = 0;
  let green = 0;
  let blue = 0;
  let count = 0;

  for (let y = minY; y <= maxY; y += 1) {
    for (let x = minX; x <= maxX; x += 1) {
      const offset = (y * imageData.width + x) * 4;
      const alpha = imageData.data[offset + 3];
      if (alpha === 0) {
        continue;
      }

      red += imageData.data[offset];
      green += imageData.data[offset + 1];
      blue += imageData.data[offset + 2];
      count += 1;
    }
  }

  if (count === 0) {
    return null;
  }

  return `#${toHex(red / count)}${toHex(green / count)}${toHex(blue / count)}`;
}
