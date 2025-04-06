import { VitePWA } from "vite-plugin-pwa";
import { defineConfig } from "vite";
import { svelte } from "@sveltejs/vite-plugin-svelte";
import { hexFromArgb } from "@material/material-color-utilities";
import config from "./theme.js";
import { generateDynamicScheme } from "./material-theme.js";

const ds = generateDynamicScheme(config, false);

// https://vitejs.dev/config/
export default defineConfig({
  resolve: process.env.VITEST ? { conditions: ["browser"] } : undefined,
  plugins: [
    svelte(),
    VitePWA({
      strategies: "injectManifest",
      srcDir: "src",
      filename: "sw.js",
      registerType: "prompt",
      injectRegister: false,

      pwaAssets: {
        disabled: false,
        config: true,
      },

      manifest: {
        name: config.appName,
        short_name: config.appName,
        description: config.appName,
        theme_color: hexFromArgb(ds.primary),
        background_color: hexFromArgb(ds.surfaceContainer),
        lang: "ja",
      },

      injectManifest: {
        globPatterns: ["**/*.{js,css,html,svg,png,ico}"],
      },

      devOptions: {
        enabled: false,
        navigateFallback: "index.html",
        suppressWarnings: true,
        type: "module",
      },
    }),
  ],
  server: {
    host: "localhost",
    port: 8000,
  },
});
