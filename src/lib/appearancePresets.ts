import type { AppearanceMode, MapSettings } from "../types/map";

export interface AppearancePreset {
  mode: AppearanceMode;
  mapGrayscale: boolean;
  mapBrightness: number;
  mapContrast: number;
  mapSaturation: number;
  mapOpacity: number;
  smallGridColor: string;
  largeGridColor: string;
  smallGridLineWidth: number;
  largeGridLineWidth: number;
}

export const APPEARANCE_PRESETS: Record<AppearanceMode, AppearancePreset> = {
  screen: {
    mode: "screen",
    mapGrayscale: false,
    mapBrightness: 100,
    mapContrast: 100,
    mapSaturation: 100,
    mapOpacity: 100,
    largeGridColor: "#1565C0",
    largeGridLineWidth: 2,
    smallGridColor: "#6F7F95",
    smallGridLineWidth: 1,
  },
  printBw: {
    mode: "printBw",
    mapGrayscale: true,
    mapBrightness: 140,
    mapContrast: 85,
    mapSaturation: 0,
    mapOpacity: 65,
    largeGridColor: "#555555",
    largeGridLineWidth: 2,
    smallGridColor: "#A0A0A0",
    smallGridLineWidth: 1,
  },
};

export function applyAppearancePreset(settings: MapSettings, mode: AppearanceMode): MapSettings {
  const preset = APPEARANCE_PRESETS[mode];

  return {
    ...settings,
    appearanceMode: preset.mode,
    mapGrayscale: preset.mapGrayscale,
    mapBrightness: preset.mapBrightness,
    mapContrast: preset.mapContrast,
    mapSaturation: preset.mapSaturation,
    mapOpacity: preset.mapOpacity,
    smallGridColor: preset.smallGridColor,
    largeGridColor: preset.largeGridColor,
    smallGridLineWidth: preset.smallGridLineWidth,
    largeGridLineWidth: preset.largeGridLineWidth,
  };
}
