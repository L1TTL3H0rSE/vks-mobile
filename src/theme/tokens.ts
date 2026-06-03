export const colors = {
  textPrimary: "#000000E0",
  textSecondary: "#00000099",
  textPlaceholder: "#BFBFBF",
  textLight: "#FFFFFF",
  primary: "#0075FF",
  primaryActive: "#0958D9",
  primaryDark: "#1347C8",
  primaryLight: "#F8FAFD",
  primaryOutline: "#91CAFF",
  secondary: "#6C757D",
  secondaryLight: "#DAE1E3",
  secondaryBorder: "#EAEBF1",
  error: "#EF5350",
  errorActive: "#D9363E",
  success: "#52C41A",
  warning: "#FAAD14",
  background: "#F8FAFD",
  backgroundSecondary: "#E6F4FF",
  surface: "#FFFFFF",
  placeholder: "#F5F6F8",
  divider: "#0000001F",
  blackout: "#0000001A",
  darkSurface: "#121722",
  darkOverlay: "rgba(18, 23, 34, 0.72)",
} as const;

export const spacing = {
  xxs: 2,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
} as const;

export const radius = {
  sm: 6,
  md: 8,
  lg: 12,
  pill: 999,
} as const;

export const typography = {
  h1: {
    fontSize: 28,
    lineHeight: 34,
    fontWeight: "800",
  },
  h2: {
    fontSize: 22,
    lineHeight: 28,
    fontWeight: "800",
  },
  h3: {
    fontSize: 18,
    lineHeight: 24,
    fontWeight: "700",
  },
  body: {
    fontSize: 16,
    lineHeight: 22,
    fontWeight: "400",
  },
  bodyStrong: {
    fontSize: 16,
    lineHeight: 22,
    fontWeight: "700",
  },
  caption: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: "400",
  },
  captionStrong: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: "700",
  },
  button: {
    fontSize: 15,
    lineHeight: 20,
    fontWeight: "700",
  },
} as const;

export const shadow = {
  card: {
    shadowColor: "#1347C8",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.06,
    shadowRadius: 16,
    elevation: 2,
  },
} as const;
