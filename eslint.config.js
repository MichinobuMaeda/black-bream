import js from "@eslint/js";
import globals from "globals";
import pluginReact from "eslint-plugin-react";
import { defineConfig } from "eslint/config";
import jsdoc from "eslint-plugin-jsdoc";

export default defineConfig([
  {
    ignores: ["**/dist/**", "**/docs/**", "**/src/sw.js"],
  },
  jsdoc.configs["flat/recommended"],
  {
    files: ["**/*.js"],
    plugins: {
      jsdoc,
    },
    rules: {
      "jsdoc/require-description": "warn",
    },
  },
  {
    files: ["**/*.{js,jsx}"],
    plugins: {
      jsdoc,
    },
    settings: {
      jsdoc: {
        preferredTypes: {
          "React.ReactNode": "React.ReactNode",
          "JSX.Element": "JSX.Element",
        },
        mode: "typescript",
      },
    },
    rules: {
      "jsdoc/no-undefined-types": [
        "warn",
        {
          definedTypes: [
            "React",
            "React.ReactNode",
            "JSX",
            "JSX.Element",
            "HTMLElement",
            "Event",
            "MouseEvent",
            "KeyboardEvent",
            "FormEvent",
            "ChangeEvent",
            "InputEvent",
            "FocusEvent",
            "ClipboardEvent",
            "DragEvent",
            "TouchEvent",
            "WheelEvent",
            "AnimationEvent",
            "TransitionEvent",
            "PointerEvent",
            "CompositionEvent",
            "UIEvent",
            "SyntheticEvent",
          ],
        },
      ],
      "jsdoc/check-tag-names": [
        "warn",
        {
          definedTags: ["component", "generated", "vitest-environment"],
        },
      ],
    },
  },
  {
    files: ["**/*.{js,mjs,cjs,jsx}"],
    plugins: { js },
    extends: ["js/recommended"],
    languageOptions: { globals: globals.browser },
  },
  {
    ...pluginReact.configs.flat.recommended,
    settings: {
      react: {
        version: "19.0.0",
      },
    },
  },
  {
    rules: {
      "react/react-in-jsx-scope": "off",
    },
  },
]);
