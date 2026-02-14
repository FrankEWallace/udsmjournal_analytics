import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// OJS Plugin path for production build
const OJS_PLUGIN_PATH = '/Applications/MAMP/htdocs/journals_multiple/plugins/generic/udsmGlobalReach/frontend';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  // Base path for assets - relative in OJS plugin context
  base: mode === 'production' ? './' : '/',
  
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    // Generate single JS/CSS files for easy OJS integration
    rollupOptions: {
      output: {
        entryFileNames: 'assets/index.js',
        chunkFileNames: 'assets/[name].js',
        assetFileNames: 'assets/[name].[ext]',
      },
    },
  },
  
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
        target: 'http://localhost:8888/journals_multiple',
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
  
  // Define global constants
  define: {
    'import.meta.env.VITE_OJS_PLUGIN_PATH': JSON.stringify(OJS_PLUGIN_PATH),
  },
}));
