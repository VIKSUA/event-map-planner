import type { MapSettings, MapSource, ResolutionMode } from "../types/map";
import { latLngToWorldPixel, worldPixelToLatLng } from "./mapMath";

const STATIC_MAP_BASE_URL = "https://maps.googleapis.com/maps/api/staticmap";
const SOURCE_LOGICAL_SIZE = 640;
const SOURCE_SCALE = 2;
const SOURCE_PIXEL_SIZE = SOURCE_LOGICAL_SIZE * SOURCE_SCALE;

function matrixSize(mode: ResolutionMode): number {
  if (mode === "high") {
    return 2;
  }

  if (mode === "ultra") {
    return 3;
  }

  return 1;
}

function buildStaticMapUrl(settings: MapSettings, latitude: number, longitude: number): string {
  const url = new URL(STATIC_MAP_BASE_URL);
  url.searchParams.set("center", `${latitude},${longitude}`);
  url.searchParams.set("zoom", String(settings.zoom));
  url.searchParams.set("size", `${SOURCE_LOGICAL_SIZE}x${SOURCE_LOGICAL_SIZE}`);
  url.searchParams.set("scale", String(SOURCE_SCALE));
  url.searchParams.set("maptype", "satellite");
  url.searchParams.set("key", settings.apiKey);
  return url.toString();
}

function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.crossOrigin = "anonymous";
    image.decoding = "async";
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Unable to load Google Static Maps image."));
    image.src = url;
  });
}

async function loadTile(settings: MapSettings, offsetX: number, offsetY: number): Promise<HTMLImageElement> {
  const center = latLngToWorldPixel(settings.latitude, settings.longitude, settings.zoom);
  const tileCenter = worldPixelToLatLng(center.x + offsetX, center.y + offsetY, settings.zoom);
  return loadImage(buildStaticMapUrl(settings, tileCenter.latitude, tileCenter.longitude));
}

export async function fetchMapSource(settings: MapSettings): Promise<MapSource> {
  if (!settings.apiKey.trim()) {
    throw new Error("Enter a Google Maps Static API key to load the satellite map.");
  }

  const matrix = matrixSize(settings.resolutionMode);

  if (matrix === 1) {
    const image = await loadTile(settings, 0, 0);
    return {
      image,
      width: SOURCE_PIXEL_SIZE,
      height: SOURCE_PIXEL_SIZE,
      warnings: [],
    };
  }

  const canvas = document.createElement("canvas");
  canvas.width = SOURCE_PIXEL_SIZE * matrix;
  canvas.height = SOURCE_PIXEL_SIZE * matrix;
  const context = canvas.getContext("2d");
  if (!context) {
    throw new Error("Canvas is not available in this browser.");
  }

  const midpoint = (matrix - 1) / 2;
  const tilePromises: Promise<{ image: HTMLImageElement; column: number; row: number }>[] = [];

  for (let row = 0; row < matrix; row += 1) {
    for (let column = 0; column < matrix; column += 1) {
      const offsetX = (column - midpoint) * SOURCE_LOGICAL_SIZE;
      const offsetY = (row - midpoint) * SOURCE_LOGICAL_SIZE;
      tilePromises.push(loadTile(settings, offsetX, offsetY).then((image) => ({ image, column, row })));
    }
  }

  const tiles = await Promise.all(tilePromises);
  for (const tile of tiles) {
    context.drawImage(tile.image, tile.column * SOURCE_PIXEL_SIZE, tile.row * SOURCE_PIXEL_SIZE, SOURCE_PIXEL_SIZE, SOURCE_PIXEL_SIZE);
  }

  return {
    image: canvas,
    width: canvas.width,
    height: canvas.height,
    warnings: [],
  };
}

export function getSourcePixelSize(mode: ResolutionMode): number {
  return SOURCE_PIXEL_SIZE * matrixSize(mode);
}
