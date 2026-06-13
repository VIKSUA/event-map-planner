import type { MapSettings, PanelPosition } from "../types/map";
import { MAX_GRID_LINE_WIDTH, MAX_SCALE, MAX_ZOOM, MIN_GRID_LINE_WIDTH, MIN_SCALE, MIN_ZOOM } from "./mapConstants";
import { DEFAULT_SETTINGS } from "./mapMath";

const SETTINGS_KEY = "map-background-exporter.settings";
const PANEL_KEY = "map-background-exporter.panel";

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function normalizeSettings(settings: MapSettings): MapSettings {
  return {
    ...settings,
    zoom: clamp(Math.round(settings.zoom), MIN_ZOOM, MAX_ZOOM),
    scale: clamp(Math.round(settings.scale), MIN_SCALE, MAX_SCALE),
    smallGridLineWidth: clamp(Math.round(settings.smallGridLineWidth), MIN_GRID_LINE_WIDTH, MAX_GRID_LINE_WIDTH),
    largeGridLineWidth: clamp(Math.round(settings.largeGridLineWidth), MIN_GRID_LINE_WIDTH, MAX_GRID_LINE_WIDTH),
  };
}

export function loadSettings(): MapSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) {
      return DEFAULT_SETTINGS;
    }

    return normalizeSettings({ ...DEFAULT_SETTINGS, ...JSON.parse(raw) } as MapSettings);
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function saveSettings(settings: MapSettings): void {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}

export function loadPanelPosition(): PanelPosition {
  try {
    const raw = localStorage.getItem(PANEL_KEY);
    if (!raw) {
      return { x: 16, y: 16 };
    }

    return { x: 16, y: 16, ...JSON.parse(raw) };
  } catch {
    return { x: 16, y: 16 };
  }
}

export function savePanelPosition(position: PanelPosition): void {
  localStorage.setItem(PANEL_KEY, JSON.stringify(position));
}
