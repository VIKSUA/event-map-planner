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

- HTTP referrer for GitHub Pages: `https://<github-username>.github.io/<repo-name>/*`
- HTTP referrer for local dev: `http://localhost:5173/*`
- API restriction: Google Maps Static API only

## Build

```bash
npm run type-check
npm run build
npm run preview
```

The production output is written to `dist`.

## GitHub Pages

The workflow in `.github/workflows/deploy.yml` builds on pushes to `main` and deploys `dist` to GitHub Pages.

The final Pages URL will be:

```text
https://<github-username>.github.io/<repo-name>/
```

`vite.config.ts` sets `base` automatically from `GITHUB_REPOSITORY` in GitHub Actions. For a custom deployment path, set `VITE_BASE_PATH`, for example:

```bash
VITE_BASE_PATH=/my-repo/ npm run build
```

## Rendering Notes

Google Static Maps supports `size=640x640&scale=2`, which provides a 1280 x 1280 source image per request. The app can also stitch multiple Static Maps images in an offscreen canvas:

- Standard: one 1280 px source
- High: 2x2 stitching
- Ultra: 3x3 stitching

High or Ultra mode may be needed for 4K and print exports because the final export can be much larger than a single Static Maps image. If the source is likely too low-resolution for the selected export size, the app shows a warning.

The grid is rendered directly into the final canvas after the map has been drawn. It does not rotate with the map and is not CSS-scaled, so lines stay sharp on high-DPI screens and in exported PNGs.

## Known Limitations

- The API key is still visible in browser requests because there is no backend proxy in V1.
- Google Static Maps usage, billing, quotas, and referrer restrictions must be configured in Google Cloud.
- Stitching approximates adjacent Static Maps coverage using Web Mercator pixel offsets.
- Movement buttons move by 1 meter and respect the current rotation direction.
- Professional print calibration and full mobile UX are out of scope for V1.
