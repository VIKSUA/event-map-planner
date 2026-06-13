import type { AppearanceMode, AppearanceSettings, MapSettings } from "../types/map";

export const DEFAULT_APPEARANCE_BY_MODE: Record<AppearanceMode, AppearanceSettings> = {
  screen: {
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

export function getDefaultAppearanceForMode(mode: AppearanceMode): AppearanceSettings {
  return { ...DEFAULT_APPEARANCE_BY_MODE[mode] };
}

export function getActiveAppearance(settings: MapSettings): AppearanceSettings {
  return settings.appearanceByMode[settings.activeAppearanceMode];
}

export function applyActiveAppearance(settings: MapSettings, appearance: AppearanceSettings): MapSettings {
  return {
    ...settings,
    ...appearance,
  };
}

export function setAppearanceMode(settings: MapSettings, mode: AppearanceMode): MapSettings {
  return applyActiveAppearance(
    {
      ...settings,
      activeAppearanceMode: mode,
    },
    settings.appearanceByMode[mode],
  );
}

export function updateActiveAppearance<K extends keyof AppearanceSettings>(
  settings: MapSettings,
  key: K,
  value: AppearanceSettings[K],
): MapSettings {
  const mode = settings.activeAppearanceMode;
  const nextAppearance = {
    ...settings.appearanceByMode[mode],
    [key]: value,
  };

  return applyActiveAppearance(
    {
      ...settings,
      appearanceByMode: {
        ...settings.appearanceByMode,
        [mode]: nextAppearance,
      },
    },
    nextAppearance,
  );
}

export function resetAppearanceMode(settings: MapSettings): MapSettings {
  const mode = settings.activeAppearanceMode;
  const nextAppearance = getDefaultAppearanceForMode(mode);

  return applyActiveAppearance(
    {
      ...settings,
      appearanceByMode: {
        ...settings.appearanceByMode,
        [mode]: nextAppearance,
      },
    },
    nextAppearance,
  );
}
