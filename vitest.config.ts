import { defineConfig, mergeConfig } from "vite";
import viteConfig from "./vite.config";

export default mergeConfig(
  viteConfig,
  defineConfig({
    test: {
      exclude: ["functions", "node_modules"],
      coverage: {
        enabled: true,
        include: ["test"],
      },
    },
  }),
);
