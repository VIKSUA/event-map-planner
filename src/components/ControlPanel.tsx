import type { MapSettings, Orientation, PageFormat, ResolutionMode, Unit } from "../types/map";
import { DEFAULT_ROTATION, DEFAULT_SCALE, DEFAULT_ZOOM, MAX_SCALE, MAX_ZOOM, MIN_SCALE, MIN_ZOOM } from "../lib/mapConstants";
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

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function clampZoom(value: number): number {
  return clamp(Math.round(value), MIN_ZOOM, MAX_ZOOM);
}

function clampScale(value: number): number {
  return clamp(Math.round(value), MIN_SCALE, MAX_SCALE);
}

export function ControlPanel({ settings, onChange, onDownload, onPrint, onReset, busy }: ControlPanelProps) {
  const update = <K extends keyof MapSettings>(key: K, value: MapSettings[K]) => {
    onChange({ ...settings, [key]: value });
  };
  const zoom = clampZoom(settings.zoom);
  const scale = clampScale(settings.scale);
  const canZoomOut = zoom > MIN_ZOOM;
  const canZoomIn = zoom < MAX_ZOOM;
  const canScaleOut = scale > MIN_SCALE;
  const canScaleIn = scale < MAX_SCALE;

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

  const updateZoom = (value: number) => update("zoom", clampZoom(value));
  const updateScale = (value: number) => update("scale", clampScale(value));
  const resetZoomScale = () => onChange({ ...settings, zoom: DEFAULT_ZOOM, scale: DEFAULT_SCALE });
  const resetRotation = () => update("rotation", DEFAULT_ROTATION);

  return (
    <form className="settings-grid" onSubmit={(event) => event.preventDefault()}>
      <section className="control-section span-2">
        <h3>API / Source</h3>
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
        <label className="span-2">
          Resolution
          <select value={settings.resolutionMode} onChange={(event) => update("resolutionMode", event.target.value as ResolutionMode)}>
            <option value="standard">Standard 1280px source</option>
            <option value="high">High 2x2 stitching</option>
            <option value="ultra">Ultra 3x3 stitching</option>
          </select>
        </label>
        <p className="field-hint span-2">API key stays in this browser's localStorage.</p>
      </section>

      <section className="control-section span-2">
        <h3>Location</h3>
        <label>
          Latitude
          <input type="number" step="0.000001" value={settings.latitude} onChange={(event) => update("latitude", numericValue(event.target.value, settings.latitude))} />
        </label>
        <label>
          Longitude
          <input type="number" step="0.000001" value={settings.longitude} onChange={(event) => update("longitude", numericValue(event.target.value, settings.longitude))} />
        </label>
        <div className="button-row span-2">
          <button type="button" onClick={() => nudge("left")}>Move left</button>
          <button type="button" onClick={() => nudge("right")}>Move right</button>
          <button type="button" onClick={() => nudge("up")}>Move up</button>
          <button type="button" onClick={() => nudge("down")}>Move down</button>
        </div>
      </section>

      <section className="control-section span-2">
        <h3>Zoom & Scale</h3>
        <div className="inline-control span-2">
          <label>
            Zoom <span className="field-hint">{MIN_ZOOM}-{MAX_ZOOM}</span>
            <input type="number" min={MIN_ZOOM} max={MAX_ZOOM} step="1" value={zoom} onChange={(event) => updateZoom(numericValue(event.target.value, zoom))} />
          </label>
          <button type="button" onClick={() => updateZoom(zoom - 1)} disabled={!canZoomOut}>Zoom out</button>
          <button type="button" onClick={() => updateZoom(zoom + 1)} disabled={!canZoomIn}>Zoom in</button>
        </div>
        <div className="inline-control span-2">
          <label>
            Scale % <span className="field-hint">{MIN_SCALE}-{MAX_SCALE}</span>
            <input type="number" min={MIN_SCALE} max={MAX_SCALE} step="1" value={scale} onChange={(event) => updateScale(numericValue(event.target.value, scale))} />
          </label>
          <button type="button" onClick={() => updateScale(scale - 5)} disabled={!canScaleOut}>Scale out</button>
          <button type="button" onClick={() => updateScale(scale + 5)} disabled={!canScaleIn}>Scale in</button>
        </div>
        <div className="button-row span-2">
          <button type="button" onClick={resetZoomScale}>Reset zoom/scale</button>
        </div>
      </section>

      <section className="control-section span-2">
        <h3>Rotation</h3>
        <div className="inline-control span-2">
          <label>
            Rotation
            <input type="number" step="1" value={settings.rotation} onChange={(event) => update("rotation", numericValue(event.target.value, settings.rotation))} />
          </label>
          <button type="button" onClick={() => update("rotation", settings.rotation - 1)}>Rotate left</button>
          <button type="button" onClick={() => update("rotation", settings.rotation + 1)}>Rotate right</button>
        </div>
        <div className="button-row span-2">
          <button type="button" onClick={resetRotation}>Reset rotation</button>
        </div>
      </section>

      <section className="control-section span-2">
        <h3>Grid</h3>
        <label>
          Unit
          <select value={settings.unit} onChange={(event) => update("unit", event.target.value as Unit)}>
            <option value="meters">Meters</option>
            <option value="feet">Feet</option>
          </select>
        </label>
        <label className="checkbox-label">
          <input type="checkbox" checked={settings.showGrid} onChange={(event) => update("showGrid", event.target.checked)} />
          Show grid
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
        <label className="span-2">
          Map opacity %
          <input type="number" min="0" max="100" step="1" value={settings.mapOpacity} onChange={(event) => update("mapOpacity", numericValue(event.target.value, settings.mapOpacity))} />
        </label>
      </section>

      <section className="control-section span-2">
        <h3>Page / Export</h3>
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
        <label className="span-2">
          Export width px
          <input type="number" min="640" step="10" value={settings.exportWidth} onChange={(event) => update("exportWidth", numericValue(event.target.value, settings.exportWidth))} />
        </label>
        <div className="button-row span-2">
          <button type="button" onClick={() => update("exportWidth", 2000)}>Screen 2K</button>
          <button type="button" onClick={() => update("exportWidth", 3840)}>Screen 4K</button>
          <button type="button" onClick={applyPrintPreset} disabled={settings.format === "square"}>300 DPI preset</button>
        </div>
        <div className="button-row span-2 primary-actions">
          <button type="button" onClick={onDownload} disabled={busy}>Download PNG</button>
          <button type="button" onClick={onPrint} disabled={busy}>Print</button>
          <button type="button" onClick={onReset}>Reset all settings</button>
        </div>
      </section>
    </form>
  );
}
