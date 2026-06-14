import type { Annotation, AnnotationColorMode, AnnotationLayer, AppearanceSettings, BrushAnnotation, LineAnnotation, PaintPoint, PaintStroke, RectAnnotation, TextAnnotation } from "../types/map";

function createId(): string {
  return typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function defaultLayerForAnnotation(annotation: Annotation): AnnotationLayer {
  return annotation.type === "text" ? "aboveGrid" : "belowGrid";
}

export function normalizeAnnotationLayer(annotation: Annotation): Annotation {
  const layer = (annotation as { layer?: unknown }).layer;
  return {
    ...annotation,
    layer: layer === "belowGrid" || layer === "aboveGrid" ? layer : defaultLayerForAnnotation(annotation),
  } as Annotation;
}

function followMapAppearanceForColorMode(colorMode: AnnotationColorMode): boolean {
  return colorMode === "sampled";
}

export function normalizeAnnotationColor(annotation: Annotation): Annotation {
  const legacyAnnotation = annotation as Partial<Annotation> & { baseColor?: unknown; color?: unknown; colorMode?: unknown; followMapAppearance?: unknown };
  const baseColor = typeof legacyAnnotation.baseColor === "string" ? legacyAnnotation.baseColor : typeof legacyAnnotation.color === "string" ? legacyAnnotation.color : "#808080";
  const colorMode: AnnotationColorMode = annotation.type !== "text" && legacyAnnotation.colorMode === "sampled" ? "sampled" : "manual";

  return {
    ...annotation,
    color: baseColor,
    baseColor,
    colorMode,
    followMapAppearance: annotation.type !== "text" && colorMode === "sampled" && legacyAnnotation.followMapAppearance !== false,
  } as Annotation;
}

export function normalizeAnnotation(annotation: Annotation): Annotation {
  return normalizeAnnotationColor(normalizeAnnotationLayer(annotation));
}

export function createBrushAnnotation(color: string, colorMode: AnnotationColorMode, layer: AnnotationLayer, size: number, point: PaintPoint): BrushAnnotation {
  return {
    id: createId(),
    type: "brush",
    color,
    baseColor: color,
    colorMode,
    followMapAppearance: followMapAppearanceForColorMode(colorMode),
    layer,
    size,
    points: [point],
  };
}

export function createLineAnnotation(color: string, colorMode: AnnotationColorMode, layer: AnnotationLayer, width: number, start: PaintPoint, end: PaintPoint): LineAnnotation {
  return {
    id: createId(),
    type: "line",
    color,
    baseColor: color,
    colorMode,
    followMapAppearance: followMapAppearanceForColorMode(colorMode),
    layer,
    width,
    start,
    end,
  };
}

export function createRectAnnotation(color: string, colorMode: AnnotationColorMode, layer: AnnotationLayer, width: number, start: PaintPoint, end: PaintPoint): RectAnnotation {
  const x = Math.min(start.x, end.x);
  const y = Math.min(start.y, end.y);

  return {
    id: createId(),
    type: "rect",
    color,
    baseColor: color,
    colorMode,
    followMapAppearance: followMapAppearanceForColorMode(colorMode),
    layer,
    width,
    x,
    y,
    widthPx: Math.abs(end.x - start.x),
    heightPx: Math.abs(end.y - start.y),
  };
}

export function createTextAnnotation(color: string, layer: AnnotationLayer, fontSize: number, point: PaintPoint, text: string): TextAnnotation {
  return {
    id: createId(),
    type: "text",
    color,
    baseColor: color,
    colorMode: "manual",
    followMapAppearance: false,
    layer,
    fontSize,
    x: point.x,
    y: point.y,
    text,
  };
}

export function migratePaintStrokes(strokes: PaintStroke[]): BrushAnnotation[] {
  return strokes.map((stroke) => ({
    id: stroke.id,
    type: "brush",
    color: stroke.color,
    baseColor: stroke.color,
    colorMode: "manual",
    followMapAppearance: false,
    layer: "belowGrid",
    size: stroke.radius * 2,
    points: stroke.points,
  }));
}

export function shouldAddBrushPoint(annotation: BrushAnnotation, point: PaintPoint): boolean {
  const lastPoint = annotation.points[annotation.points.length - 1];
  if (!lastPoint) {
    return true;
  }

  const minDistance = Math.max(4, annotation.size * 0.4);
  return Math.hypot(point.x - lastPoint.x, point.y - lastPoint.y) >= minDistance;
}

function clampColorChannel(value: number): number {
  return Math.min(255, Math.max(0, Math.round(value)));
}

function parseHexColor(color: string): { red: number; green: number; blue: number } | null {
  const normalized = color.trim();
  const shortHex = /^#([0-9a-f]{3})$/i.exec(normalized);
  if (shortHex) {
    const [red, green, blue] = shortHex[1].split("").map((value) => Number.parseInt(`${value}${value}`, 16));
    return { red, green, blue };
  }

  const longHex = /^#([0-9a-f]{6})$/i.exec(normalized);
  if (!longHex) {
    return null;
  }

  return {
    red: Number.parseInt(longHex[1].slice(0, 2), 16),
    green: Number.parseInt(longHex[1].slice(2, 4), 16),
    blue: Number.parseInt(longHex[1].slice(4, 6), 16),
  };
}

function toHexColor(red: number, green: number, blue: number): string {
  return `#${clampColorChannel(red).toString(16).padStart(2, "0")}${clampColorChannel(green).toString(16).padStart(2, "0")}${clampColorChannel(blue)
    .toString(16)
    .padStart(2, "0")}`;
}

export function applyAppearanceToColor(baseColor: string, appearance: Pick<AppearanceSettings, "mapGrayscale" | "mapBrightness" | "mapContrast" | "mapSaturation">): string {
  const parsed = parseHexColor(baseColor);
  if (!parsed) {
    return baseColor;
  }

  let { red, green, blue } = parsed;
  if (appearance.mapGrayscale) {
    const gray = 0.2126 * red + 0.7152 * green + 0.0722 * blue;
    red = gray;
    green = gray;
    blue = gray;
  }

  const brightness = Math.max(0, appearance.mapBrightness) / 100;
  red *= brightness;
  green *= brightness;
  blue *= brightness;

  const contrast = Math.max(0, appearance.mapContrast) / 100;
  red = (red - 128) * contrast + 128;
  green = (green - 128) * contrast + 128;
  blue = (blue - 128) * contrast + 128;

  const saturation = Math.max(0, appearance.mapSaturation) / 100;
  const saturatedRed = (0.213 + 0.787 * saturation) * red + (0.715 - 0.715 * saturation) * green + (0.072 - 0.072 * saturation) * blue;
  const saturatedGreen = (0.213 - 0.213 * saturation) * red + (0.715 + 0.285 * saturation) * green + (0.072 - 0.072 * saturation) * blue;
  const saturatedBlue = (0.213 - 0.213 * saturation) * red + (0.715 - 0.715 * saturation) * green + (0.072 + 0.928 * saturation) * blue;

  return toHexColor(saturatedRed, saturatedGreen, saturatedBlue);
}

export function resolveAnnotationRenderColor(annotation: Annotation, appearance: Pick<AppearanceSettings, "mapGrayscale" | "mapBrightness" | "mapContrast" | "mapSaturation">): string {
  const normalized = normalizeAnnotationColor(annotation);
  return normalized.followMapAppearance ? applyAppearanceToColor(normalized.baseColor, appearance) : normalized.baseColor;
}

export function drawAnnotations(context: CanvasRenderingContext2D, annotations: Annotation[], appearance: Pick<AppearanceSettings, "mapGrayscale" | "mapBrightness" | "mapContrast" | "mapSaturation">): void {
  for (const annotation of annotations) {
    const renderColor = resolveAnnotationRenderColor(annotation, appearance);

    context.save();
    context.lineCap = "round";
    context.lineJoin = "round";
    context.strokeStyle = renderColor;
    context.fillStyle = renderColor;

    if (annotation.type === "brush") {
      for (const point of annotation.points) {
        context.beginPath();
        context.arc(point.x, point.y, annotation.size / 2, 0, Math.PI * 2);
        context.fill();
      }
    } else if (annotation.type === "line") {
      context.lineWidth = annotation.width;
      context.beginPath();
      context.moveTo(annotation.start.x, annotation.start.y);
      context.lineTo(annotation.end.x, annotation.end.y);
      context.stroke();
    } else if (annotation.type === "rect") {
      context.lineWidth = annotation.width;
      context.strokeRect(annotation.x, annotation.y, annotation.widthPx, annotation.heightPx);
    } else {
      context.font = `${annotation.fontSize}px Inter, ui-sans-serif, system-ui, sans-serif`;
      context.textBaseline = "top";
      context.fillText(annotation.text, annotation.x, annotation.y);
    }

    context.restore();
  }
}
