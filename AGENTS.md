# Project Guidance

This project is a static React + TypeScript + Vite app for exporting Google satellite map backgrounds with a sharp canvas-rendered grid.

- Never hardcode or commit Google API keys.
- Do not put Google API keys in `.env` for public builds.
- The API key is entered by the user in the UI and saved only in that browser's `localStorage`.
- Keep rendering on a single composition canvas: draw the map first, restore transforms, then draw the grid.
- Do not use CSS transforms to scale the grid or the already-rendered canvas bitmap.
- Grid math must include visual map scale and use Web Mercator meters-per-pixel.
- The app is frontend-only for V1: no backend, database, auth, Figma API, or Figma MCP.
