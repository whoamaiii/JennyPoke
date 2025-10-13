import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { VitePWA } from 'vite-plugin-pwa';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  publicDir: 'public',
  server: {
    host: "::",
    port: 8080,
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // React ecosystem
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          // UI libraries
          'ui-vendor': ['@radix-ui/react-dialog', '@radix-ui/react-dropdown-menu', '@radix-ui/react-tooltip'],
          // Animation libraries
          'animation-vendor': ['gsap'],
          // Touch libraries
          'touch-vendor': ['hammerjs'],
          // HTTP libraries
          'http-vendor': ['axios'],
          // Theme libraries
          'theme-vendor': ['next-themes'],
          // Query libraries
          'query-vendor': ['@tanstack/react-query'],
          // Icon libraries
          'icons-vendor': ['lucide-react'],
          // Notification libraries
          'notification-vendor': ['sonner'],
        },
      },
    },
    // Increase chunk size warning limit since we're now splitting
    chunkSizeWarningLimit: 1000,
  },
  plugins: [react(), mode === "development" && componentTagger(), VitePWA({
    manifest: {
      name: 'Pokémon Pack Opener',
      short_name: 'PokéPacks',
      start_url: '/',
      display: 'standalone',
      background_color: '#ffffff',
      theme_color: '#0ea5e9',
      icons: [
        { src: '/favicon.ico', sizes: '64x64 32x32 24x24 16x16', type: 'image/x-icon' }
      ]
    },
    registerType: 'autoUpdate',
    includeAssets: ['favicon.ico', 'manifest.json']
  })].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
