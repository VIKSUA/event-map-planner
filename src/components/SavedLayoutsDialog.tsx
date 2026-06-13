import CloseIcon from "@mui/icons-material/Close";
import { AppBar, Box, Dialog, DialogContent, IconButton, Toolbar, Typography } from "@mui/material";
import type { SavedLayout } from "../lib/savedLayouts";
import { SavedLayoutListItem } from "./SavedLayoutListItem";

function formatUsage(bytes: number): string {
  if (bytes < 1024) {
    return `${bytes} B`;
  }

  return `${(bytes / 1024).toFixed(1)} KB`;
}

export function SavedLayoutsDialog({
  apiKey,
  googleRequestCount,
  layouts,
  onClose,
  onDelete,
  onLoad,
  onThumbnailRequestStart,
  open,
  storageUsageBytes,
}: {
  apiKey: string;
  googleRequestCount: number;
  layouts: SavedLayout[];
  onClose: () => void;
  onDelete: (id: string) => void;
  onLoad: (layout: SavedLayout) => void;
  onThumbnailRequestStart: () => void;
  open: boolean;
  storageUsageBytes: number;
}) {
  return (
    <Dialog fullScreen open={open} onClose={onClose}>
      <AppBar color="default" elevation={0} sx={{ position: "relative", borderBottom: "1px solid", borderColor: "divider" }}>
        <Toolbar>
          <Typography component="h2" sx={{ flex: 1, fontWeight: 700 }}>
            Saved maps
          </Typography>
          <Typography sx={{ mr: 2, color: "text.secondary", fontSize: 13 }}>
            Storage: {formatUsage(storageUsageBytes)} · Google API: {googleRequestCount} {googleRequestCount === 1 ? "request" : "requests"}
          </Typography>
          <IconButton edge="end" aria-label="Close saved maps" onClick={onClose}>
            <CloseIcon />
          </IconButton>
        </Toolbar>
      </AppBar>
      <DialogContent sx={{ backgroundColor: "#f8fafc", p: { xs: 1.5, md: 2 } }}>
        {layouts.length === 0 ? (
          <Box sx={{ minHeight: "60vh", display: "grid", placeItems: "center", color: "text.secondary" }}>
            <Typography>No saved maps yet.</Typography>
          </Box>
        ) : (
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", lg: "repeat(2, minmax(0, 1fr))" },
              gap: { xs: 1.5, md: 2 },
              width: "100%",
            }}
          >
            {layouts.map((layout) => (
              <SavedLayoutListItem
                key={layout.id}
                apiKey={apiKey}
                layout={layout}
                onDelete={onDelete}
                onLoad={onLoad}
                onThumbnailRequestStart={onThumbnailRequestStart}
              />
            ))}
          </Box>
        )}
      </DialogContent>
    </Dialog>
  );
}
