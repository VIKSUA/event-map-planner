import type { Annotation, AnnotationLayer, BrushAnnotation, LineAnnotation, PaintPoint, PaintStroke, RectAnnotation, TextAnnotation } from "../types/map";

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

export function createBrushAnnotation(color: string, layer: AnnotationLayer, size: number, point: PaintPoint): BrushAnnotation {
  return {
    id: createId(),
    type: "brush",
    color,
    layer,
    size,
    points: [point],
  };
}

export function createLineAnnotation(color: string, layer: AnnotationLayer, width: number, start: PaintPoint, end: PaintPoint): LineAnnotation {
  return {
    id: createId(),
    type: "line",
    color,
    layer,
    width,
    start,
    end,
  };
}

export function createRectAnnotation(color: string, layer: AnnotationLayer, width: number, start: PaintPoint, end: PaintPoint): RectAnnotation {
  const x = Math.min(start.x, end.x);
  const y = Math.min(start.y, end.y);

  return {
    id: createId(),
    type: "rect",
    color,
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

export function drawAnnotations(context: CanvasRenderingContext2D, annotations: Annotation[]): void {
  for (const annotation of annotations) {
    context.save();
    context.lineCap = "round";
    context.lineJoin = "round";
    context.strokeStyle = annotation.color;
    context.fillStyle = annotation.color;

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
