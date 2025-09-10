import path from "path";
import { VitePWA } from "vite-plugin-pwa";
import { defineConfig } from "vite";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { versionPlugin } from "./tools/generate-version.js";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    versionPlugin({
      input: path.join("package.json"),
      output: path.join("src", "version.js"),
    }),
    tailwindcss(),
    react(),
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
        name: "Black bream",
        short_name: "Black bream",
        description: "Black bream",
        theme_color: "#c37d9e",
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

      includeAssets: ["src/assets/images/*.{svg,png,jpg,jpeg}"],
    }),
  ],
});
