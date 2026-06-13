import { Box, Stack, Typography } from "@mui/material";
import type { MapSettings } from "../types/map";
import {
  DEFAULT_GRID_OFFSET_X,
  DEFAULT_GRID_OFFSET_Y,
  DEFAULT_LARGE_GRID_COLOR,
  DEFAULT_LARGE_GRID_FEET,
  DEFAULT_LARGE_GRID_LINE_WIDTH,
  DEFAULT_LARGE_GRID_METERS,
  DEFAULT_LATITUDE,
  DEFAULT_LONGITUDE,
  DEFAULT_MAP_OPACITY,
  DEFAULT_MOVE_STEP_METERS,
  DEFAULT_RESOLUTION_MODE,
  DEFAULT_ROTATION,
  DEFAULT_SCALE,
  DEFAULT_SHOW_GRID,
  DEFAULT_SMALL_GRID_COLOR,
  DEFAULT_SMALL_GRID_FEET,
  DEFAULT_SMALL_GRID_LINE_WIDTH,
  DEFAULT_SMALL_GRID_METERS,
  DEFAULT_UNIT,
  DEFAULT_ZOOM,
  MAX_SCALE,
  MAX_ZOOM,
  MIN_SCALE,
  MIN_ZOOM,
} from "../lib/mapConstants";
import { getPrintSize, moveByMeters } from "../lib/mapMath";
import { ApiSourceSection, ExportSection, GridSection, LocationSection, ViewSection } from "./controlPanel/ControlPanelSections";

interface ControlPanelProps {
  settings: MapSettings;
  onChange: (settings: MapSettings) => void;
  onDownload: () => void;
  onPrint: () => void;
  onReset: () => void;
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

export function ControlPanel({ settings, onChange, onDownload, onPrint, onReset, busy }: ControlPanelProps) {
  const update = <K extends keyof MapSettings>(key: K, value: MapSettings[K]) => {
    onChange({ ...settings, [key]: value });
  };
  const zoom = clampZoom(settings.zoom);
  const scale = clampScale(settings.scale);
  const canZoomOut = zoom > MIN_ZOOM;
  const canZoomIn = zoom < MAX_ZOOM;
  const canScaleOut = scale > MIN_SCALE;
  const canScaleIn = scale < MAX_SCALE;

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

  const updateZoom = (value: number) => update("zoom", clampZoom(value));
  const updateScale = (value: number) => update("scale", clampScale(value));
  const updateRotation = (value: number) => update("rotation", Math.round(value));
  const resetZoomScale = () => onChange({ ...settings, zoom: DEFAULT_ZOOM, scale: DEFAULT_SCALE });
  const resetRotation = () => update("rotation", DEFAULT_ROTATION);
  const resetSource = () => update("resolutionMode", DEFAULT_RESOLUTION_MODE);
  const resetLocation = () => onChange({ ...settings, latitude: DEFAULT_LATITUDE, longitude: DEFAULT_LONGITUDE });
  const resetGrid = () =>
    onChange({
      ...settings,
      unit: DEFAULT_UNIT,
      smallGridMeters: DEFAULT_SMALL_GRID_METERS,
      largeGridMeters: DEFAULT_LARGE_GRID_METERS,
      smallGridFeet: DEFAULT_SMALL_GRID_FEET,
      largeGridFeet: DEFAULT_LARGE_GRID_FEET,
      gridOffsetX: DEFAULT_GRID_OFFSET_X,
      gridOffsetY: DEFAULT_GRID_OFFSET_Y,
      smallGridColor: DEFAULT_SMALL_GRID_COLOR,
      largeGridColor: DEFAULT_LARGE_GRID_COLOR,
      smallGridLineWidth: DEFAULT_SMALL_GRID_LINE_WIDTH,
      largeGridLineWidth: DEFAULT_LARGE_GRID_LINE_WIDTH,
      mapOpacity: DEFAULT_MAP_OPACITY,
      showGrid: DEFAULT_SHOW_GRID,
    });

  return (
    <Box component="form" onSubmit={(event) => event.preventDefault()}>
      <Stack spacing={0}>
        <Typography sx={{ px: 1, pb: 0.5, fontSize: 12, color: "text.secondary" }}>Export controls</Typography>
        <ApiSourceSection settings={settings} update={update} numberValue={numericValue} resetSource={resetSource} />
        <LocationSection settings={settings} update={update} numberValue={numericValue} nudge={nudge} resetLocation={resetLocation} />
        <ViewSection
          settings={{ ...settings, zoom, scale }}
          updateZoom={updateZoom}
          updateScale={updateScale}
          updateRotation={updateRotation}
          resetZoomScale={resetZoomScale}
          resetRotation={resetRotation}
          numberValue={numericValue}
          canZoomOut={canZoomOut}
          canZoomIn={canZoomIn}
          canScaleOut={canScaleOut}
          canScaleIn={canScaleIn}
        />
        <GridSection settings={settings} update={update} numberValue={numericValue} resetGrid={resetGrid} />
        <ExportSection
          settings={settings}
          update={update}
          numberValue={numericValue}
          applyPrintPreset={applyPrintPreset}
          onDownload={onDownload}
          onPrint={onPrint}
          onReset={onReset}
          busy={busy}
        />
      </Stack>
    </Box>
  );
}
