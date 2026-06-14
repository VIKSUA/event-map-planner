import { useEffect, useMemo, useState } from "react";
import { CanvasPreview } from "./components/CanvasPreview";
import { ControlPanel } from "./components/ControlPanel";
import { DraggablePanel } from "./components/DraggablePanel";
import { MapModeToggle } from "./components/MapModeToggle";
import { setAppearanceMode } from "./lib/appearancePresets";
import { fetchDemoMapSource } from "./lib/demoMapSource";
import { downloadPng } from "./lib/download";
import { fetchMapSource } from "./lib/googleStaticMap";
import { getRequestCostByResolutionMode, useGoogleRequestCounter } from "./lib/googleRequestCounter";
import { DEFAULT_SETTINGS, getExportSize, getMapDrawSize } from "./lib/mapMath";
import { printMap } from "./lib/print";
import { loadSettings, saveSettings } from "./lib/storage";
import type { MapSettings, MapSource } from "./types/map";

function mapSourceKey(settings: MapSettings): string {
  return [
    settings.apiKey,
    settings.latitude,
    settings.longitude,
    settings.zoom,
    settings.mapLabelsEnabled ? "labels" : "no-labels",
    "standard",
  ].join(":");
}

export default function App() {
  const [settings, setSettings] = useState<MapSettings>(() => loadSettings());
  const [source, setSource] = useState<MapSource | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [warnings, setWarnings] = useState<string[]>([]);
  const { requestCount, addRequests, resetRequests } = useGoogleRequestCounter();
  const sourceKey = useMemo(() => mapSourceKey(settings), [settings]);
  const exportSize = getExportSize(settings);
  const displayWarnings = useMemo(() => {
    const nextWarnings = [...warnings];
    if (source) {
      const { mapDrawSize } = getMapDrawSize(exportSize, settings);
      if (source.width < mapDrawSize || source.height < mapDrawSize) {
        nextWarnings.push("Standard source image may be too low-resolution for this export size.");
      }
    }

    return [...new Set(nextWarnings)];
  }, [exportSize, settings, source, warnings]);

  useEffect(() => {
    saveSettings(settings);
  }, [settings]);

  useEffect(() => {
    let cancelled = false;

    if (!settings.apiKey.trim()) {
      setLoading(false);
      setError(null);
      fetchDemoMapSource()
        .then((demoSource) => {
          if (cancelled) {
            return;
          }

          setSource(demoSource);
          setWarnings(demoSource.warnings);
        })
        .catch((err: unknown) => {
          if (cancelled) {
            return;
          }

          setSource(null);
          setWarnings([]);
          setError(err instanceof Error ? err.message : "Unable to load demo map source.");
        })
        .finally(() => {
          if (!cancelled) {
            setLoading(false);
          }
        });
      return;
    }

    setLoading(true);
    setError(null);
    addRequests(getRequestCostByResolutionMode("standard"));

    // High/Ultra disabled: stitching repeats Google attribution and costs extra requests.
    fetchMapSource({ ...settings, resolutionMode: "standard" })
      .then((nextSource) => {
        if (cancelled) {
          return;
        }
        setSource(nextSource);
        setWarnings(nextSource.warnings);
      })
      .catch((err: unknown) => {
        if (cancelled) {
          return;
        }
        setSource((currentSource) => currentSource);
        setError(err instanceof Error ? err.message : "Unable to load map source.");
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [sourceKey]);

  const requireSource = (): MapSource | null => {
    if (!source) {
      setError(settings.apiKey.trim() ? "Map source is still loading." : "Enter a Google Maps Static API key first.");
      return null;
    }

    return source;
  };

  const handleDownload = () => {
    const currentSource = requireSource();
    if (!currentSource) {
      return;
    }
    downloadPng(settings, currentSource);
  };

  const handlePrint = () => {
    const currentSource = requireSource();
    if (!currentSource) {
      return;
    }

    try {
      printMap(settings, currentSource);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to print export.");
    }
  };

  const handlePanEnd = (latitude: number, longitude: number) => {
    setSettings((currentSettings) => ({ ...currentSettings, latitude, longitude }));
  };

  return (
    <div className="app">
      <CanvasPreview
        settings={settings}
        source={source}
        loading={loading}
        error={error}
        warnings={displayWarnings}
        onChange={setSettings}
        onPanEnd={handlePanEnd}
      />
      <DraggablePanel
        title="Map controls"
        headerAction={
          <MapModeToggle
            value={settings.activeAppearanceMode}
            onChange={(mode) => setSettings((currentSettings) => setAppearanceMode(currentSettings, mode))}
          />
        }
      >
        <div className="export-meta">
          Export: {exportSize.width} x {exportSize.height}px
        </div>
        <ControlPanel
          settings={settings}
          onChange={setSettings}
          onDownload={handleDownload}
          onPrint={handlePrint}
          onReset={() => setSettings((currentSettings) => ({ ...DEFAULT_SETTINGS, apiKey: currentSettings.apiKey }))}
          requestCount={requestCount}
          onAddRequests={addRequests}
          onResetRequestCount={resetRequests}
          busy={loading}
        />
      </DraggablePanel>
    </div>
  );
}
