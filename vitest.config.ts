import { defineConfig, mergeConfig } from "vitest/config";
import viteConfig from "./vite.config.js";

export default mergeConfig(
  viteConfig,
  defineConfig({
    test: {
      globals: true,
      environment: "jsdom",
      setupFiles: ["./tests/setup.ts"],
      include: ["**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}"],
      exclude: ["node_modules", "dist", ".idea", ".git", ".cache"],
      coverage: {
        provider: "v8",
        reporter: ["text", "json", "html"],
        exclude: [
          "node_modules/",
          "**/*.{test,spec}.{js,ts,jsx,tsx}",
          "vite.config.*",
          "vitest.config.*",
          "**/tests/**",
          "**/coverage/**",
          "**/dist/**",
          "**/Svg*.jsx",
          "*.config.js",
          "src/i18n.js",
          "src/state.js",
          "src/sw.js",
          "src/version.js",
          "**/*.jsx",
        ],
      },
    },
  }),
);
