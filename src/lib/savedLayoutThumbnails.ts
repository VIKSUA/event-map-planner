import type { ExportSize, MapSettings, MapSource } from "../types/map";
import { fetchMapSource } from "./googleStaticMap";
import { getExportSize } from "./mapMath";
import { createSettingsFromSavedLayout, type SavedLayout } from "./savedLayouts";

interface ThumbnailCacheEntry {
  sourcePromise: Promise<MapSource>;
}

const thumbnailCache = new Map<string, ThumbnailCacheEntry>();

function thumbnailCacheKey(layout: SavedLayout, apiKey: string): string {
  return `${layout.id}:${layout.updatedAt}:${apiKey}:${layout.settings.zoom}:${layout.settings.latitude}:${layout.settings.longitude}`;
}

export function getThumbnailSize(settings: MapSettings, maxWidth = 360): ExportSize {
  const exportSize = getExportSize(settings);
  const scale = maxWidth / exportSize.width;
  return {
    width: Math.round(exportSize.width * scale),
    height: Math.max(120, Math.round(exportSize.height * scale)),
  };
}

export function fetchSavedLayoutThumbnailSource(
  layout: SavedLayout,
  apiKey: string,
  onRequestStart: () => void,
): Promise<{ settings: MapSettings; source: MapSource }> | null {
  if (!apiKey.trim()) {
    return null;
  }

  const settings = {
    ...createSettingsFromSavedLayout(layout, apiKey),
    resolutionMode: "standard" as const,
  };
  const key = thumbnailCacheKey(layout, apiKey);
  const cached = thumbnailCache.get(key);

  if (cached) {
    return cached.sourcePromise.then((source) => ({ settings, source }));
  }

  onRequestStart();
  const sourcePromise = fetchMapSource(settings);
  thumbnailCache.set(key, { sourcePromise });
  return sourcePromise.then((source) => ({ settings, source }));
}
