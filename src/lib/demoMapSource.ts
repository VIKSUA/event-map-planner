import type { MapSource } from "../types/map";

const DEMO_SOURCE_PIXEL_SIZE = 1280;
const DEMO_SOURCE_SCALE = 2;
const DEMO_SOURCE_LOGICAL_SIZE = 640;
const DEMO_MAP_URL = `${import.meta.env.BASE_URL}demo-map.svg`;

let demoSourcePromise: Promise<MapSource> | null = null;

function loadDemoImage(): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.decoding = "async";
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Unable to load built-in demo map."));
    image.src = DEMO_MAP_URL;
  });
}

export function fetchDemoMapSource(): Promise<MapSource> {
  demoSourcePromise ??= loadDemoImage().then((image) => ({
    image,
    width: DEMO_SOURCE_PIXEL_SIZE,
    height: DEMO_SOURCE_PIXEL_SIZE,
    googleStaticScale: DEMO_SOURCE_SCALE,
    requestedStaticLogicalSize: DEMO_SOURCE_LOGICAL_SIZE,
    tileCount: 1,
    warnings: ["Demo preview shown. Enter a Google API key for live map imagery."],
  }));

  return demoSourcePromise;
}
