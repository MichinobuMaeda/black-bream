import { defineConfig, mergeConfig } from "vite";
import vitestConfig from "./vitest.config.ts";

export default mergeConfig(
  vitestConfig,
  defineConfig({
    test: {
      threads: false,
      include: ["test/firestore/**/*.test.js"],
      coverage: {
        enabled: false,
      },
    },
  }),
);
