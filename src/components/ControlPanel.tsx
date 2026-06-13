import { useState } from "react";
import { Alert, Box, Snackbar, Stack, Typography } from "@mui/material";
import type { AppearanceSettings, MapSettings } from "../types/map";
import { getDefaultAppearanceForMode, resetAppearanceMode, updateActiveAppearance } from "../lib/appearancePresets";
import {
  SavedLayoutsLimitError,
  createSettingsFromSavedLayout,
  deleteSavedLayout,
  getSavedLayoutsStorageUsage,
  isQuotaExceededError,
  loadSavedLayouts,
  saveCurrentLayout,
  type SavedLayout,
} from "../lib/savedLayouts";
import {
  DEFAULT_GRID_OFFSET_X,
  DEFAULT_GRID_OFFSET_Y,
  DEFAULT_LARGE_GRID_FEET,
  DEFAULT_LARGE_GRID_METERS,
  DEFAULT_LATITUDE,
  DEFAULT_LONGITUDE,
  DEFAULT_MOVE_STEP_METERS,
  DEFAULT_RESOLUTION_MODE,
  DEFAULT_ROTATION,
  DEFAULT_SCALE,
  DEFAULT_SHOW_GRID,
  DEFAULT_SMALL_GRID_FEET,
  DEFAULT_SMALL_GRID_METERS,
  DEFAULT_UNIT,
  DEFAULT_ZOOM,
  MAX_SCALE,
  MAX_ZOOM,
  MIN_SCALE,
  MIN_ZOOM,
} from "../lib/mapConstants";
import { getPrintSize, moveByMeters } from "../lib/mapMath";
import { SavedLayoutsDialog } from "./SavedLayoutsDialog";
import { ApiSourceSection, AppearanceSection, ExportSection, GridSection, LocationSection, StickyActionFooter, ViewSection } from "./controlPanel/ControlPanelSections";

interface ControlPanelProps {
  settings: MapSettings;
  onChange: (settings: MapSettings) => void;
  onDownload: () => void;
  onPrint: () => void;
  onReset: () => void;
  requestCount: number;
  onResetRequestCount: () => void;
  busy: boolean;
}

function numericValue(value: string, fallback: number): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function clampZoom(value: number): number {
  return clamp(Math.round(value), MIN_ZOOM, MAX_ZOOM);
}

function clampScale(value: number): number {
  return clamp(Math.round(value), MIN_SCALE, MAX_SCALE);
}

const APPEARANCE_KEYS: ReadonlySet<keyof AppearanceSettings> = new Set([
  "mapGrayscale",
  "mapBrightness",
  "mapContrast",
  "mapSaturation",
  "mapOpacity",
  "smallGridColor",
  "largeGridColor",
  "smallGridLineWidth",
  "largeGridLineWidth",
]);

function isAppearanceKey(key: keyof MapSettings): key is keyof AppearanceSettings {
  return APPEARANCE_KEYS.has(key as keyof AppearanceSettings);
}

export function ControlPanel({ settings, onChange, onDownload, onPrint, onReset, requestCount, onResetRequestCount, busy }: ControlPanelProps) {
  const [savedLayoutsOpen, setSavedLayoutsOpen] = useState(false);
  const [savedLayouts, setSavedLayouts] = useState<SavedLayout[]>(() => loadSavedLayouts());
  const [savedLayoutsStorageUsage, setSavedLayoutsStorageUsage] = useState(() => getSavedLayoutsStorageUsage());
  const [message, setMessage] = useState<{ text: string; severity: "success" | "error" } | null>(null);

  const refreshSavedLayouts = () => {
    setSavedLayouts(loadSavedLayouts());
    setSavedLayoutsStorageUsage(getSavedLayoutsStorageUsage());
  };

  const update = <K extends keyof MapSettings>(key: K, value: MapSettings[K]) => {
    if (isAppearanceKey(key)) {
      onChange(updateActiveAppearance(settings, key, value as AppearanceSettings[typeof key]));
      return;
    }

    onChange({ ...settings, [key]: value });
  };
  const zoom = clampZoom(settings.zoom);
  const scale = clampScale(settings.scale);
  const zoomScaleLocked = settings.isZoomScaleLocked;
  const canZoomOut = !zoomScaleLocked && zoom > MIN_ZOOM;
  const canZoomIn = !zoomScaleLocked && zoom < MAX_ZOOM;
  const canScaleOut = !zoomScaleLocked && scale > MIN_SCALE;
  const canScaleIn = !zoomScaleLocked && scale < MAX_SCALE;

  const nudge = (direction: "left" | "right" | "up" | "down") => {
    const next = moveByMeters(settings.latitude, settings.longitude, direction, DEFAULT_MOVE_STEP_METERS, settings.rotation);
    onChange({
      ...settings,
      latitude: Number(next.latitude.toFixed(7)),
      longitude: Number(next.longitude.toFixed(7)),
    });
  };

  const applyPrintPreset = () => {
    const printSize = getPrintSize(settings.format, settings.orientation);
    if (printSize) {
      update("exportWidth", printSize.width);
    }
  };

  const updateZoom = (value: number) => {
    if (!zoomScaleLocked) {
      update("zoom", clampZoom(value));
    }
  };
  const updateScale = (value: number) => {
    if (!zoomScaleLocked) {
      update("scale", clampScale(value));
    }
  };
  const updateRotation = (value: number) => update("rotation", Math.round(value));
  const resetZoomScale = () => {
    if (!zoomScaleLocked) {
      onChange({ ...settings, zoom: DEFAULT_ZOOM, scale: DEFAULT_SCALE });
    }
  };
  const resetRotation = () => update("rotation", DEFAULT_ROTATION);
  const toggleZoomScaleLock = () => update("isZoomScaleLocked", !settings.isZoomScaleLocked);
  const resetSource = () => update("resolutionMode", DEFAULT_RESOLUTION_MODE);
  const resetLocation = () => onChange({ ...settings, latitude: DEFAULT_LATITUDE, longitude: DEFAULT_LONGITUDE });
  const resetAppearance = () => onChange(resetAppearanceMode(settings));
  const resetGrid = () => {
    const defaultAppearance = getDefaultAppearanceForMode(settings.activeAppearanceMode);

    onChange(
      updateActiveAppearance(
        updateActiveAppearance(
          updateActiveAppearance(
            updateActiveAppearance(
              {
                ...settings,
                unit: DEFAULT_UNIT,
                smallGridMeters: DEFAULT_SMALL_GRID_METERS,
                largeGridMeters: DEFAULT_LARGE_GRID_METERS,
                smallGridFeet: DEFAULT_SMALL_GRID_FEET,
                largeGridFeet: DEFAULT_LARGE_GRID_FEET,
                gridOffsetX: DEFAULT_GRID_OFFSET_X,
                gridOffsetY: DEFAULT_GRID_OFFSET_Y,
                showGrid: DEFAULT_SHOW_GRID,
              },
              "smallGridColor",
              defaultAppearance.smallGridColor,
            ),
            "largeGridColor",
            defaultAppearance.largeGridColor,
          ),
          "smallGridLineWidth",
          defaultAppearance.smallGridLineWidth,
        ),
        "largeGridLineWidth",
        defaultAppearance.largeGridLineWidth,
      ),
    );
  };
  const handleSaveLayout = () => {
    try {
      saveCurrentLayout(settings);
      refreshSavedLayouts();
      setMessage({ text: "Saved", severity: "success" });
    } catch (error) {
      const text =
        error instanceof SavedLayoutsLimitError
          ? error.message
          : isQuotaExceededError(error)
            ? "Not enough browser storage. Delete old saved layouts."
            : "Unable to save map layout.";
      setMessage({ text, severity: "error" });
    }
  };
  const handleOpenSavedLayouts = () => {
    refreshSavedLayouts();
    setSavedLayoutsOpen(true);
  };
  const handleDeleteSavedLayout = (id: string) => {
    if (!window.confirm("Delete this saved map?")) {
      return;
    }

    try {
      setSavedLayouts(deleteSavedLayout(id));
      setSavedLayoutsStorageUsage(getSavedLayoutsStorageUsage());
      setMessage({ text: "Deleted", severity: "success" });
    } catch (error) {
      const text = isQuotaExceededError(error) ? "Not enough browser storage. Delete old saved layouts." : "Unable to delete saved map.";
      setMessage({ text, severity: "error" });
    }
  };
  const handleLoadSavedLayout = (layout: SavedLayout) => {
    onChange(createSettingsFromSavedLayout(layout, settings.apiKey));
    setSavedLayoutsOpen(false);
    setMessage({ text: "Loaded", severity: "success" });
  };

  return (
    <Box component="form" onSubmit={(event) => event.preventDefault()}>
      <Stack spacing={0}>
        <Typography sx={{ px: 1, pb: 0.5, fontSize: 12, color: "text.secondary" }}>Export controls</Typography>
        <ApiSourceSection
          settings={settings}
          update={update}
          numberValue={numericValue}
          requestCount={requestCount}
          resetSource={resetSource}
          resetRequestCount={onResetRequestCount}
        />
        <LocationSection settings={settings} update={update} numberValue={numericValue} nudge={nudge} resetLocation={resetLocation} />
        <ViewSection
          settings={{ ...settings, zoom, scale }}
          updateZoom={updateZoom}
          updateScale={updateScale}
          updateRotation={updateRotation}
          resetZoomScale={resetZoomScale}
          resetRotation={resetRotation}
          toggleZoomScaleLock={toggleZoomScaleLock}
          numberValue={numericValue}
          canZoomOut={canZoomOut}
          canZoomIn={canZoomIn}
          canScaleOut={canScaleOut}
          canScaleIn={canScaleIn}
        />
        <AppearanceSection settings={settings} update={update} numberValue={numericValue} resetAppearance={resetAppearance} />
        <GridSection settings={settings} update={update} numberValue={numericValue} resetGrid={resetGrid} />
        <ExportSection
          settings={settings}
          update={update}
          numberValue={numericValue}
          applyPrintPreset={applyPrintPreset}
        />
        <StickyActionFooter
          onLoadSaved={handleOpenSavedLayouts}
          onDownload={onDownload}
          onPrint={onPrint}
          onReset={onReset}
          onSave={handleSaveLayout}
          busy={busy}
        />
      </Stack>
      <SavedLayoutsDialog
        layouts={savedLayouts}
        onClose={() => setSavedLayoutsOpen(false)}
        onDelete={handleDeleteSavedLayout}
        onLoad={handleLoadSavedLayout}
        open={savedLayoutsOpen}
        storageUsageBytes={savedLayoutsStorageUsage}
      />
      <Snackbar open={Boolean(message)} autoHideDuration={3000} onClose={() => setMessage(null)}>
        {message ? (
          <Alert severity={message.severity} variant="filled" onClose={() => setMessage(null)}>
            {message.text}
          </Alert>
        ) : undefined}
      </Snackbar>
    </Box>
  );
}
