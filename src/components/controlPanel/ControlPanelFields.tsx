import type { ElementType, ReactNode } from "react";
import { Box, FormControl, IconButton, InputAdornment, InputLabel, MenuItem, Select, Stack, TextField, Tooltip, Typography } from "@mui/material";
import type { SelectChangeEvent } from "@mui/material/Select";

export const COMPACT_ICON_SIZE = 30;

export function Section({ title, action, children }: { title: string; action?: ReactNode; children: ReactNode }) {
  return (
    <Box
      component="section"
      sx={{
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        gap: 0.75,
        px: 0.75,
        py: 0.75,
        borderTop: "1px solid",
        borderColor: "divider",
      }}
    >
      <Stack direction="row" sx={{ gridColumn: "1 / -1", alignItems: "center", justifyContent: "space-between", minHeight: 30 }}>
        <Typography component="h3" sx={{ fontSize: 11, fontWeight: 700, color: "text.secondary", textTransform: "uppercase", letterSpacing: 0.4 }}>
          {title}
        </Typography>
        {action}
      </Stack>
      {children}
    </Box>
  );
}

export function FieldRow({ children }: { children: ReactNode }) {
  return (
    <Stack direction="row" spacing={0.5} sx={{ gridColumn: "1 / -1", alignItems: "center" }}>
      {children}
    </Stack>
  );
}

export function ViewControlRow({ field, children }: { field: ReactNode; children: ReactNode }) {
  return (
    <Box sx={{ gridColumn: "1 / -1", display: "grid", gridTemplateColumns: "minmax(0, 1fr) auto", gap: 0.5, alignItems: "start" }}>
      {field}
      <Stack direction="row" spacing={0.5} sx={{ alignItems: "center", pt: 0.5 }}>
        {children}
      </Stack>
    </Box>
  );
}

export function CompactNumberField({
  label,
  value,
  onChange,
  min,
  max,
  step,
  helperText,
  disabled,
  endAdornment,
}: {
  label: string;
  value: number;
  onChange: (value: string) => void;
  min?: number;
  max?: number;
  step?: number;
  helperText?: string;
  disabled?: boolean;
  endAdornment?: string;
}) {
  return (
    <TextField
      label={label}
      type="number"
      size="small"
      value={value}
      onChange={(event) => onChange(event.target.value)}
      helperText={helperText}
      disabled={disabled}
      fullWidth
      slotProps={{
        htmlInput: { min, max, step },
        input: endAdornment ? { endAdornment: <InputAdornment position="end">{endAdornment}</InputAdornment> } : undefined,
      }}
    />
  );
}

export function CompactTextField({
  label,
  value,
  onChange,
  type = "text",
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  placeholder?: string;
}) {
  return (
    <TextField
      label={label}
      type={type}
      size="small"
      value={value}
      onChange={(event) => onChange(event.target.value)}
      placeholder={placeholder}
      fullWidth
      autoComplete="off"
    />
  );
}

export function CompactSelectField<T extends string>({
  label,
  value,
  options,
  onChange,
  disabled,
}: {
  label: string;
  value: T;
  options: { value: T; label: string }[];
  onChange: (value: T) => void;
  disabled?: boolean;
}) {
  return (
    <FormControl size="small" fullWidth disabled={disabled}>
      <InputLabel>{label}</InputLabel>
      <Select value={value} label={label} onChange={(event: SelectChangeEvent) => onChange(event.target.value as T)}>
        {options.map((option) => (
          <MenuItem key={option.value} value={option.value}>
            {option.label}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
}

export function CompactColorField({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <TextField
      label={label}
      type="color"
      size="small"
      value={value}
      onChange={(event) => onChange(event.target.value)}
      fullWidth
      slotProps={{ inputLabel: { shrink: true }, htmlInput: { style: { height: 28, padding: 4 } } }}
    />
  );
}

export function IconActionButton({
  title,
  icon: Icon,
  onClick,
  disabled,
  active,
}: {
  title: string;
  icon: ElementType;
  onClick: () => void;
  disabled?: boolean;
  active?: boolean;
}) {
  return (
    <Tooltip title={title}>
      <span>
        <IconButton
          aria-label={title}
          size="small"
          onClick={onClick}
          disabled={disabled}
          sx={{
            width: COMPACT_ICON_SIZE,
            height: COMPACT_ICON_SIZE,
            flex: "0 0 auto",
            color: active ? "primary.main" : undefined,
            backgroundColor: active ? "rgba(37, 99, 235, 0.08)" : undefined,
          }}
        >
          <Icon fontSize="small" />
        </IconButton>
      </span>
    </Tooltip>
  );
}
