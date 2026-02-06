import React from "react";
import { View, StyleSheet, ViewStyle } from "react-native";
import { ThemedText } from "@/components/ThemedText";
import { BorderRadius, Spacing, Colors } from "@/constants/theme";
import { useTheme } from "@/hooks/useTheme";

interface BadgeProps {
  label: string;
  variant?: "default" | "expiring" | "expired" | "success" | "category";
  category?: string;
  style?: ViewStyle;
}

const categoryColors: Record<string, string> = {
  produce: Colors.light.produce,
  dairy: Colors.light.dairy,
  bakery: Colors.light.bakery,
  meat: Colors.light.meat,
  beverages: Colors.light.beverages,
  grains: Colors.light.grains,
  snacks: Colors.light.snacks,
  condiments: Colors.light.condiments,
};

export function Badge({ label, variant = "default", category, style }: BadgeProps) {
  const { theme, isDark } = useTheme();

  const getBackgroundColor = () => {
    switch (variant) {
      case "expiring":
        return theme.expiringYellow;
      case "expired":
        return theme.expiredRed;
      case "success":
        return theme.success;
      case "category":
        return category ? categoryColors[category.toLowerCase()] || theme.backgroundSecondary : theme.backgroundSecondary;
      default:
        return theme.backgroundSecondary;
    }
  };

  const getTextColor = () => {
    switch (variant) {
      case "expired":
        return "#FFFFFF";
      case "success":
        return "#FFFFFF";
      default:
        return theme.text;
    }
  };

  return (
    <View style={[styles.badge, { backgroundColor: getBackgroundColor() }, style]}>
      <ThemedText
        type="caption"
        style={[styles.label, { color: getTextColor() }]}
      >
        {label.toUpperCase()}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.xs,
  },
  label: {
    fontSize: 10,
    fontWeight: "600",
    letterSpacing: 0.5,
  },
});
