# Map Background Exporter

A static browser tool for generating a Google satellite map background with a sharp, non-rotated grid overlay. It is intended for exporting a PNG or printing a map image that can be placed manually into Figma as a background.

## Local Development

Install dependencies and start Vite:

```bash
npm install
npm run dev
```

Open the localhost URL printed by Vite, usually `http://localhost:5173/`.

## Google API Key

Enter your Google Maps Static API key in the control panel. The key is saved only in the current browser's `localStorage` so you do not need to paste it every time.

Because this is a static frontend-only tool, the API key is visible in browser network requests. Do not commit a key, hardcode it, or place it in `.env` for a public build.

Recommended key restrictions:

- HTTP referrer for local dev: `http://localhost:5173/*`
- HTTP referrer for local preview fallback: `http://localhost:5174/*`
- HTTP referrer for GitHub Pages: `https://viksua.github.io/event-map-planner/*`
- API restriction: Google Maps Static API only

## Build

```bash
npm install
npm run type-check
npm run build
npm run preview
```

The production output is written to `dist`.

## Deployment / GitHub Pages

The workflow in `.github/workflows/deploy.yml` builds on pushes to `main` and deploys `dist` to GitHub Pages using GitHub Actions.

Final GitHub Pages URL:

```text
https://viksua.github.io/event-map-planner/
```

Enable Pages in GitHub:

1. Open the GitHub repository.
2. Go to Settings -> Pages.
3. Under Build and deployment, set Source to GitHub Actions.
4. Push to `main`; the deploy workflow will run automatically.

The workflow runs:

```bash
npm ci
npm run type-check
npm run build
```

Then it uploads `dist` with `actions/upload-pages-artifact` and publishes it with `actions/deploy-pages`.

`vite.config.ts` sets `base` automatically from `GITHUB_REPOSITORY` in GitHub Actions, so project pages build with `/event-map-planner/` while local dev falls back to `/`. For a custom deployment path, set `VITE_BASE_PATH`, for example:

```bash
VITE_BASE_PATH=/my-repo/ npm run build
```

Google API key reminders for deployment:

- The API key is not stored in the repository.
- The API key is entered in the app UI.
- The API key is saved only in the current browser's `localStorage`.
- The API key should be restricted by HTTP referrer.
- API restrictions should allow only Maps Static API.

## Rendering Notes

Google Static Maps supports `size=640x640&scale=2`, which provides a 1280 x 1280 source image per request. The app can also stitch multiple Static Maps images in an offscreen canvas:

- Standard: one 1280 px source
- High: 2x2 stitching
- Ultra: 3x3 stitching

High or Ultra mode may be needed for 4K and print exports because the final export can be much larger than a single Static Maps image. If the source is likely too low-resolution for the selected export size, the app shows a warning.

The grid is rendered directly into the final canvas after the map has been drawn. It does not rotate with the map and is not CSS-scaled, so lines stay sharp on high-DPI screens and in exported PNGs.

Zoom input is clamped to Google's practical map zoom range of `0` through `22`. The panel also includes separate reset controls for zoom/scale, rotation, and all settings.

Grid controls include editable small/large line colors and line widths. These settings are rendered into preview, PNG export, and print output.

## Known Limitations

- The API key is still visible in browser requests because there is no backend proxy in V1.
- Google Static Maps usage, billing, quotas, and referrer restrictions must be configured in Google Cloud.
- Stitching approximates adjacent Static Maps coverage using Web Mercator pixel offsets.
- Movement buttons move by 1 meter and respect the current rotation direction.
- Professional print calibration and full mobile UX are out of scope for V1.
