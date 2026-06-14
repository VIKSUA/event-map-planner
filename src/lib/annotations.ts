import type { Annotation, AnnotationColorMode, AnnotationLayer, BrushAnnotation, LineAnnotation, PaintPoint, PaintStroke, RectAnnotation, TextAnnotation } from "../types/map";

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

export function shouldAnnotationUseMapFilter(annotation: Annotation): boolean {
  const normalized = normalizeAnnotationColor(annotation);
  return normalized.type !== "text" && normalized.colorMode === "sampled" && normalized.followMapAppearance;
}

export function drawAnnotations(context: CanvasRenderingContext2D, annotations: Annotation[], appearanceFilter: string): void {
  for (const annotation of annotations) {
    const normalizedAnnotation = normalizeAnnotationColor(annotation);

    context.save();
    context.filter = shouldAnnotationUseMapFilter(normalizedAnnotation) ? appearanceFilter : "none";
    context.lineCap = "round";
    context.lineJoin = "round";
    context.strokeStyle = normalizedAnnotation.baseColor;
    context.fillStyle = normalizedAnnotation.baseColor;

    if (normalizedAnnotation.type === "brush") {
      for (const point of normalizedAnnotation.points) {
        context.beginPath();
        context.arc(point.x, point.y, normalizedAnnotation.size / 2, 0, Math.PI * 2);
        context.fill();
      }
    } else if (normalizedAnnotation.type === "line") {
      context.lineWidth = normalizedAnnotation.width;
      context.beginPath();
      context.moveTo(normalizedAnnotation.start.x, normalizedAnnotation.start.y);
      context.lineTo(normalizedAnnotation.end.x, normalizedAnnotation.end.y);
      context.stroke();
    } else if (normalizedAnnotation.type === "rect") {
      context.lineWidth = normalizedAnnotation.width;
      context.strokeRect(normalizedAnnotation.x, normalizedAnnotation.y, normalizedAnnotation.widthPx, normalizedAnnotation.heightPx);
    } else {
      context.font = `${normalizedAnnotation.fontSize}px Inter, ui-sans-serif, system-ui, sans-serif`;
      context.textBaseline = "top";
      context.fillText(normalizedAnnotation.text, normalizedAnnotation.x, normalizedAnnotation.y);
    }

    context.restore();
  }

  context.filter = "none";
}
