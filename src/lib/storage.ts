import type { AppearanceMode, AppearanceSettings, MapSettings, PanelPosition } from "../types/map";
import {
  MAX_GRID_LINE_WIDTH,
  MAX_MAP_FILTER_PERCENT,
  MAX_SCALE,
  MAX_ZOOM,
  MIN_GRID_LINE_WIDTH,
  MIN_MAP_FILTER_PERCENT,
  MIN_SCALE,
  MIN_ZOOM,
} from "./mapConstants";
import { DEFAULT_APPEARANCE_BY_MODE, applyActiveAppearance } from "./appearancePresets";
import { DEFAULT_SETTINGS } from "./mapMath";

const SETTINGS_KEY = "map-background-exporter.settings";
const PANEL_KEY = "map-background-exporter.panel";

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function isAppearanceMode(value: unknown): value is AppearanceMode {
  return value === "screen" || value === "printBw";
}

function normalizeAppearance(appearance: AppearanceSettings): AppearanceSettings {
  return {
    ...appearance,
    smallGridLineWidth: clamp(Math.round(appearance.smallGridLineWidth), MIN_GRID_LINE_WIDTH, MAX_GRID_LINE_WIDTH),
    largeGridLineWidth: clamp(Math.round(appearance.largeGridLineWidth), MIN_GRID_LINE_WIDTH, MAX_GRID_LINE_WIDTH),
    mapBrightness: clamp(Math.round(appearance.mapBrightness), MIN_MAP_FILTER_PERCENT, MAX_MAP_FILTER_PERCENT),
    mapContrast: clamp(Math.round(appearance.mapContrast), MIN_MAP_FILTER_PERCENT, MAX_MAP_FILTER_PERCENT),
    mapSaturation: clamp(Math.round(appearance.mapSaturation), MIN_MAP_FILTER_PERCENT, MAX_MAP_FILTER_PERCENT),
    mapOpacity: clamp(Math.round(appearance.mapOpacity), MIN_MAP_FILTER_PERCENT, 100),
  };
}

export function normalizeSettings(settings: MapSettings): MapSettings {
  const legacySettings = settings as MapSettings & { appearanceMode?: unknown };
  const activeAppearanceMode = isAppearanceMode(settings.activeAppearanceMode)
    ? settings.activeAppearanceMode
    : isAppearanceMode(legacySettings.appearanceMode)
      ? legacySettings.appearanceMode
      : DEFAULT_SETTINGS.activeAppearanceMode;
  const appearanceByMode = {
    screen: normalizeAppearance({
      ...DEFAULT_APPEARANCE_BY_MODE.screen,
      ...settings.appearanceByMode?.screen,
      ...(activeAppearanceMode === "screen"
        ? {
            mapGrayscale: settings.mapGrayscale,
            mapBrightness: settings.mapBrightness,
            mapContrast: settings.mapContrast,
            mapSaturation: settings.mapSaturation,
            mapOpacity: settings.mapOpacity,
            smallGridColor: settings.smallGridColor,
            largeGridColor: settings.largeGridColor,
            smallGridLineWidth: settings.smallGridLineWidth,
            largeGridLineWidth: settings.largeGridLineWidth,
          }
        : {}),
    }),
    printBw: normalizeAppearance({
      ...DEFAULT_APPEARANCE_BY_MODE.printBw,
      ...settings.appearanceByMode?.printBw,
      ...(activeAppearanceMode === "printBw"
        ? {
            mapGrayscale: settings.mapGrayscale,
            mapBrightness: settings.mapBrightness,
            mapContrast: settings.mapContrast,
            mapSaturation: settings.mapSaturation,
            mapOpacity: settings.mapOpacity,
            smallGridColor: settings.smallGridColor,
            largeGridColor: settings.largeGridColor,
            smallGridLineWidth: settings.smallGridLineWidth,
            largeGridLineWidth: settings.largeGridLineWidth,
          }
        : {}),
    }),
  };
  const normalized = {
    ...settings,
    activeAppearanceMode,
    appearanceByMode,
    // High/Ultra disabled: stitching repeats Google attribution and costs extra requests.
    resolutionMode: DEFAULT_SETTINGS.resolutionMode,
    zoom: clamp(Math.round(settings.zoom), MIN_ZOOM, MAX_ZOOM),
    scale: clamp(Math.round(settings.scale), MIN_SCALE, MAX_SCALE),
    smallGridLineWidth: clamp(Math.round(settings.smallGridLineWidth), MIN_GRID_LINE_WIDTH, MAX_GRID_LINE_WIDTH),
    largeGridLineWidth: clamp(Math.round(settings.largeGridLineWidth), MIN_GRID_LINE_WIDTH, MAX_GRID_LINE_WIDTH),
    mapBrightness: clamp(Math.round(settings.mapBrightness), MIN_MAP_FILTER_PERCENT, MAX_MAP_FILTER_PERCENT),
    mapContrast: clamp(Math.round(settings.mapContrast), MIN_MAP_FILTER_PERCENT, MAX_MAP_FILTER_PERCENT),
    mapSaturation: clamp(Math.round(settings.mapSaturation), MIN_MAP_FILTER_PERCENT, MAX_MAP_FILTER_PERCENT),
    mapOpacity: clamp(Math.round(settings.mapOpacity), MIN_MAP_FILTER_PERCENT, 100),
  };

  return applyActiveAppearance(normalized, appearanceByMode[activeAppearanceMode]);
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
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch (error) {
    console.warn("Unable to save map settings.", error);
  }
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
  try {
    localStorage.setItem(PANEL_KEY, JSON.stringify(position));
  } catch (error) {
    console.warn("Unable to save panel position.", error);
  }
}
