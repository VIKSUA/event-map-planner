import { useEffect, useRef, useState } from "react";
import type { ExportSize, MapSettings, MapSource } from "../types/map";
import { drawComposition } from "../lib/drawCanvas";
import { getExportSize, getGridMetrics } from "../lib/mapMath";
import { OverlayPanelStack } from "./OverlayPanelStack";
import { SlideOutPanel } from "./SlideOutPanel";
import { useMapDragPan } from "./useMapDragPan";

interface CanvasPreviewProps {
  settings: MapSettings;
  source: MapSource | null;
  loading: boolean;
  error: string | null;
  warnings: string[];
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

export function CanvasPreview({ settings, source, loading, error, warnings, onPanEnd }: CanvasPreviewProps) {
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [previewSize, setPreviewSize] = useState<ExportSize>({ width: 800, height: 800 });
  const exportSize = getExportSize(settings);
  const previewScale = previewSize.width / exportSize.width;
  const gridMetrics = source ? getGridMetrics(settings, exportSize, source) : null;
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
    drawComposition(context, exportSize, settings, source, { mapOffset: dragOffset });
  }, [dragOffset, exportSize, previewScale, previewSize, settings, source]);

  return (
    <main ref={wrapperRef} className="preview-shell">
      <div
        className={`canvas-card ${isDragging ? "is-dragging" : ""} ${isPanLocked ? "is-pan-locked" : ""}`}
        style={{ width: previewSize.width, height: previewSize.height }}
        title={isPanLocked ? "Updating map..." : "Drag map to move"}
        {...dragHandlers}
      >
        <canvas ref={canvasRef} aria-label="Map export preview" />
        {!source && (
          <div className="preview-placeholder">
            <h1>Map Background Exporter</h1>
            <p>Enter a Google Maps Static API key to load the satellite preview.</p>
          </div>
        )}
      </div>
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
