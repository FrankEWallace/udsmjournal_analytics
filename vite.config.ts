import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    hmr: {
      overlay: false,
    },
    // API Proxies to avoid CORS issues during development
    proxy: {
      // OJS API proxy - routes to local MAMP OJS installation
      '/index.php': {
        target: 'http://localhost:8888',
        changeOrigin: true,
        secure: false,
      },
      // Matomo Analytics API proxy
      '/matomo-api': {
        target: 'https://matomo.themenumanager.xyz',
        changeOrigin: true,
        secure: true,
        rewrite: (path) => path.replace(/^\/matomo-api/, ''),
      },
    },
  },
  plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
