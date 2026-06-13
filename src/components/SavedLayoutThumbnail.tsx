import { Box, Typography } from "@mui/material";
import type { SavedLayout } from "../lib/savedLayouts";
import { formatRatio } from "../lib/mapMath";

export function SavedLayoutThumbnail({ layout }: { layout: SavedLayout }) {
  const settings = layout.settings;
  const ratio = formatRatio(settings.format, settings.orientation);
  const modeLabel = settings.activeAppearanceMode === "printBw" ? "B/W" : "Screen";

  return (
    <Box
      sx={{
        width: 132,
        flex: "0 0 auto",
        border: "1px solid",
        borderColor: "divider",
        borderRadius: 1.5,
        backgroundColor: "#f8fafc",
        p: 1,
      }}
    >
      <Box
        sx={{
          position: "relative",
          width: "100%",
          aspectRatio: `${ratio} / 1`,
          minHeight: 64,
          overflow: "hidden",
          borderRadius: 1,
          backgroundColor: settings.mapGrayscale ? "#f3f4f6" : "#eff6ff",
          backgroundImage:
            "linear-gradient(rgba(100, 116, 139, 0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(100, 116, 139, 0.3) 1px, transparent 1px)",
          backgroundSize: "14px 14px",
        }}
      >
        <Box
          sx={{
            position: "absolute",
            inset: "45% 0 auto 0",
            borderTop: "2px solid",
            borderColor: settings.largeGridColor,
            transform: `rotate(${settings.rotation}deg)`,
            opacity: 0.7,
          }}
        />
      </Box>
      <Typography sx={{ mt: 0.75, fontSize: 11, color: "text.secondary", textAlign: "center" }}>
        {modeLabel} · z{Math.round(settings.zoom)}
      </Typography>
    </Box>
  );
}
