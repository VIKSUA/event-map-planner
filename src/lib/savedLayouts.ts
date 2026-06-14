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

export class SavedLayoutsImportError extends Error {
  constructor(message: string) {
    super(message);
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

function sanitizeSnapshot(value: unknown): SavedLayoutSnapshot {
  const rawSettings = typeof value === "object" && value !== null ? value : {};
  return createSnapshot(
    normalizeSettings({
      ...DEFAULT_SETTINGS,
      ...(rawSettings as Partial<MapSettings>),
      apiKey: "",
    } as MapSettings),
  );
}

export function sanitizeSavedLayoutForExport(layout: SavedLayout): SavedLayout {
  return {
    ...layout,
    schemaVersion: 1,
    settings: sanitizeSnapshot(layout.settings),
  };
}

export function serializeSavedLayoutForClipboard(layout: SavedLayout): string {
  return JSON.stringify(sanitizeSavedLayoutForExport(layout), null, 2);
}

export function serializeSavedLayoutsForClipboard(layouts: SavedLayout[]): string {
  return JSON.stringify(layouts.map(sanitizeSavedLayoutForExport), null, 2);
}

function importedLayoutCandidates(parsed: unknown): unknown[] {
  if (Array.isArray(parsed)) {
    return parsed;
  }

  if (typeof parsed === "object" && parsed !== null && Array.isArray((parsed as { layouts?: unknown }).layouts)) {
    return (parsed as { layouts: unknown[] }).layouts;
  }

  return [parsed];
}

function normalizeImportedSavedLayout(value: unknown, usedIds: Set<string>, now: string): SavedLayout | null {
  if (typeof value !== "object" || value === null || !("settings" in value)) {
    return null;
  }

  const rawLayout = value as Partial<SavedLayout> & { settings?: unknown };
  const settings = sanitizeSnapshot(rawLayout.settings);
  const importedId = typeof rawLayout.id === "string" && rawLayout.id ? rawLayout.id : null;
  const duplicateId = !importedId || usedIds.has(importedId);
  const id = duplicateId ? createId() : importedId;
  usedIds.add(id);

  return {
    id,
    name: `${duplicateId ? "Imported " : ""}${typeof rawLayout.name === "string" && rawLayout.name.trim() ? rawLayout.name.trim() : createName({ ...DEFAULT_SETTINGS, ...settings })}`,
    createdAt: typeof rawLayout.createdAt === "string" ? rawLayout.createdAt : now,
    updatedAt: now,
    schemaVersion: 1,
    appVersion: typeof rawLayout.appVersion === "string" ? rawLayout.appVersion : undefined,
    settings,
  };
}

export function parseImportedSavedLayouts(rawText: string, existingLayouts: SavedLayout[] = loadSavedLayouts()): SavedLayout[] {
  if (!rawText.trim()) {
    throw new SavedLayoutsImportError("Paste saved map JSON first.");
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(rawText);
  } catch {
    throw new SavedLayoutsImportError("Invalid JSON.");
  }

  const now = new Date().toISOString();
  const usedIds = new Set(existingLayouts.map((layout) => layout.id));
  const imported = importedLayoutCandidates(parsed)
    .map((candidate) => normalizeImportedSavedLayout(candidate, usedIds, now))
    .filter((layout): layout is SavedLayout => Boolean(layout));

  if (imported.length === 0) {
    throw new SavedLayoutsImportError("No valid saved maps found.");
  }

  return imported;
}

export function importSavedLayouts(rawText: string): { layouts: SavedLayout[]; importedCount: number } {
  const existingLayouts = loadSavedLayouts();
  const imported = parseImportedSavedLayouts(rawText, existingLayouts);
  if (existingLayouts.length + imported.length > SAVED_LAYOUTS_LIMIT) {
    throw new SavedLayoutsLimitError();
  }

  const layouts = [...imported, ...existingLayouts];
  writeSavedLayouts(layouts);
  return { layouts, importedCount: imported.length };
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
