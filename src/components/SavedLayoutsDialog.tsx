import AddIcon from "@mui/icons-material/Add";
import CloseIcon from "@mui/icons-material/Close";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import { useState } from "react";
import { AppBar, Box, Button, Dialog, DialogContent, IconButton, Stack, TextField, Toolbar, Typography } from "@mui/material";
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
  onCopyAll,
  onCopyLayout,
  onDelete,
  onImport,
  onLoad,
  onThumbnailRequestStart,
  open,
  storageUsageBytes,
}: {
  apiKey: string;
  googleRequestCount: number;
  layouts: SavedLayout[];
  onClose: () => void;
  onCopyAll: () => void;
  onCopyLayout: (layout: SavedLayout) => void;
  onDelete: (id: string) => void;
  onImport: (rawText: string) => boolean;
  onLoad: (layout: SavedLayout) => void;
  onThumbnailRequestStart: () => void;
  open: boolean;
  storageUsageBytes: number;
}) {
  const [importText, setImportText] = useState("");
  const handleImport = () => {
    if (onImport(importText)) {
      setImportText("");
    }
  };

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
          <Button size="small" variant="outlined" startIcon={<ContentCopyIcon />} onClick={onCopyAll} disabled={layouts.length === 0} sx={{ mr: 1 }}>
            Copy all
          </Button>
          <IconButton edge="end" aria-label="Close saved maps" onClick={onClose}>
            <CloseIcon />
          </IconButton>
        </Toolbar>
      </AppBar>
      <DialogContent sx={{ backgroundColor: "#f8fafc", p: { xs: 1.5, md: 2 } }}>
        <Box sx={{ mb: 2, p: 1.5, border: "1px solid", borderColor: "divider", borderRadius: 2, backgroundColor: "background.paper" }}>
          <Stack direction={{ xs: "column", md: "row" }} spacing={1} sx={{ alignItems: { xs: "stretch", md: "flex-start" } }}>
            <TextField
              label="Import saved map JSON"
              multiline
              minRows={3}
              maxRows={8}
              value={importText}
              onChange={(event) => setImportText(event.target.value)}
              placeholder="Paste a saved map object, array, or wrapper with layouts here."
              fullWidth
            />
            <Stack direction={{ xs: "row", md: "column" }} spacing={1}>
              <Button variant="contained" startIcon={<AddIcon />} onClick={handleImport}>
                Import
              </Button>
              <Button variant="outlined" onClick={() => setImportText("")} disabled={!importText}>
                Clear
              </Button>
            </Stack>
          </Stack>
        </Box>
        {layouts.length === 0 ? (
          <Box sx={{ minHeight: "60vh", display: "grid", placeItems: "center", color: "text.secondary" }}>
            <Typography>No saved maps yet. Paste JSON above or save current map.</Typography>
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
                onCopy={onCopyLayout}
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
