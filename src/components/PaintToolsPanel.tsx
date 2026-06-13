import DeleteSweepIcon from "@mui/icons-material/DeleteSweep";
import UndoIcon from "@mui/icons-material/Undo";
import { Box, Button, ButtonGroup, Stack, TextField, Typography } from "@mui/material";
import type { MapSettings, PaintMode } from "../types/map";
import { MAX_PAINT_BRUSH_RADIUS, MAX_PAINT_SAMPLE_SIZE, MIN_PAINT_BRUSH_RADIUS, MIN_PAINT_SAMPLE_SIZE } from "../lib/mapConstants";

function numericValue(value: string, fallback: number): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function PaintToolsPanel({ settings, onChange }: { settings: MapSettings; onChange: (settings: MapSettings) => void }) {
  const update = <K extends keyof MapSettings>(key: K, value: MapSettings[K]) => onChange({ ...settings, [key]: value });
  const setMode = (paintMode: PaintMode) => update("paintMode", paintMode);
  const undo = () => update("paintStrokes", settings.paintStrokes.slice(0, -1));
  const clear = () => update("paintStrokes", []);

  return (
    <Box className="status" sx={{ backgroundColor: "rgba(15, 23, 42, 0.9)" }}>
      <Stack spacing={1}>
        <Typography component="strong" sx={{ fontSize: 13 }}>
          Paint tools
        </Typography>
        <ButtonGroup size="small" variant="outlined" fullWidth>
          {(["off", "pick", "brush"] as PaintMode[]).map((mode) => (
            <Button key={mode} variant={settings.paintMode === mode ? "contained" : "outlined"} onClick={() => setMode(mode)}>
              {mode === "off" ? "Off" : mode === "pick" ? "Pick" : "Brush"}
            </Button>
          ))}
        </ButtonGroup>
        <TextField
          label="Color"
          type="color"
          size="small"
          value={settings.paintColor}
          onChange={(event) => update("paintColor", event.target.value)}
          fullWidth
          slotProps={{ inputLabel: { shrink: true }, htmlInput: { style: { height: 32, padding: 4 } } }}
        />
        <TextField
          label="Brush radius"
          type="number"
          size="small"
          value={settings.paintBrushRadius}
          onChange={(event) =>
            update("paintBrushRadius", clamp(Math.round(numericValue(event.target.value, settings.paintBrushRadius)), MIN_PAINT_BRUSH_RADIUS, MAX_PAINT_BRUSH_RADIUS))
          }
          fullWidth
          slotProps={{ htmlInput: { min: MIN_PAINT_BRUSH_RADIUS, max: MAX_PAINT_BRUSH_RADIUS, step: 1 } }}
        />
        <TextField
          label="Pick sample"
          type="number"
          size="small"
          value={settings.paintSampleSize}
          onChange={(event) =>
            update("paintSampleSize", clamp(Math.round(numericValue(event.target.value, settings.paintSampleSize)), MIN_PAINT_SAMPLE_SIZE, MAX_PAINT_SAMPLE_SIZE))
          }
          fullWidth
          slotProps={{ htmlInput: { min: MIN_PAINT_SAMPLE_SIZE, max: MAX_PAINT_SAMPLE_SIZE, step: 1 } }}
        />
        <Stack direction="row" spacing={0.75}>
          <Button size="small" variant="outlined" startIcon={<UndoIcon />} onClick={undo} disabled={settings.paintStrokes.length === 0}>
            Undo
          </Button>
          <Button size="small" variant="outlined" color="error" startIcon={<DeleteSweepIcon />} onClick={clear} disabled={settings.paintStrokes.length === 0}>
            Clear
          </Button>
        </Stack>
      </Stack>
    </Box>
  );
}
