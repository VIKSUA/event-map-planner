import CloseIcon from "@mui/icons-material/Close";
import { AppBar, Box, Dialog, DialogContent, IconButton, Stack, Toolbar, Typography } from "@mui/material";
import type { SavedLayout } from "../lib/savedLayouts";
import { SavedLayoutListItem } from "./SavedLayoutListItem";

function formatUsage(bytes: number): string {
  if (bytes < 1024) {
    return `${bytes} B`;
  }

  return `${(bytes / 1024).toFixed(1)} KB`;
}

export function SavedLayoutsDialog({
  layouts,
  onClose,
  onDelete,
  onLoad,
  open,
  storageUsageBytes,
}: {
  layouts: SavedLayout[];
  onClose: () => void;
  onDelete: (id: string) => void;
  onLoad: (layout: SavedLayout) => void;
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
          <Typography sx={{ mr: 2, color: "text.secondary", fontSize: 13 }}>Storage: {formatUsage(storageUsageBytes)}</Typography>
          <IconButton edge="end" aria-label="Close saved maps" onClick={onClose}>
            <CloseIcon />
          </IconButton>
        </Toolbar>
      </AppBar>
      <DialogContent sx={{ backgroundColor: "#f8fafc" }}>
        {layouts.length === 0 ? (
          <Box sx={{ minHeight: "60vh", display: "grid", placeItems: "center", color: "text.secondary" }}>
            <Typography>No saved maps yet.</Typography>
          </Box>
        ) : (
          <Stack spacing={1.5} sx={{ maxWidth: 1100, mx: "auto", py: 2 }}>
            {layouts.map((layout) => (
              <SavedLayoutListItem key={layout.id} layout={layout} onDelete={onDelete} onLoad={onLoad} />
            ))}
          </Stack>
        )}
      </DialogContent>
    </Dialog>
  );
}
