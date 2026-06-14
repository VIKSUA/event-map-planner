import type { Annotation, AnnotationColorMode, AnnotationLayer, BrushAnnotation, ExportSize, LineAnnotation, PaintPoint, PaintStroke, RectAnnotation, TextAnnotation } from "../types/map";

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

function drawAnnotationShape(context: CanvasRenderingContext2D, annotation: Annotation): void {
  context.lineCap = "round";
  context.lineJoin = "round";
  context.strokeStyle = annotation.baseColor;
  context.fillStyle = annotation.baseColor;

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
}

function drawFilteredAnnotation(context: CanvasRenderingContext2D, annotation: Annotation, appearanceFilter: string, opacity: number, size: ExportSize): void {
  const layerCanvas = document.createElement("canvas");
  layerCanvas.width = size.width;
  layerCanvas.height = size.height;
  const layerContext = layerCanvas.getContext("2d");
  if (!layerContext) {
    return;
  }

  drawAnnotationShape(layerContext, annotation);

  context.save();
  context.filter = appearanceFilter;
  context.globalAlpha = opacity;
  context.drawImage(layerCanvas, 0, 0);
  context.restore();
}

export function drawAnnotations(context: CanvasRenderingContext2D, annotations: Annotation[], appearanceFilter: string, opacity: number, size: ExportSize): void {
  for (const annotation of annotations) {
    const normalizedAnnotation = normalizeAnnotationColor(annotation);

    if (shouldAnnotationUseMapFilter(normalizedAnnotation)) {
      drawFilteredAnnotation(context, normalizedAnnotation, appearanceFilter, opacity, size);
      continue;
    }

    context.save();
    context.filter = "none";
    context.globalAlpha = 1;
    drawAnnotationShape(context, normalizedAnnotation);
    context.restore();
  }

  context.filter = "none";
  context.globalAlpha = 1;
}
