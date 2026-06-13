import { useEffect, useRef, useState } from "react";
import type { ExportSize, MapSettings, MapSource } from "../types/map";
import { drawComposition } from "../lib/drawCanvas";
import { getExportSize } from "../lib/mapMath";

interface CanvasPreviewProps {
  settings: MapSettings;
  source: MapSource | null;
  loading: boolean;
  error: string | null;
  warnings: string[];
}

function fitSize(containerWidth: number, containerHeight: number, exportSize: ExportSize): ExportSize {
  const padding = 48;
  const availableWidth = Math.max(240, containerWidth - padding);
  const availableHeight = Math.max(240, containerHeight - padding);
  const scale = Math.min(availableWidth / exportSize.width, availableHeight / exportSize.height);

  return {
    width: Math.max(240, Math.round(exportSize.width * scale)),
    height: Math.max(240, Math.round(exportSize.height * scale)),
  };
}

export function CanvasPreview({ settings, source, loading, error, warnings }: CanvasPreviewProps) {
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [previewSize, setPreviewSize] = useState<ExportSize>({ width: 800, height: 800 });

  useEffect(() => {
    const wrapper = wrapperRef.current;
    if (!wrapper) {
      return;
    }

    const resizeObserver = new ResizeObserver(([entry]) => {
      const exportSize = getExportSize(settings);
      setPreviewSize(fitSize(entry.contentRect.width, entry.contentRect.height, exportSize));
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

    context.setTransform(dpr, 0, 0, dpr, 0, 0);
    drawComposition(context, previewSize, settings, source);
  }, [previewSize, settings, source]);

  return (
    <main ref={wrapperRef} className="preview-shell">
      <div className="canvas-card" style={{ width: previewSize.width, height: previewSize.height }}>
        <canvas ref={canvasRef} aria-label="Map export preview" />
        {!source && (
          <div className="preview-placeholder">
            <h1>Map Background Exporter</h1>
            <p>Enter a Google Maps Static API key to load the satellite preview.</p>
          </div>
        )}
      </div>
      <div className="status-stack no-print">
        {loading && <div className="status">Loading Google Static Maps source...</div>}
        {error && <div className="status status-error">{error}</div>}
        {warnings.map((warning) => (
          <div className="status status-warning" key={warning}>{warning}</div>
        ))}
      </div>
    </main>
  );
}
