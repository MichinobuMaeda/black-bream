import fs from "node:fs/promises";
import {
  argbFromHex,
  DynamicScheme,
  Hct,
  hexFromArgb,
  TonalPalette,
  sanitizeDegreesDouble,
} from "@material/material-color-utilities";
import config from "./theme.js";

/**
 * Generate a dynamic color scheme based on a seed color
 *
 * @param {object} config
 * @param {boolean} isDark
 * @returns {DynamicScheme}
 */
export const generateDynamicScheme = (config, isDark) => {
  const { seedColor, contrastLevel } = config;
  const sourceColorHct = Hct.fromInt(argbFromHex(seedColor));
  return new DynamicScheme({
    sourceColorHct,
    variant: "variant",
    contrastLevel,
    isDark,
    primaryPalette: TonalPalette.fromHueAndChroma(sourceColorHct.hue, 36.0),
    secondaryPalette: TonalPalette.fromHueAndChroma(sourceColorHct.hue, 16.0),
    tertiaryPalette: TonalPalette.fromHueAndChroma(
      sanitizeDegreesDouble(sourceColorHct.hue + 60.0),
      24.0,
    ),
    neutralPalette: TonalPalette.fromHueAndChroma(sourceColorHct.hue, 6.0),
    neutralVariantPalette: TonalPalette.fromHueAndChroma(
      sourceColorHct.hue,
      8.0,
    ),
  });
};

const toKebabuCase = (str) =>
  str.replace(
    /[A-Z]+(?![a-z])|[A-Z]/g,
    ($, ofs) => (ofs ? "-" : "") + $.toLowerCase(),
  );

/**
 * Generate a color scheme based on a seed color
 *
 * @param {object} config
 * @returns {Promise<void>}
 */
const generateThemeCss = async (config) => {
  const { out, link, form } = config;
  let css = "@theme {\n";

  [false, true].forEach((isDark) => {
    const ds = generateDynamicScheme(config, isDark);

    [
      "primary",
      "surfaceTint",
      "onPrimary",
      "primaryContainer",
      "onPrimaryContainer",
      "secondary",
      "onSecondary",
      "secondaryContainer",
      "onSecondaryContainer",
      "tertiary",
      "onTertiary",
      "tertiaryContainer",
      "onTertiaryContainer",
      "error",
      "onError",
      "errorContainer",
      "onErrorContainer",
      "background",
      "onBackground",
      "surface",
      "onSurface",
      "surfaceVariant",
      "onSurfaceVariant",
      "outline",
      "outlineVariant",
      "shadow",
      "scrim",
      "inverseSurface",
      "inverseOnSurface",
      "inversePrimary",
      "primaryFixed",
      "onPrimaryFixed",
      "primaryFixedDim",
      "onPrimaryFixedVariant",
      "secondary",
      "onSecondaryFixed",
      "secondaryFixedDim",
      "onSecondaryFixedVariant",
      "tertiaryFixed",
      "onTertiaryFixed",
      "tertiaryFixedDim",
      "onTertiaryFixedVariant",
      "surfaceDim",
      "surfaceBright",
      "surfaceContainerLowest",
      "surfaceContainerLow",
      "surfaceContainer",
      "surfaceContainerHigh",
      "surfaceContainerHighest",
    ].forEach((key) => {
      css += `  --color-${isDark ? "dark" : "light"}-${toKebabuCase(key)}: ${hexFromArgb(ds[key])};\n`;
    });
  });

  css += `  --color-light-link: var(${link.light});\n`;
  css += `  --color-dark-link: var(${link.dark});\n`;
  css += `  --color-light-form: var(${form.bg.light});\n`;
  css += `  --color-light-on-form: var(${form.bg.dark});\n`;
  css += `  --color-dark-form: var(${form.text.light});\n`;
  css += `  --color-dark-on-form: var(${form.text.dark});\n`;

  css += "}\n";

  try {
    await fs.writeFile(out, css);
  } catch (err) {
    console.error(err);
  }
};

await generateThemeCss(config);
