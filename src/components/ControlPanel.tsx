import type { MapSettings, Orientation, PageFormat, ResolutionMode, Unit } from "../types/map";
import { getPrintSize, moveByMeters } from "../lib/mapMath";

interface ControlPanelProps {
  settings: MapSettings;
  onChange: (settings: MapSettings) => void;
  onDownload: () => void;
  onPrint: () => void;
  onReset: () => void;
  busy: boolean;
}

function numericValue(value: string, fallback: number): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export function ControlPanel({ settings, onChange, onDownload, onPrint, onReset, busy }: ControlPanelProps) {
  const update = <K extends keyof MapSettings>(key: K, value: MapSettings[K]) => {
    onChange({ ...settings, [key]: value });
  };

  const nudge = (direction: "left" | "right" | "up" | "down") => {
    const next = moveByMeters(settings.latitude, settings.longitude, direction, 1, settings.rotation);
    onChange({
      ...settings,
      latitude: Number(next.latitude.toFixed(7)),
      longitude: Number(next.longitude.toFixed(7)),
    });
  };

  const applyPrintPreset = () => {
    const printSize = getPrintSize(settings.format, settings.orientation);
    if (printSize) {
      update("exportWidth", printSize.width);
    }
  };

  return (
    <form className="settings-grid" onSubmit={(event) => event.preventDefault()}>
      <label className="span-2">
        Google API key
        <input
          type="password"
          autoComplete="off"
          value={settings.apiKey}
          placeholder="Stored only in this browser"
          onChange={(event) => update("apiKey", event.target.value)}
        />
      </label>

      <label>
        Latitude
        <input type="number" step="0.000001" value={settings.latitude} onChange={(event) => update("latitude", numericValue(event.target.value, settings.latitude))} />
      </label>
      <label>
        Longitude
        <input type="number" step="0.000001" value={settings.longitude} onChange={(event) => update("longitude", numericValue(event.target.value, settings.longitude))} />
      </label>

      <label>
        Zoom
        <input type="number" min="0" max="21" step="1" value={settings.zoom} onChange={(event) => update("zoom", numericValue(event.target.value, settings.zoom))} />
      </label>
      <label>
        Rotation
        <input type="number" step="1" value={settings.rotation} onChange={(event) => update("rotation", numericValue(event.target.value, settings.rotation))} />
      </label>

      <label>
        Scale %
        <input type="number" min="10" step="1" value={settings.scale} onChange={(event) => update("scale", numericValue(event.target.value, settings.scale))} />
      </label>
      <label>
        Map opacity %
        <input type="number" min="0" max="100" step="1" value={settings.mapOpacity} onChange={(event) => update("mapOpacity", numericValue(event.target.value, settings.mapOpacity))} />
      </label>

      <label>
        Unit
        <select value={settings.unit} onChange={(event) => update("unit", event.target.value as Unit)}>
          <option value="meters">Meters</option>
          <option value="feet">Feet</option>
        </select>
      </label>
      <label>
        Resolution
        <select value={settings.resolutionMode} onChange={(event) => update("resolutionMode", event.target.value as ResolutionMode)}>
          <option value="standard">Standard 1280px source</option>
          <option value="high">High 2x2 stitching</option>
          <option value="ultra">Ultra 3x3 stitching</option>
        </select>
      </label>

      {settings.unit === "meters" ? (
        <>
          <label>
            Small grid m
            <input type="number" min="0.1" step="0.1" value={settings.smallGridMeters} onChange={(event) => update("smallGridMeters", numericValue(event.target.value, settings.smallGridMeters))} />
          </label>
          <label>
            Large grid m
            <input type="number" min="0.1" step="0.1" value={settings.largeGridMeters} onChange={(event) => update("largeGridMeters", numericValue(event.target.value, settings.largeGridMeters))} />
          </label>
        </>
      ) : (
        <>
          <label>
            Small grid ft
            <input type="number" min="1" step="1" value={settings.smallGridFeet} onChange={(event) => update("smallGridFeet", numericValue(event.target.value, settings.smallGridFeet))} />
          </label>
          <label>
            Large grid ft
            <input type="number" min="1" step="1" value={settings.largeGridFeet} onChange={(event) => update("largeGridFeet", numericValue(event.target.value, settings.largeGridFeet))} />
          </label>
        </>
      )}

      <label>
        Grid offset X
        <input type="number" step="1" value={settings.gridOffsetX} onChange={(event) => update("gridOffsetX", numericValue(event.target.value, settings.gridOffsetX))} />
      </label>
      <label>
        Grid offset Y
        <input type="number" step="1" value={settings.gridOffsetY} onChange={(event) => update("gridOffsetY", numericValue(event.target.value, settings.gridOffsetY))} />
      </label>

      <label>
        Format
        <select value={settings.format} onChange={(event) => update("format", event.target.value as PageFormat)}>
          <option value="square">Square</option>
          <option value="letter">Letter</option>
          <option value="a4">A4</option>
        </select>
      </label>
      <label>
        Orientation
        <select value={settings.orientation} onChange={(event) => update("orientation", event.target.value as Orientation)} disabled={settings.format === "square"}>
          <option value="portrait">Portrait</option>
          <option value="landscape">Landscape</option>
        </select>
      </label>

      <label>
        Export width px
        <input type="number" min="640" step="10" value={settings.exportWidth} onChange={(event) => update("exportWidth", numericValue(event.target.value, settings.exportWidth))} />
      </label>
      <label className="checkbox-label">
        <input type="checkbox" checked={settings.showGrid} onChange={(event) => update("showGrid", event.target.checked)} />
        Show grid
      </label>

      <div className="button-row span-2">
        <button type="button" onClick={() => nudge("left")}>Move left</button>
        <button type="button" onClick={() => nudge("right")}>Move right</button>
        <button type="button" onClick={() => nudge("up")}>Move up</button>
        <button type="button" onClick={() => nudge("down")}>Move down</button>
      </div>

      <div className="button-row span-2">
        <button type="button" onClick={() => update("rotation", settings.rotation - 1)}>Rotate left</button>
        <button type="button" onClick={() => update("rotation", settings.rotation + 1)}>Rotate right</button>
        <button type="button" onClick={() => update("zoom", settings.zoom + 1)}>Zoom in</button>
        <button type="button" onClick={() => update("zoom", settings.zoom - 1)}>Zoom out</button>
      </div>

      <div className="button-row span-2">
        <button type="button" onClick={() => update("exportWidth", 2000)}>Screen 2K</button>
        <button type="button" onClick={() => update("exportWidth", 3840)}>Screen 4K</button>
        <button type="button" onClick={applyPrintPreset} disabled={settings.format === "square"}>300 DPI preset</button>
      </div>

      <div className="button-row span-2 primary-actions">
        <button type="button" onClick={onDownload} disabled={busy}>Download PNG</button>
        <button type="button" onClick={onPrint} disabled={busy}>Print</button>
        <button type="button" onClick={onReset}>Reset to defaults</button>
      </div>
    </form>
  );
}
