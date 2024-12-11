import {
  argbFromHex,
  DynamicScheme,
  Hct,
  hexFromArgb,
  TonalPalette,
  sanitizeDegreesDouble,
} from "@material/material-color-utilities";

export const contrast = { standard: 0, medium: 0.3, high: 0.9 };

/**
 * Generate a color scheme based on a seed color
 * @param {string} seedColor
 * @param {number} contrast
 * @returns {object}
 */
export const generateScheme = (seedColor, contrast) => {
  const sourceColorHct = Hct.fromInt(argbFromHex(seedColor));
  // const hue = sourceColorHct.hue;
  // const chroma = sourceColorHct.chroma;

  const scheme = {};
  const brightnessSet = [
    { key: "light", value: false },
    { key: "dark", value: true },
  ];
  brightnessSet.forEach((brightness) => {
    const ds = new DynamicScheme({
      sourceColorHct,
      variant: "variant",
      contrastLevel: contrast,
      isDark: brightness.value,
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
    const capitalize = (s) => s.charAt(0).toUpperCase() + s.slice(1);
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
      scheme[`${brightness.key}${capitalize(key)}`] = hexFromArgb(ds[key]);
    });
  });

  return scheme;
};
