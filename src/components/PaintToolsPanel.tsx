import DeleteSweepIcon from "@mui/icons-material/DeleteSweep";
import BrushIcon from "@mui/icons-material/Brush";
import ColorizeIcon from "@mui/icons-material/Colorize";
import CropSquareIcon from "@mui/icons-material/CropSquare";
import PanToolIcon from "@mui/icons-material/PanTool";
import ShowChartIcon from "@mui/icons-material/ShowChart";
import TextFieldsIcon from "@mui/icons-material/TextFields";
import UndoIcon from "@mui/icons-material/Undo";
import { Box, Button, Checkbox, FormControlLabel, InputAdornment, Stack, TextField, ToggleButton, ToggleButtonGroup, Tooltip, Typography } from "@mui/material";
import type { DrawingLayer, MapSettings, PaintMode } from "../types/map";
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
  const undo = () => update("annotations", settings.annotations.slice(0, -1));
  const clear = () => {
    if (settings.annotations.length > 0 && window.confirm("Clear all drawings?")) {
      update("annotations", []);
    }
  };
  const tools: { mode: PaintMode; title: string; icon: typeof PanToolIcon }[] = [
    { mode: "pan", title: "Pan", icon: PanToolIcon },
    { mode: "pick", title: "Pick color", icon: ColorizeIcon },
    { mode: "brush", title: "Brush", icon: BrushIcon },
    { mode: "line", title: "Line", icon: ShowChartIcon },
    { mode: "rect", title: "Rectangle", icon: CropSquareIcon },
    { mode: "text", title: "Text", icon: TextFieldsIcon },
  ];

  return (
    <Box
      sx={{
        border: "1px solid rgba(148, 163, 184, 0.6)",
        borderRadius: 2,
        backgroundColor: "rgba(255, 255, 255, 0.96)",
        boxShadow: "0 20px 70px rgba(15, 23, 42, 0.24)",
        backdropFilter: "blur(14px)",
        color: "text.primary",
        p: 1,
      }}
    >
      <Stack spacing={1}>
        <Stack direction="row" spacing={0.75} sx={{ alignItems: "center" }}>
          <BrushIcon fontSize="small" />
          <Typography component="strong" sx={{ fontSize: 13 }}>
            Paint tools
          </Typography>
        </Stack>
        <FormControlLabel
          sx={{ m: 0 }}
          control={<Checkbox size="small" checked={settings.showDrawings} onChange={(event) => update("showDrawings", event.target.checked)} />}
          label="Show drawings"
        />
        <ToggleButtonGroup
          exclusive
          size="small"
          value={settings.paintMode}
          onChange={(_, value: PaintMode | null) => {
            if (value) {
              setMode(value);
            }
          }}
          fullWidth
          aria-label="Annotation tool"
          sx={{ "& .MuiToggleButton-root": { px: 0.75, py: 0.35 } }}
        >
          {tools.map(({ icon: Icon, mode, title }) => (
            <ToggleButton key={mode} value={mode} aria-label={title}>
              <Tooltip title={title}>
                <Icon fontSize="small" />
              </Tooltip>
            </ToggleButton>
          ))}
        </ToggleButtonGroup>
        <Stack direction="row" spacing={0.75} sx={{ alignItems: "center" }}>
          <Typography sx={{ color: "text.secondary", fontSize: 12 }}>Layer</Typography>
          <ToggleButtonGroup
            exclusive
            size="small"
            value={settings.drawingLayer}
            onChange={(_, value: DrawingLayer | null) => {
              if (value) {
                update("drawingLayer", value);
              }
            }}
            aria-label="Drawing layer order"
            sx={{ "& .MuiToggleButton-root": { px: 1, py: 0.25, fontSize: 11 } }}
          >
            <ToggleButton value="belowGrid">
              <Tooltip title="Choose whether drawings are rendered below or above the grid.">
                <span>Below</span>
              </Tooltip>
            </ToggleButton>
            <ToggleButton value="aboveGrid">
              <Tooltip title="Choose whether drawings are rendered below or above the grid.">
                <span>Above</span>
              </Tooltip>
            </ToggleButton>
          </ToggleButtonGroup>
        </Stack>
        <TextField
          label="Color"
          type="color"
          size="small"
          value={settings.paintColor}
          onChange={(event) => update("paintColor", event.target.value)}
          sx={{ maxWidth: 130 }}
          slotProps={{ inputLabel: { shrink: true }, htmlInput: { style: { height: 32, padding: 4 } } }}
        />
        <TextField
          label="Size"
          type="number"
          size="small"
          value={settings.paintBrushRadius}
          onChange={(event) =>
            update("paintBrushRadius", clamp(Math.round(numericValue(event.target.value, settings.paintBrushRadius)), MIN_PAINT_BRUSH_RADIUS, MAX_PAINT_BRUSH_RADIUS))
          }
          fullWidth
          slotProps={{
            htmlInput: { min: MIN_PAINT_BRUSH_RADIUS, max: MAX_PAINT_BRUSH_RADIUS, step: 1 },
            input: { endAdornment: <InputAdornment position="end">px</InputAdornment> },
          }}
        />
        <TextField
          label="Sample"
          type="number"
          size="small"
          value={settings.paintSampleSize}
          onChange={(event) =>
            update("paintSampleSize", clamp(Math.round(numericValue(event.target.value, settings.paintSampleSize)), MIN_PAINT_SAMPLE_SIZE, MAX_PAINT_SAMPLE_SIZE))
          }
          fullWidth
          slotProps={{
            htmlInput: { min: MIN_PAINT_SAMPLE_SIZE, max: MAX_PAINT_SAMPLE_SIZE, step: 1 },
            input: { endAdornment: <InputAdornment position="end">px</InputAdornment> },
          }}
        />
        <Stack direction="row" spacing={0.75}>
          <Button size="small" variant="outlined" startIcon={<UndoIcon />} onClick={undo} disabled={settings.annotations.length === 0}>
            Undo
          </Button>
          <Button size="small" variant="outlined" color="error" startIcon={<DeleteSweepIcon />} onClick={clear} disabled={settings.annotations.length === 0}>
            Clear
          </Button>
        </Stack>
      </Stack>
    </Box>
  );
}
