import type { MapSettings, PanelPosition } from "../types/map";
import { DEFAULT_SETTINGS } from "./mapMath";

const SETTINGS_KEY = "map-background-exporter.settings";
const PANEL_KEY = "map-background-exporter.panel";

export function loadSettings(): MapSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) {
      return DEFAULT_SETTINGS;
    }

    return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) } as MapSettings;
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
