import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import { Box, IconButton, Tooltip } from "@mui/material";

interface SlideOutPanelProps {
  children: ReactNode;
  defaultCollapsed?: boolean;
  storageKey?: string;
  width?: number;
}

const HANDLE_WIDTH = 30;

export function SlideOutPanel({ children, defaultCollapsed = false, storageKey, width = 360 }: SlideOutPanelProps) {
  const [collapsed, setCollapsed] = useState(() => {
    if (!storageKey) {
      return defaultCollapsed;
    }

    try {
      const stored = localStorage.getItem(storageKey);
      return stored ? stored === "collapsed" : defaultCollapsed;
    } catch {
      return defaultCollapsed;
    }
  });

  useEffect(() => {
    if (!storageKey) {
      return;
    }

    localStorage.setItem(storageKey, collapsed ? "collapsed" : "expanded");
  }, [collapsed, storageKey]);

  return (
    <Box
      sx={{
        position: "relative",
        width,
        maxWidth: `calc(100vw - ${HANDLE_WIDTH + 24}px)`,
        transform: collapsed ? "translateX(100%)" : "translateX(0)",
        transition: "transform 180ms ease",
        pointerEvents: "auto",
      }}
    >
      <Tooltip title={collapsed ? "Show panel" : "Hide panel"} placement="left">
        <IconButton
          aria-label={collapsed ? "Show panel" : "Hide panel"}
          size="small"
          onClick={() => setCollapsed((value) => !value)}
          sx={{
            position: "absolute",
            top: "50%",
            left: 0,
            width: HANDLE_WIDTH,
            height: 48,
            transform: "translate(-100%, -50%)",
            borderRadius: "10px 0 0 10px",
            border: "1px solid rgba(148, 163, 184, 0.45)",
            borderRight: 0,
            color: "white",
            background: "rgba(15, 23, 42, 0.88)",
            "&:hover": { background: "rgba(30, 41, 59, 0.94)" },
          }}
        >
          {collapsed ? <ChevronLeftIcon fontSize="small" /> : <ChevronRightIcon fontSize="small" />}
        </IconButton>
      </Tooltip>
      {children}
    </Box>
  );
}
