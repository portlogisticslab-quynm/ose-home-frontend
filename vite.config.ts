import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { resolve } from "node:path";

export default defineConfig({
  plugins: [react()],
  build: {
    target: "es2019",
    cssCodeSplit: true,
    rollupOptions: {
      input: {
        main: resolve(__dirname, "index.html"),
        admin: resolve(__dirname, "admin/index.html"),
      },
    },
  },
  server: {
    port: 5173,
    // During `npm run dev`, /api is forwarded to the local FastAPI backend.
    // Override with:  $env:DEV_API_TARGET="http://127.0.0.1:8765"; npm run dev
    proxy: {
      "/api": process.env.DEV_API_TARGET || "http://127.0.0.1:8000",
      "/health": process.env.DEV_API_TARGET || "http://127.0.0.1:8000",
    },
  },
});
