import { useEffect, useRef, useState } from "react";
import { Box, Typography } from "@mui/material";
import type { SavedLayout } from "../lib/savedLayouts";
import { drawComposition } from "../lib/drawCanvas";
import { formatRatio } from "../lib/mapMath";
import { fetchSavedLayoutThumbnailSource, getThumbnailSize } from "../lib/savedLayoutThumbnails";

export function SavedLayoutThumbnail({
  apiKey,
  layout,
  onRequestStart,
}: {
  apiKey: string;
  layout: SavedLayout;
  onRequestStart: () => void;
}) {
  const settings = layout.settings;
  const ratio = formatRatio(settings.format, settings.orientation);
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [status, setStatus] = useState<"placeholder" | "loading" | "ready" | "error">("placeholder");

  useEffect(() => {
    const wrapper = wrapperRef.current;
    if (!wrapper) {
      return;
    }

    if (!("IntersectionObserver" in window)) {
      setIsVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: "160px" },
    );
    observer.observe(wrapper);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !isVisible || !apiKey.trim()) {
      setStatus("placeholder");
      return;
    }

    let cancelled = false;
    setStatus("loading");
    const thumbnail = fetchSavedLayoutThumbnailSource(layout, apiKey, onRequestStart);
    if (!thumbnail) {
      setStatus("placeholder");
      return;
    }

    thumbnail
      .then(({ settings: thumbnailSettings, source }) => {
        if (cancelled) {
          return;
        }

        const size = getThumbnailSize(thumbnailSettings);
        const dpr = window.devicePixelRatio || 1;
        canvas.width = Math.round(size.width * dpr);
        canvas.height = Math.round(size.height * dpr);
        const context = canvas.getContext("2d");
        if (!context) {
          setStatus("error");
          return;
        }

        context.setTransform(dpr, 0, 0, dpr, 0, 0);
        drawComposition(context, size, thumbnailSettings, source);
        setStatus("ready");
      })
      .catch(() => {
        if (!cancelled) {
          setStatus("error");
        }
      });

    return () => {
      cancelled = true;
    };
  }, [apiKey, isVisible, layout, onRequestStart]);

  return (
    <Box
      ref={wrapperRef}
      sx={{
        width: { xs: "100%", sm: 196 },
        maxWidth: { xs: "100%", sm: 220 },
        flex: "0 0 auto",
        border: "1px solid",
        borderColor: "divider",
        borderRadius: 1.5,
        backgroundColor: "#f8fafc",
        p: 0.75,
      }}
    >
      <Box
        sx={{
          position: "relative",
          width: "100%",
          aspectRatio: `${ratio} / 1`,
          minHeight: 108,
          overflow: "hidden",
          borderRadius: 1,
          backgroundColor: settings.mapGrayscale ? "#f3f4f6" : "#eff6ff",
          backgroundImage:
            "linear-gradient(rgba(100, 116, 139, 0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(100, 116, 139, 0.3) 1px, transparent 1px)",
          backgroundSize: "14px 14px",
        }}
      >
        <canvas
          ref={canvasRef}
          aria-label="Saved map thumbnail"
          style={{
            display: status === "ready" ? "block" : "none",
            width: "100%",
            height: "100%",
          }}
        />
        <Box
          sx={{
            position: "absolute",
            inset: "45% 0 auto 0",
            borderTop: "2px solid",
            borderColor: settings.largeGridColor,
            transform: `rotate(${settings.rotation}deg)`,
            opacity: 0.7,
            display: status === "ready" ? "none" : "block",
          }}
        />
        {status !== "ready" && (
          <Typography
            sx={{
              position: "absolute",
              inset: 0,
              display: "grid",
              placeItems: "center",
              px: 1,
              color: "text.secondary",
              fontSize: 12,
              textAlign: "center",
            }}
          >
            {status === "loading" ? "Loading preview..." : status === "error" ? "Preview unavailable" : apiKey.trim() ? "Preview pending" : "No API key"}
          </Typography>
        )}
      </Box>
    </Box>
  );
}
