import { defineConfig, mergeConfig } from "vite";
import viteConfig from "./vite.config";
import { coverageConfigDefaults } from "vitest/config";
import { svelteTesting } from "@testing-library/svelte/vite";

export default mergeConfig(
  viteConfig,
  defineConfig({
    plugins: [svelteTesting()],
    test: {
      setupFiles: ["./vitest.setup.js"],
      environment: "jsdom",
      deps: {
        inline: ["vitest-canvas-mock"],
      },
      threads: false,
      environmentOptions: {
        jsdom: {
          resources: "usable",
        },
      },
      exclude: ["functions", "node_modules"],
      coverage: {
        enabled: true,
        include: ["src/**/*.js"],
        exclude: [
          "src/main.js",
          "src/sw.js",
          "src/vite-env.d.ts",
          "src/lib/coarse-paper/*",
          "src/lib/icons/*",
          ...coverageConfigDefaults.exclude,
        ],
      },
    },
  }),
);
