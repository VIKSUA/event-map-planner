import DeleteIcon from "@mui/icons-material/Delete";
import { Box, Button, Card, CardContent, IconButton, Stack, Tooltip, Typography } from "@mui/material";
import type { SavedLayout } from "../lib/savedLayouts";
import { SavedLayoutThumbnail } from "./SavedLayoutThumbnail";

function formatDate(value: string): string {
  return new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}

export function SavedLayoutListItem({
  layout,
  onDelete,
  onLoad,
}: {
  layout: SavedLayout;
  onDelete: (id: string) => void;
  onLoad: (layout: SavedLayout) => void;
}) {
  const settings = layout.settings;
  const modeLabel = settings.activeAppearanceMode === "printBw" ? "B/W" : "Screen";

  return (
    <Card variant="outlined" sx={{ height: "100%" }}>
      <CardContent sx={{ p: 1.25, "&:last-child": { pb: 1.25 } }}>
        <Stack direction={{ xs: "column", sm: "row" }} spacing={1.25} sx={{ height: "100%", alignItems: { xs: "stretch", sm: "center" } }}>
          <SavedLayoutThumbnail layout={layout} />
          <Box sx={{ minWidth: 0, flex: 1 }}>
            <Typography component="h3" sx={{ fontWeight: 700, fontSize: 15, lineHeight: 1.25 }}>
              {layout.name}
            </Typography>
            <Typography sx={{ color: "text.secondary", fontSize: 12.5 }}>Saved {formatDate(layout.updatedAt)}</Typography>
            <Typography sx={{ mt: 0.5, color: "text.secondary", fontSize: 12.5, lineHeight: 1.35 }}>
              {settings.latitude.toFixed(6)}, {settings.longitude.toFixed(6)} · z{Math.round(settings.zoom)} · scale {Math.round(settings.scale)}% · rot{" "}
              {Math.round(settings.rotation)}° · {settings.format} {settings.format === "square" ? "" : settings.orientation} · {modeLabel}
            </Typography>
          </Box>
          <Stack
            direction={{ xs: "row", sm: "column" }}
            spacing={0.75}
            sx={{ flex: "0 0 auto", alignItems: "center", justifyContent: { xs: "flex-end", sm: "center" } }}
          >
            <Button variant="contained" size="small" onClick={() => onLoad(layout)}>
              Load
            </Button>
            <Tooltip title="Delete saved map">
              <IconButton aria-label="Delete saved map" size="small" color="error" onClick={() => onDelete(layout.id)}>
                <DeleteIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Stack>
        </Stack>
      </CardContent>
    </Card>
  );
}
