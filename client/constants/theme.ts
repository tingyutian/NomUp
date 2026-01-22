import { Platform } from "react-native";

// NomUp Color Palette
export const Colors = {
  light: {
    // Primary Palette
    text: "#1A1A1A",
    textSecondary: "#6B6B6B",
    buttonText: "#FFFFFF",
    tabIconDefault: "#6B6B6B",
    tabIconSelected: "#1A1A1A",
    link: "#1A1A1A",
    backgroundRoot: "#F5F1E8",
    backgroundDefault: "#FFFFFF",
    backgroundSecondary: "#F9F7F3",
    backgroundTertiary: "#EFEBE3",
    divider: "#E8E4DB",
    
    // Category Accent Colors (Pastel)
    produce: "#C8E6C9",
    dairy: "#BBDEFB",
    bakery: "#FFF9C4",
    meat: "#F8BBD0",
    pantry: "#D7CCC8",
    frozen: "#B3E5FC",
    
    // Semantic Colors
    expiringYellow: "#FFF176",
    expiringOrange: "#FFB74D",
    expiredRed: "#EF5350",
    success: "#66BB6A",
    
    // Card Colors
    cardBlue: "#BBDEFB",
    cardYellow: "#FFF9C4",
    cardGreen: "#C8E6C9",
    cardPink: "#F8BBD0",
  },
  dark: {
    text: "#ECEDEE",
    textSecondary: "#9BA1A6",
    buttonText: "#FFFFFF",
    tabIconDefault: "#9BA1A6",
    tabIconSelected: "#ECEDEE",
    link: "#ECEDEE",
    backgroundRoot: "#1A1A1A",
    backgroundDefault: "#2A2A2A",
    backgroundSecondary: "#333333",
    backgroundTertiary: "#3D3D3D",
    divider: "#404040",
    
    produce: "#2E7D32",
    dairy: "#1565C0",
    bakery: "#F9A825",
    meat: "#C2185B",
    pantry: "#5D4037",
    frozen: "#0277BD",
    
    expiringYellow: "#FDD835",
    expiringOrange: "#FB8C00",
    expiredRed: "#E53935",
    success: "#43A047",
    
    cardBlue: "#1E3A5F",
    cardYellow: "#4A4520",
    cardGreen: "#1E3A2F",
    cardPink: "#4A2040",
  },
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  "2xl": 24,
  "3xl": 32,
  "4xl": 40,
  "5xl": 48,
  "6xl": 56,
  inputHeight: 48,
  buttonHeight: 56,
};

export const BorderRadius = {
  xs: 6,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  "2xl": 24,
  "3xl": 32,
  full: 9999,
};

export const Typography = {
  // Serif headings (Playfair Display style)
  heroTitle: {
    fontSize: 40,
    lineHeight: 48,
    fontWeight: "700" as const,
    fontFamily: Platform.select({
      ios: "ui-serif",
      android: "serif",
      default: "Georgia, 'Times New Roman', serif",
    }),
  },
  h1: {
    fontSize: 32,
    lineHeight: 40,
    fontWeight: "600" as const,
    fontFamily: Platform.select({
      ios: "ui-serif",
      android: "serif",
      default: "Georgia, 'Times New Roman', serif",
    }),
  },
  h2: {
    fontSize: 28,
    lineHeight: 36,
    fontWeight: "600" as const,
    fontFamily: Platform.select({
      ios: "ui-serif",
      android: "serif",
      default: "Georgia, 'Times New Roman', serif",
    }),
  },
  h3: {
    fontSize: 24,
    lineHeight: 32,
    fontWeight: "500" as const,
    fontFamily: Platform.select({
      ios: "ui-serif",
      android: "serif",
      default: "Georgia, 'Times New Roman', serif",
    }),
  },
  // Sans-serif body (Inter style)
  h4: {
    fontSize: 20,
    lineHeight: 28,
    fontWeight: "600" as const,
  },
  body: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: "400" as const,
  },
  bodyMedium: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: "500" as const,
  },
  small: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "400" as const,
  },
  caption: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: "400" as const,
  },
  link: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: "500" as const,
  },
};

export const Fonts = Platform.select({
  ios: {
    sans: "system-ui",
    serif: "ui-serif",
    rounded: "ui-rounded",
    mono: "ui-monospace",
  },
  default: {
    sans: "normal",
    serif: "serif",
    rounded: "normal",
    mono: "monospace",
  },
  web: {
    sans: "Inter, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Playfair Display, Georgia, 'Times New Roman', serif",
    rounded: "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});

// Category mapping for groceries
export const CategoryColors: Record<string, { light: string; dark: string }> = {
  produce: { light: Colors.light.produce, dark: Colors.dark.produce },
  dairy: { light: Colors.light.dairy, dark: Colors.dark.dairy },
  bakery: { light: Colors.light.bakery, dark: Colors.dark.bakery },
  meat: { light: Colors.light.meat, dark: Colors.dark.meat },
  pantry: { light: Colors.light.pantry, dark: Colors.dark.pantry },
  frozen: { light: Colors.light.frozen, dark: Colors.dark.frozen },
};
