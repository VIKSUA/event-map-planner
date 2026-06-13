import { ToggleButton, ToggleButtonGroup, Tooltip } from "@mui/material";
import type { AppearanceMode } from "../types/map";

interface MapModeToggleProps {
  value: AppearanceMode;
  onChange: (mode: AppearanceMode) => void;
}

export function MapModeToggle({ value, onChange }: MapModeToggleProps) {
  return (
    <ToggleButtonGroup
      exclusive
      size="small"
      value={value}
      onChange={(_, nextValue: AppearanceMode | null) => {
        if (nextValue) {
          onChange(nextValue);
        }
      }}
      aria-label="Map appearance mode"
      sx={{
        "& .MuiToggleButton-root": {
          px: 0.75,
          py: 0.25,
          fontSize: 11,
          lineHeight: 1.2,
        },
      }}
    >
      <ToggleButton value="screen" aria-label="Screen mode">
        <Tooltip title="Normal color preview">
          <span>Screen</span>
        </Tooltip>
      </ToggleButton>
      <ToggleButton value="printBw" aria-label="Print black and white mode">
        <Tooltip title="Light grayscale print mode">
          <span>B/W Print</span>
        </Tooltip>
      </ToggleButton>
    </ToggleButtonGroup>
  );
}
