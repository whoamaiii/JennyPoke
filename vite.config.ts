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
