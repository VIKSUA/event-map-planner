import { useCallback, useEffect, useRef, useState } from "react";
import type { PointerEvent as ReactPointerEvent } from "react";
import type { ExportSize, MapSettings, MapSource } from "../types/map";
import { getGridMetrics, moveCenterByScreenMeters } from "../lib/mapMath";

interface DragStart {
  pointerId: number;
  pointerX: number;
  pointerY: number;
  latitude: number;
  longitude: number;
  rotation: number;
  previewScale: number;
  metersPerExportPixel: number;
}

interface PendingCommit {
  source: MapSource;
}

interface UseMapDragPanProps {
  settings: MapSettings;
  source: MapSource | null;
  exportSize: ExportSize;
  previewScale: number;
  loadError: string | null;
  onPanEnd: (latitude: number, longitude: number) => void;
}

export function useMapDragPan({ settings, source, exportSize, previewScale, loadError, onPanEnd }: UseMapDragPanProps) {
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [isPanLocked, setIsPanLocked] = useState(false);
  const dragStartRef = useRef<DragStart | null>(null);
  const pendingCommitRef = useRef<PendingCommit | null>(null);

  useEffect(() => {
    if (pendingCommitRef.current && source && source !== pendingCommitRef.current.source) {
      pendingCommitRef.current = null;
      setDragOffset({ x: 0, y: 0 });
      setIsDragging(false);
      setIsPanLocked(false);
      return;
    }

    if (!pendingCommitRef.current && !dragStartRef.current) {
      setDragOffset({ x: 0, y: 0 });
      setIsDragging(false);
      setIsPanLocked(false);
    }
  }, [source]);

  useEffect(() => {
    if (!loadError || !pendingCommitRef.current) {
      return;
    }

    pendingCommitRef.current = null;
    dragStartRef.current = null;
    setDragOffset({ x: 0, y: 0 });
    setIsDragging(false);
    setIsPanLocked(false);
  }, [loadError]);

  const getExportDelta = useCallback((event: ReactPointerEvent<HTMLElement>, dragStart: DragStart) => {
    const scale = Math.max(dragStart.previewScale, 0.0001);
    return {
      x: (event.clientX - dragStart.pointerX) / scale,
      y: (event.clientY - dragStart.pointerY) / scale,
    };
  }, []);

  const handlePointerDown = useCallback(
    (event: ReactPointerEvent<HTMLElement>) => {
      if (!source || isPanLocked || event.button !== 0) {
        return;
      }

      event.preventDefault();
      event.currentTarget.setPointerCapture(event.pointerId);
      const metrics = getGridMetrics(settings, exportSize, source);
      dragStartRef.current = {
        pointerId: event.pointerId,
        pointerX: event.clientX,
        pointerY: event.clientY,
        latitude: settings.latitude,
        longitude: settings.longitude,
        rotation: settings.rotation,
        previewScale,
        metersPerExportPixel: metrics.effectiveMetersPerCanvasPixel,
      };
      pendingCommitRef.current = null;
      setDragOffset({ x: 0, y: 0 });
      setIsDragging(true);
    },
    [exportSize, isPanLocked, previewScale, settings, source],
  );

  const handlePointerMove = useCallback(
    (event: ReactPointerEvent<HTMLElement>) => {
      const dragStart = dragStartRef.current;
      if (!dragStart || dragStart.pointerId !== event.pointerId) {
        return;
      }

      event.preventDefault();
      setDragOffset(getExportDelta(event, dragStart));
    },
    [getExportDelta],
  );

  const finishDrag = useCallback(
    (event: ReactPointerEvent<HTMLElement>, commit: boolean) => {
      const dragStart = dragStartRef.current;
      if (!dragStart || dragStart.pointerId !== event.pointerId) {
        return;
      }

      const delta = getExportDelta(event, dragStart);
      dragStartRef.current = null;
      setIsDragging(false);

      if (event.currentTarget.hasPointerCapture(event.pointerId)) {
        event.currentTarget.releasePointerCapture(event.pointerId);
      }

      if (!commit || (Math.abs(delta.x) < 0.5 && Math.abs(delta.y) < 0.5)) {
        setDragOffset({ x: 0, y: 0 });
        pendingCommitRef.current = null;
        return;
      }

      setDragOffset(delta);
      if (source) {
        pendingCommitRef.current = { source };
        setIsPanLocked(true);
      }

      const next = moveCenterByScreenMeters(
        dragStart.latitude,
        dragStart.longitude,
        delta.x * dragStart.metersPerExportPixel,
        delta.y * dragStart.metersPerExportPixel,
        dragStart.rotation,
      );
      onPanEnd(Number(next.latitude.toFixed(7)), Number(next.longitude.toFixed(7)));
    },
    [getExportDelta, onPanEnd, source],
  );

  const handlePointerUp = useCallback((event: ReactPointerEvent<HTMLElement>) => finishDrag(event, true), [finishDrag]);
  const handlePointerCancel = useCallback((event: ReactPointerEvent<HTMLElement>) => finishDrag(event, false), [finishDrag]);

  return {
    dragOffset,
    isDragging,
    isPanLocked,
    isMapUpdatingAfterDrag: isPanLocked,
    dragHandlers: {
      onPointerDown: handlePointerDown,
      onPointerMove: handlePointerMove,
      onPointerUp: handlePointerUp,
      onPointerCancel: handlePointerCancel,
    },
  };
}
