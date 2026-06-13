import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

const githubRepository = process.env.GITHUB_REPOSITORY?.split("/")[1];
const base = process.env.VITE_BASE_PATH ?? (githubRepository ? `/${githubRepository}/` : "/");

export default defineConfig({
  base,
  plugins: [react()],
});
