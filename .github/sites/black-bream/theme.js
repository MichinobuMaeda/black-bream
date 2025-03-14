const contrast = { standard: 0, medium: 0.3, high: 0.9 };

export default {
  appName: "Black bream",
  seedColor: "#FFDE3F",
  contrastLevel: contrast.standard,
  link: { light: "--color-blue-700", dark: "--color-blue-300" },
  form: {
    bg: {
      light: "--color-light-surface-container-lowest",
      dark: "--color-dark-surface-container-lowest",
    },
    text: {
      light: "--color-light-on-surface",
      dark: "--color-dark-on-surface",
    },
  },
  out: "src/theme.css",
};
