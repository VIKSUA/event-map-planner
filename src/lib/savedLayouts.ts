import type { MapSettings } from "../types/map";
import { DEFAULT_SETTINGS } from "./mapMath";
import { normalizeSettings } from "./storage";

export type SavedLayoutSnapshot = Omit<MapSettings, "apiKey">;

export interface SavedLayout {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  schemaVersion: 1;
  appVersion?: string;
  settings: SavedLayoutSnapshot;
}

export class SavedLayoutsLimitError extends Error {
  constructor() {
    super("Saved maps limit reached. Delete old maps first.");
  }
}

const SAVED_LAYOUTS_KEY = "map-background-exporter.saved-layouts";
export const SAVED_LAYOUTS_LIMIT = 100;

function createId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function isSavedLayout(value: unknown): value is SavedLayout {
  const layout = value as Partial<SavedLayout>;
  return Boolean(layout?.id && layout.name && layout.createdAt && layout.updatedAt && layout.schemaVersion === 1 && layout.settings);
}

function writeSavedLayouts(layouts: SavedLayout[]): void {
  try {
    localStorage.setItem(SAVED_LAYOUTS_KEY, JSON.stringify(layouts));
  } catch (error) {
    throw error;
  }
}

function createSnapshot(settings: MapSettings): SavedLayoutSnapshot {
  const { apiKey: _apiKey, ...snapshot } = settings;
  return snapshot;
}

function createName(settings: MapSettings): string {
  const coordinates = `${settings.latitude.toFixed(4)}, ${settings.longitude.toFixed(4)}`;
  return `${coordinates} · z${Math.round(settings.zoom)} · ${settings.format}`;
}

export function isQuotaExceededError(error: unknown): boolean {
  return error instanceof DOMException && (error.name === "QuotaExceededError" || error.name === "NS_ERROR_DOM_QUOTA_REACHED");
}

export function loadSavedLayouts(): SavedLayout[] {
  try {
    const raw = localStorage.getItem(SAVED_LAYOUTS_KEY);
    if (!raw) {
      return [];
    }

    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter(isSavedLayout) : [];
  } catch {
    return [];
  }
}

export function saveCurrentLayout(settings: MapSettings): SavedLayout {
  const layouts = loadSavedLayouts();
  if (layouts.length >= SAVED_LAYOUTS_LIMIT) {
    throw new SavedLayoutsLimitError();
  }

  const now = new Date().toISOString();
  const layout: SavedLayout = {
    id: createId(),
    name: createName(settings),
    createdAt: now,
    updatedAt: now,
    schemaVersion: 1,
    settings: createSnapshot(settings),
  };

  writeSavedLayouts([layout, ...layouts]);
  return layout;
}

export function deleteSavedLayout(id: string): SavedLayout[] {
  const nextLayouts = loadSavedLayouts().filter((layout) => layout.id !== id);
  writeSavedLayouts(nextLayouts);
  return nextLayouts;
}

export function getSavedLayoutsStorageUsage(): number {
  try {
    return JSON.stringify(loadSavedLayouts()).length;
  } catch {
    return 0;
  }
}

export function createSettingsFromSavedLayout(layout: SavedLayout, apiKey: string): MapSettings {
  return normalizeSettings({
    ...DEFAULT_SETTINGS,
    ...layout.settings,
    apiKey,
  } as MapSettings);
}
