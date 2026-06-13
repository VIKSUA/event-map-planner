import type { MapSettings, MapSource } from "../types/map";
import { renderExportCanvas } from "./drawCanvas";

export function printMap(settings: MapSettings, source: MapSource): void {
  const { canvas } = renderExportCanvas(settings, source);
  const dataUrl = canvas.toDataURL("image/png");
  const pageSize = settings.format === "square" ? "auto" : `${settings.format} ${settings.orientation}`;
  const printWindow = window.open("", "_blank", "noopener,noreferrer");

  if (!printWindow) {
    throw new Error("The print window was blocked by the browser.");
  }

  printWindow.document.write(`
<!doctype html>
<html>
  <head>
    <title>Print Map Background</title>
    <style>
      @page { size: ${pageSize}; margin: 0; }
      html, body { margin: 0; min-height: 100%; background: white; }
      body { display: grid; place-items: center; }
      img { width: 100vw; height: 100vh; object-fit: contain; display: block; }
    </style>
  </head>
  <body>
    <img src="${dataUrl}" alt="Map background export" />
    <script>
      window.addEventListener("load", () => {
        window.focus();
        window.print();
      });
    </script>
  </body>
</html>`);
  printWindow.document.close();
}
