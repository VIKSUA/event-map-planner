import AddIcon from "@mui/icons-material/Add";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import ArrowDownwardIcon from "@mui/icons-material/ArrowDownward";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import ArrowUpwardIcon from "@mui/icons-material/ArrowUpward";
import DownloadIcon from "@mui/icons-material/Download";
import LockIcon from "@mui/icons-material/Lock";
import LockOpenIcon from "@mui/icons-material/LockOpen";
import PrintIcon from "@mui/icons-material/Print";
import RefreshIcon from "@mui/icons-material/Refresh";
import RestartAltIcon from "@mui/icons-material/RestartAlt";
import RemoveIcon from "@mui/icons-material/Remove";
import RotateLeftIcon from "@mui/icons-material/RotateLeft";
import RotateRightIcon from "@mui/icons-material/RotateRight";
import { Button, Checkbox, FormControlLabel, Stack, Typography } from "@mui/material";
import type { MapSettings, Orientation, PageFormat, ResolutionMode, Unit } from "../../types/map";
import { MAX_GRID_LINE_WIDTH, MAX_SCALE, MAX_ZOOM, MIN_GRID_LINE_WIDTH, MIN_SCALE, MIN_ZOOM } from "../../lib/mapConstants";
import {
  CompactColorField,
  CompactNumberField,
  CompactSelectField,
  CompactTextField,
  FieldRow,
  IconActionButton,
  Section,
  ViewControlRow,
} from "./ControlPanelFields";

interface SharedSectionProps {
  settings: MapSettings;
  update: <K extends keyof MapSettings>(key: K, value: MapSettings[K]) => void;
  numberValue: (value: string, fallback: number) => number;
}

export function ApiSourceSection({
  settings,
  update,
  requestCount,
  resetSource,
  resetRequestCount,
}: SharedSectionProps & { requestCount: number; resetSource: () => void; resetRequestCount: () => void }) {
  const requestLabel = requestCount === 1 ? "request" : "requests";

  return (
    <Section
      title={`Google API: ${requestCount} ${requestLabel}`}
      action={
        <Stack direction="row" spacing={0.25}>
          <IconActionButton title="Reset source settings" icon={RefreshIcon} onClick={resetSource} />
          <IconActionButton title="Reset request counter" icon={RestartAltIcon} onClick={resetRequestCount} />
        </Stack>
      }
    >
      <CompactTextField label="Key" type="password" value={settings.apiKey} placeholder="Local only" onChange={(value) => update("apiKey", value)} />
      <CompactSelectField<ResolutionMode>
        label="Source"
        value={settings.resolutionMode}
        onChange={(value) => update("resolutionMode", value)}
        options={[
          { value: "standard", label: "Standard" },
          { value: "high", label: "High 2x2" },
          { value: "ultra", label: "Ultra 3x3" },
        ]}
      />
      <Typography sx={{ gridColumn: "1 / -1", color: "text.secondary", fontSize: 11 }}>Standard +1, High +4, Ultra +9</Typography>
    </Section>
  );
}

export function LocationSection({
  settings,
  update,
  numberValue,
  nudge,
  resetLocation,
}: SharedSectionProps & { nudge: (direction: "left" | "right" | "up" | "down") => void; resetLocation: () => void }) {
  return (
    <Section title="Location" action={<IconActionButton title="Reset location" icon={RefreshIcon} onClick={resetLocation} />}>
      <CompactNumberField label="Lat" value={settings.latitude} step={0.000001} onChange={(value) => update("latitude", numberValue(value, settings.latitude))} />
      <CompactNumberField label="Lng" value={settings.longitude} step={0.000001} onChange={(value) => update("longitude", numberValue(value, settings.longitude))} />
      <FieldRow>
        <IconActionButton title="Move left" icon={ArrowBackIcon} onClick={() => nudge("left")} />
        <IconActionButton title="Move right" icon={ArrowForwardIcon} onClick={() => nudge("right")} />
        <IconActionButton title="Move up" icon={ArrowUpwardIcon} onClick={() => nudge("up")} />
        <IconActionButton title="Move down" icon={ArrowDownwardIcon} onClick={() => nudge("down")} />
      </FieldRow>
    </Section>
  );
}

export function ViewSection({
  settings,
  updateZoom,
  updateScale,
  updateRotation,
  resetZoomScale,
  resetRotation,
  toggleZoomScaleLock,
  numberValue,
  canZoomOut,
  canZoomIn,
  canScaleOut,
  canScaleIn,
}: {
  settings: MapSettings;
  updateZoom: (value: number) => void;
  updateScale: (value: number) => void;
  updateRotation: (value: number) => void;
  resetZoomScale: () => void;
  resetRotation: () => void;
  toggleZoomScaleLock: () => void;
  numberValue: (value: string, fallback: number) => number;
  canZoomOut: boolean;
  canZoomIn: boolean;
  canScaleOut: boolean;
  canScaleIn: boolean;
}) {
  const zoom = Math.round(settings.zoom);
  const scale = Math.round(settings.scale);
  const locked = settings.isZoomScaleLocked;
  return (
    <Section
      title="View"
      action={
        <IconActionButton
          title={locked ? "Unlock zoom and scale" : "Lock zoom and scale"}
          icon={locked ? LockIcon : LockOpenIcon}
          active={locked}
          onClick={toggleZoomScaleLock}
        />
      }
    >
      <ViewControlRow
        field={
          <CompactNumberField
            label="Zoom"
            value={zoom}
            min={MIN_ZOOM}
            max={MAX_ZOOM}
            step={1}
            helperText={`${MIN_ZOOM}-${MAX_ZOOM}`}
            disabled={locked}
            onChange={(value) => updateZoom(numberValue(value, zoom))}
          />
        }
      >
        <IconActionButton title="Zoom out" icon={RemoveIcon} disabled={locked || !canZoomOut} onClick={() => updateZoom(zoom - 1)} />
        <IconActionButton title="Zoom in" icon={AddIcon} disabled={locked || !canZoomIn} onClick={() => updateZoom(zoom + 1)} />
        <IconActionButton title="Reset zoom and scale" icon={RefreshIcon} disabled={locked} onClick={resetZoomScale} />
      </ViewControlRow>
      <ViewControlRow
        field={
          <CompactNumberField
            label="Scale"
            value={scale}
            min={MIN_SCALE}
            max={MAX_SCALE}
            step={1}
            helperText={`${MIN_SCALE}-${MAX_SCALE}%`}
            disabled={locked}
            onChange={(value) => updateScale(numberValue(value, scale))}
          />
        }
      >
        <IconActionButton title="Scale down" icon={RemoveIcon} disabled={locked || !canScaleOut} onClick={() => updateScale(scale - 5)} />
        <IconActionButton title="Scale up" icon={AddIcon} disabled={locked || !canScaleIn} onClick={() => updateScale(scale + 5)} />
        <IconActionButton title="Reset zoom and scale" icon={RefreshIcon} disabled={locked} onClick={resetZoomScale} />
      </ViewControlRow>
      <ViewControlRow field={<CompactNumberField label="Rot" value={settings.rotation} step={1} onChange={(value) => updateRotation(numberValue(value, settings.rotation))} />}>
        <IconActionButton title="Rotate left" icon={RotateLeftIcon} onClick={() => updateRotation(settings.rotation - 1)} />
        <IconActionButton title="Rotate right" icon={RotateRightIcon} onClick={() => updateRotation(settings.rotation + 1)} />
        <IconActionButton title="Reset rotation" icon={RefreshIcon} onClick={resetRotation} />
      </ViewControlRow>
    </Section>
  );
}

export function GridSection({ settings, update, numberValue, resetGrid }: SharedSectionProps & { resetGrid: () => void }) {
  const smallValue = settings.unit === "meters" ? settings.smallGridMeters : settings.smallGridFeet;
  const largeValue = settings.unit === "meters" ? settings.largeGridMeters : settings.largeGridFeet;
  const smallKey = settings.unit === "meters" ? "smallGridMeters" : "smallGridFeet";
  const largeKey = settings.unit === "meters" ? "largeGridMeters" : "largeGridFeet";

  return (
    <Section title="Grid" action={<IconActionButton title="Reset grid" icon={RefreshIcon} onClick={resetGrid} />}>
      <CompactSelectField<Unit>
        label="Unit"
        value={settings.unit}
        onChange={(value) => update("unit", value)}
        options={[
          { value: "meters", label: "m" },
          { value: "feet", label: "ft" },
        ]}
      />
      <FormControlLabel
        sx={{ m: 0, alignSelf: "center" }}
        control={<Checkbox size="small" checked={settings.showGrid} onChange={(event) => update("showGrid", event.target.checked)} />}
        label="Show"
      />
      <CompactNumberField label="Small" value={smallValue} min={settings.unit === "meters" ? 0.1 : 1} step={settings.unit === "meters" ? 0.1 : 1} onChange={(value) => update(smallKey, numberValue(value, smallValue))} />
      <CompactNumberField label="Large" value={largeValue} min={settings.unit === "meters" ? 0.1 : 1} step={settings.unit === "meters" ? 0.1 : 1} onChange={(value) => update(largeKey, numberValue(value, largeValue))} />
      <CompactNumberField label="Offset X" value={settings.gridOffsetX} step={1} onChange={(value) => update("gridOffsetX", numberValue(value, settings.gridOffsetX))} />
      <CompactNumberField label="Offset Y" value={settings.gridOffsetY} step={1} onChange={(value) => update("gridOffsetY", numberValue(value, settings.gridOffsetY))} />
      <CompactColorField label="Small color" value={settings.smallGridColor} onChange={(value) => update("smallGridColor", value)} />
      <CompactColorField label="Large color" value={settings.largeGridColor} onChange={(value) => update("largeGridColor", value)} />
      <CompactNumberField label="Small px" value={settings.smallGridLineWidth} min={MIN_GRID_LINE_WIDTH} max={MAX_GRID_LINE_WIDTH} step={1} onChange={(value) => update("smallGridLineWidth", numberValue(value, settings.smallGridLineWidth))} />
      <CompactNumberField label="Large px" value={settings.largeGridLineWidth} min={MIN_GRID_LINE_WIDTH} max={MAX_GRID_LINE_WIDTH} step={1} onChange={(value) => update("largeGridLineWidth", numberValue(value, settings.largeGridLineWidth))} />
      <CompactNumberField label="Opacity" value={settings.mapOpacity} min={0} max={100} step={1} onChange={(value) => update("mapOpacity", numberValue(value, settings.mapOpacity))} />
    </Section>
  );
}

export function ExportSection({
  settings,
  update,
  numberValue,
  applyPrintPreset,
  onDownload,
  onPrint,
  onReset,
  busy,
}: SharedSectionProps & {
  applyPrintPreset: () => void;
  onDownload: () => void;
  onPrint: () => void;
  onReset: () => void;
  busy: boolean;
}) {
  return (
    <Section title="Export">
      <CompactSelectField<PageFormat>
        label="Format"
        value={settings.format}
        onChange={(value) => update("format", value)}
        options={[
          { value: "square", label: "Square" },
          { value: "letter", label: "Letter" },
          { value: "a4", label: "A4" },
        ]}
      />
      <CompactSelectField<Orientation>
        label="Orient"
        value={settings.orientation}
        disabled={settings.format === "square"}
        onChange={(value) => update("orientation", value)}
        options={[
          { value: "portrait", label: "Portrait" },
          { value: "landscape", label: "Landscape" },
        ]}
      />
      <CompactNumberField label="Width" value={settings.exportWidth} min={640} step={10} onChange={(value) => update("exportWidth", numberValue(value, settings.exportWidth))} />
      <Stack direction="row" spacing={0.5} sx={{ alignSelf: "center" }}>
        <Button size="small" variant="outlined" onClick={() => update("exportWidth", 2000)}>
          2K
        </Button>
        <Button size="small" variant="outlined" onClick={() => update("exportWidth", 3840)}>
          4K
        </Button>
        <Button size="small" variant="outlined" onClick={applyPrintPreset} disabled={settings.format === "square"}>
          DPI
        </Button>
      </Stack>
      <Stack direction="row" spacing={0.75} sx={{ gridColumn: "1 / -1" }}>
        <Button size="small" variant="contained" startIcon={<DownloadIcon />} onClick={onDownload} disabled={busy}>
          PNG
        </Button>
        <Button size="small" variant="contained" startIcon={<PrintIcon />} onClick={onPrint} disabled={busy}>
          Print
        </Button>
        <IconActionButton title="Reset all settings" icon={RefreshIcon} onClick={onReset} />
      </Stack>
    </Section>
  );
}
