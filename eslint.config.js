import js from "@eslint/js";
import svelte from "eslint-plugin-svelte";
import svelteConfig from "./svelte.config.js";
import prettier from "eslint-config-prettier";
import globals from "globals";

export default [
  js.configs.recommended,
  ...svelte.configs["flat/recommended"],
  {
    files: [
      "**/*.svelte",
      "*.svelte",
      "**/*.svelte.ts",
      "*.svelte.ts",
      "**/*.svelte.js",
      "*.svelte.js",
    ],
    languageOptions: {
      parserOptions: {
        svelteConfig,
      },
    },
  },
  prettier,
  ...svelte.configs["flat/prettier"],
  {
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node,
      },
    },
    rules: {},
  },
  {
    ignores: [
      "build/",
      ".svelte-kit/",
      "dist/",
      "src/lib/PWABadge.svelte",
      "coverage/",
      "functions/coverage/",
    ],
  },
];
