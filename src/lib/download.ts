import type { MapSettings, MapSource } from "../types/map";
import { renderExportCanvas } from "./drawCanvas";

function formatCoordinate(value: number): string {
  return value.toFixed(6).replace("-", "m").replace(".", "_");
}

export function downloadPng(settings: MapSettings, source: MapSource): void {
  const { canvas } = renderExportCanvas(settings, source);
  const link = document.createElement("a");
  link.download = `map-background_${formatCoordinate(settings.latitude)}_${formatCoordinate(settings.longitude)}_${settings.format}_${settings.unit}.png`;
  link.href = canvas.toDataURL("image/png");
  link.click();
}
