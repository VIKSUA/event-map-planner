import type { ReactNode } from "react";
import { Stack } from "@mui/material";

export function OverlayPanelStack({ children }: { children: ReactNode }) {
  return (
    <Stack
      className="no-print"
      spacing={1.5}
      sx={{
        position: "absolute",
        right: 16,
        bottom: 16,
        zIndex: 6,
        alignItems: "flex-end",
        pointerEvents: "none",
      }}
    >
      {children}
    </Stack>
  );
}
