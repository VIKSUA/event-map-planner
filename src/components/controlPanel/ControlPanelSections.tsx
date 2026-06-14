import AddIcon from "@mui/icons-material/Add";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import ArrowDownwardIcon from "@mui/icons-material/ArrowDownward";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import ArrowUpwardIcon from "@mui/icons-material/ArrowUpward";
import DownloadIcon from "@mui/icons-material/Download";
import FolderOpenIcon from "@mui/icons-material/FolderOpen";
import LockIcon from "@mui/icons-material/Lock";
import LockOpenIcon from "@mui/icons-material/LockOpen";
import PrintIcon from "@mui/icons-material/Print";
import RefreshIcon from "@mui/icons-material/Refresh";
import RestartAltIcon from "@mui/icons-material/RestartAlt";
import RemoveIcon from "@mui/icons-material/Remove";
import RotateLeftIcon from "@mui/icons-material/RotateLeft";
import RotateRightIcon from "@mui/icons-material/RotateRight";
import SaveIcon from "@mui/icons-material/Save";
import { Box, Button, Checkbox, FormControlLabel, Stack, ToggleButton, ToggleButtonGroup, Typography } from "@mui/material";
import type { MapSettings, Orientation, PageFormat, Unit } from "../../types/map";
import {
  MAX_GRID_LINE_WIDTH,
  MAX_MAP_FILTER_PERCENT,
  MAX_SCALE,
  MAX_ZOOM,
  MIN_GRID_LINE_WIDTH,
  MIN_MAP_FILTER_PERCENT,
  MIN_SCALE,
  MIN_ZOOM,
} from "../../lib/mapConstants";
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
      <Stack direction="row" spacing={0.5} sx={{ alignItems: "center" }}>
        <Typography sx={{ color: "text.secondary", fontSize: 11 }}>Labels</Typography>
        <ToggleButtonGroup
          exclusive
          size="small"
          value={settings.mapLabelsEnabled ? "on" : "off"}
          onChange={(_, value: "off" | "on" | null) => {
            if (value) {
              update("mapLabelsEnabled", value === "on");
            }
          }}
          aria-label="Map labels"
          sx={{ "& .MuiToggleButton-root": { px: 0.75, py: 0.2, fontSize: 10 } }}
        >
          <ToggleButton value="off">OFF</ToggleButton>
          <ToggleButton value="on">ON</ToggleButton>
        </ToggleButtonGroup>
      </Stack>
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
    </Section>
  );
}

export function AppearanceSection({
  settings,
  update,
  numberValue,
  resetAppearance,
}: SharedSectionProps & { resetAppearance: () => void }) {
  return (
    <Section title="Appearance" action={<IconActionButton title="Reset current appearance mode" icon={RefreshIcon} onClick={resetAppearance} />}>
      <FormControlLabel
        sx={{ m: 0, alignSelf: "center" }}
        control={<Checkbox size="small" checked={settings.mapGrayscale} onChange={(event) => update("mapGrayscale", event.target.checked)} />}
        label="B/W"
      />
      <CompactNumberField
        label="Brightness"
        value={settings.mapBrightness}
        min={MIN_MAP_FILTER_PERCENT}
        max={MAX_MAP_FILTER_PERCENT}
        step={5}
        endAdornment="%"
        onChange={(value) => update("mapBrightness", numberValue(value, settings.mapBrightness))}
      />
      <CompactNumberField
        label="Contrast"
        value={settings.mapContrast}
        min={MIN_MAP_FILTER_PERCENT}
        max={MAX_MAP_FILTER_PERCENT}
        step={5}
        endAdornment="%"
        onChange={(value) => update("mapContrast", numberValue(value, settings.mapContrast))}
      />
      <CompactNumberField
        label="Saturation"
        value={settings.mapSaturation}
        min={MIN_MAP_FILTER_PERCENT}
        max={MAX_MAP_FILTER_PERCENT}
        step={5}
        endAdornment="%"
        onChange={(value) => update("mapSaturation", numberValue(value, settings.mapSaturation))}
      />
      <CompactNumberField
        label="Opacity"
        value={settings.mapOpacity}
        min={MIN_MAP_FILTER_PERCENT}
        max={100}
        step={5}
        endAdornment="%"
        onChange={(value) => update("mapOpacity", numberValue(value, settings.mapOpacity))}
      />
    </Section>
  );
}

export function ExportSection({
  settings,
  update,
  numberValue,
  applyPrintPreset,
}: SharedSectionProps & {
  applyPrintPreset: () => void;
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
    </Section>
  );
}

export function StickyActionFooter({
  onLoadSaved,
  onDownload,
  onPrint,
  onReset,
  onSave,
  busy,
}: {
  onLoadSaved: () => void;
  onDownload: () => void;
  onPrint: () => void;
  onReset: () => void;
  onSave: () => void;
  busy: boolean;
}) {
  return (
    <Box
      sx={{
        position: "sticky",
        bottom: 0,
        zIndex: 2,
        borderTop: "1px solid",
        borderColor: "divider",
        backgroundColor: "rgba(255, 255, 255, 0.96)",
        backdropFilter: "blur(12px)",
        px: 0.75,
        py: 0.75,
      }}
    >
      <Stack direction="row" spacing={0.75}>
        <Button size="small" variant="outlined" startIcon={<SaveIcon />} onClick={onSave}>
          Save
        </Button>
        <Button size="small" variant="outlined" startIcon={<FolderOpenIcon />} onClick={onLoadSaved}>
          Load
        </Button>
        <Button size="small" variant="contained" startIcon={<DownloadIcon />} onClick={onDownload} disabled={busy}>
          PNG
        </Button>
        <Button size="small" variant="contained" startIcon={<PrintIcon />} onClick={onPrint} disabled={busy}>
          Print
        </Button>
        <IconActionButton title="Reset all settings" icon={RefreshIcon} onClick={onReset} />
      </Stack>
    </Box>
  );
}
