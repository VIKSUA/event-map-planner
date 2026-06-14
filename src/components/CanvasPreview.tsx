import { useEffect, useRef, useState } from "react";
import type { PointerEvent as ReactPointerEvent } from "react";
import BrushIcon from "@mui/icons-material/Brush";
import { Box } from "@mui/material";
import type { Annotation, BrushAnnotation, ExportSize, MapSettings, MapSource, PaintPoint } from "../types/map";
import { createBrushAnnotation, createLineAnnotation, createRectAnnotation, createTextAnnotation, shouldAddBrushPoint } from "../lib/annotations";
import { drawComposition, renderMapOnlyCanvas } from "../lib/drawCanvas";
import { getExportSize, getGridMetrics } from "../lib/mapMath";
import { sampleAverageColor } from "../lib/paint";
import { OverlayPanelStack } from "./OverlayPanelStack";
import { PaintToolsPanel } from "./PaintToolsPanel";
import { SlideOutPanel } from "./SlideOutPanel";
import { useMapDragPan } from "./useMapDragPan";

interface CanvasPreviewProps {
  settings: MapSettings;
  source: MapSource | null;
  loading: boolean;
  error: string | null;
  warnings: string[];
  onChange: (settings: MapSettings) => void;
  onPanEnd: (latitude: number, longitude: number) => void;
}

function fitSize(containerWidth: number, containerHeight: number, exportSize: ExportSize): ExportSize {
  const padding = 48;
  const availableWidth = Math.max(240, containerWidth - padding);
  const availableHeight = Math.max(240, containerHeight - padding);
  const scale = Math.min(availableWidth / exportSize.width, availableHeight / exportSize.height);

  return {
    width: Math.round(exportSize.width * scale),
    height: Math.round(exportSize.height * scale),
  };
}

function formatMetric(value: number): string {
  return Number.isFinite(value) ? value.toFixed(3) : "n/a";
}

export function CanvasPreview({ settings, source, loading, error, warnings, onChange, onPanEnd }: CanvasPreviewProps) {
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const currentAnnotationRef = useRef<Annotation | null>(null);
  const annotationStartRef = useRef<PaintPoint | null>(null);
  const [previewSize, setPreviewSize] = useState<ExportSize>({ width: 800, height: 800 });
  const [currentAnnotation, setCurrentAnnotation] = useState<Annotation | null>(null);
  const exportSize = getExportSize(settings);
  const previewScale = previewSize.width / exportSize.width;
  const gridMetrics = source ? getGridMetrics(settings, exportSize, source) : null;
  const isPaintActive = settings.paintMode !== "pan";
  const { dragOffset, isDragging, isPanLocked, isMapUpdatingAfterDrag, dragHandlers } = useMapDragPan({
    settings,
    source,
    exportSize,
    previewScale,
    loadError: error,
    onPanEnd,
  });
  const statusItems = [
    loading ? { kind: "default", text: "Loading Google Static Maps source..." } : null,
    isMapUpdatingAfterDrag ? { kind: "default", text: "Updating map..." } : null,
    error ? { kind: "error", text: error } : null,
    ...warnings.map((warning) => ({ kind: "warning", text: warning })),
  ].filter((item): item is { kind: string; text: string } => Boolean(item));

  useEffect(() => {
    const wrapper = wrapperRef.current;
    if (!wrapper) {
      return;
    }

    const resizeObserver = new ResizeObserver(([entry]) => {
      setPreviewSize(fitSize(entry.contentRect.width, entry.contentRect.height, getExportSize(settings)));
    });

    resizeObserver.observe(wrapper);
    return () => resizeObserver.disconnect();
  }, [settings]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !source) {
      return;
    }

    const dpr = window.devicePixelRatio || 1;
    canvas.width = Math.round(previewSize.width * dpr);
    canvas.height = Math.round(previewSize.height * dpr);
    canvas.style.width = `${previewSize.width}px`;
    canvas.style.height = `${previewSize.height}px`;

    const context = canvas.getContext("2d");
    if (!context) {
      return;
    }

    context.setTransform(previewScale * dpr, 0, 0, previewScale * dpr, 0, 0);
    drawComposition(context, exportSize, settings, source, { additionalAnnotations: currentAnnotation ? [currentAnnotation] : [], mapOffset: dragOffset });
  }, [currentAnnotation, dragOffset, exportSize, previewScale, previewSize, settings, source]);

  const getExportPoint = (event: ReactPointerEvent<HTMLElement>): PaintPoint => {
    const bounds = event.currentTarget.getBoundingClientRect();
    return {
      x: (event.clientX - bounds.left) / previewScale,
      y: (event.clientY - bounds.top) / previewScale,
    };
  };

  const handlePaintPointerDown = (event: ReactPointerEvent<HTMLElement>) => {
    if (!source || isPanLocked || event.button !== 0) {
      return;
    }

    event.preventDefault();
    const point = getExportPoint(event);
    if (settings.paintMode === "pick") {
      try {
        const mapCanvas = renderMapOnlyCanvas(settings, source, exportSize, { applyAppearance: false });
        const context = mapCanvas.getContext("2d");
        const imageData = context?.getImageData(0, 0, mapCanvas.width, mapCanvas.height);
        const color = imageData ? sampleAverageColor(imageData, point.x, point.y, settings.paintSampleSize) : null;
        if (color) {
          onChange({ ...settings, drawingLayer: "belowGrid", paintColor: color, paintColorMode: "sampled", paintMode: "brush" });
        }
      } catch {
        // Keep the previous color if sampling fails.
      }
      return;
    }

    if (settings.paintMode === "text") {
      const text = window.prompt("Text");
      if (text?.trim()) {
        onChange({ ...settings, annotations: [...settings.annotations, createTextAnnotation(settings.paintColor, settings.drawingLayer, settings.paintBrushRadius, point, text.trim())] });
      }
      return;
    }

    if (!["brush", "line", "rect"].includes(settings.paintMode)) {
      return;
    }

    event.currentTarget.setPointerCapture(event.pointerId);
    const annotation =
      settings.paintMode === "brush"
        ? createBrushAnnotation(settings.paintColor, settings.paintColorMode, settings.drawingLayer, settings.paintBrushRadius, point)
        : settings.paintMode === "line"
          ? createLineAnnotation(settings.paintColor, settings.paintColorMode, settings.drawingLayer, settings.paintBrushRadius, point, point)
          : createRectAnnotation(settings.paintColor, settings.paintColorMode, settings.drawingLayer, settings.paintBrushRadius, point, point);
    currentAnnotationRef.current = annotation;
    annotationStartRef.current = point;
    setCurrentAnnotation(annotation);
  };

  const handlePaintPointerMove = (event: ReactPointerEvent<HTMLElement>) => {
    const annotation = currentAnnotationRef.current;
    if (!annotation) {
      return;
    }

    event.preventDefault();
    const point = getExportPoint(event);
    let nextAnnotation: Annotation | null = null;

    if (annotation.type === "brush") {
      if (!shouldAddBrushPoint(annotation, point)) {
        return;
      }
      nextAnnotation = { ...annotation, points: [...annotation.points, point] };
    } else if (annotation.type === "line") {
      nextAnnotation = { ...annotation, end: point };
    } else if (annotation.type === "rect") {
      nextAnnotation = createRectAnnotation(annotation.baseColor, annotation.colorMode, annotation.layer, annotation.width, annotationStartRef.current ?? { x: annotation.x, y: annotation.y }, point);
    }

    if (nextAnnotation) {
      currentAnnotationRef.current = nextAnnotation;
      setCurrentAnnotation(nextAnnotation);
    }
  };

  const finishPaintAnnotation = (event: ReactPointerEvent<HTMLElement>, commit: boolean) => {
    const annotation = currentAnnotationRef.current;
    if (!annotation) {
      return;
    }

    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }

    currentAnnotationRef.current = null;
    annotationStartRef.current = null;
    setCurrentAnnotation(null);
    if (commit) {
      onChange({ ...settings, annotations: [...settings.annotations, annotation] });
    }
  };

  const paintHandlers = {
    onPointerDown: handlePaintPointerDown,
    onPointerMove: handlePaintPointerMove,
    onPointerUp: (event: ReactPointerEvent<HTMLElement>) => finishPaintAnnotation(event, true),
    onPointerCancel: (event: ReactPointerEvent<HTMLElement>) => finishPaintAnnotation(event, false),
  };

  return (
    <main ref={wrapperRef} className="preview-shell">
      <div
        className={`canvas-card ${isDragging ? "is-dragging" : ""} ${isPanLocked ? "is-pan-locked" : ""}`}
        style={{ width: previewSize.width, height: previewSize.height, cursor: isPanLocked ? "wait" : isPaintActive ? "crosshair" : undefined }}
        title={isPanLocked ? "Updating map..." : isPaintActive ? "Paint editor active" : "Drag map to move"}
        {...(isPaintActive ? paintHandlers : dragHandlers)}
      >
        <canvas ref={canvasRef} aria-label="Map export preview" />
        {!source && (
          <div className="preview-placeholder">
            <h1>Map Background Exporter</h1>
            <p>Enter a Google Maps Static API key to load the satellite preview.</p>
          </div>
        )}
      </div>
      <Box
        className="no-print"
        sx={{
          position: "absolute",
          right: 16,
          top: 80,
          zIndex: 7,
          pointerEvents: "none",
        }}
      >
        <SlideOutPanel storageKey="map-background-exporter.paint-panel" collapsedIcon={BrushIcon} defaultCollapsed width={300}>
          <PaintToolsPanel settings={settings} onChange={onChange} />
        </SlideOutPanel>
      </Box>
      <OverlayPanelStack>
        {statusItems.length > 0 && (
          <SlideOutPanel storageKey="map-background-exporter.status-panel" width={360}>
            <div className="status-stack">
              {statusItems.map((item) => (
                <div className={`status ${item.kind === "error" ? "status-error" : item.kind === "warning" ? "status-warning" : ""}`} key={`${item.kind}-${item.text}`}>
                  {item.text}
                </div>
              ))}
            </div>
          </SlideOutPanel>
        )}

        {gridMetrics && (
          <SlideOutPanel storageKey="map-background-exporter.debug-panel" defaultCollapsed width={340}>
            <div className="status debug-metrics">
              <strong>Grid debug</strong>
              <span>export: {exportSize.width} x {exportSize.height}px</span>
              <span>previewScale: {formatMetric(previewScale)}</span>
              <span>webMpp: {formatMetric(gridMetrics.webMercatorMetersPerPixel)}</span>
              <span>googleScale: {gridMetrics.googleStaticScale}</span>
              <span>source: {gridMetrics.sourceImageWidth} x {gridMetrics.sourceImageHeight}px</span>
              <span>logical/tile: {gridMetrics.requestedStaticLogicalSize}px</span>
              <span>tileCount: {gridMetrics.tileCount}</span>
              <span>mapDrawSize: {formatMetric(gridMetrics.mapDrawSize)}px</span>
              <span>sourceToCanvas: {formatMetric(gridMetrics.sourceToCanvasScale)}</span>
              <span>totalMapScale: {formatMetric(gridMetrics.totalMapScale)}</span>
              <span>userScale: {formatMetric(gridMetrics.userScaleFactor)}</span>
              <span>effectiveMpp: {formatMetric(gridMetrics.effectiveMetersPerCanvasPixel)}</span>
              <span>smallStep: {formatMetric(gridMetrics.smallGridStepPx)}px</span>
              <span>largeStep: {formatMetric(gridMetrics.largeGridStepPx)}px</span>
              <span>unit: {settings.unit}</span>
            </div>
          </SlideOutPanel>
        )}
      </OverlayPanelStack>
    </main>
  );
}
