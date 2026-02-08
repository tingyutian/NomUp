import React from "react";
import { View, StyleSheet, Pressable, Dimensions } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import { Feather } from "@expo/vector-icons";
import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { BorderRadius, Spacing, Colors } from "@/constants/theme";
import { GroceryItem } from "@/context/AppContext";

interface ExpiringCardProps {
  item: GroceryItem;
  onPress?: () => void;
  testID?: string;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);
const MAX_CARD_WIDTH = 170;
const CALCULATED_WIDTH = (Dimensions.get("window").width - Spacing.lg * 2 - Spacing.md) / 2;
const CARD_WIDTH = Math.min(CALCULATED_WIDTH, MAX_CARD_WIDTH);

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

export function ExpiringCard({ item, onPress, testID }: ExpiringCardProps) {
  const { theme } = useTheme();
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const getBackgroundColor = () => {
    if (item.expiresIn <= 0) return Colors.light.expiredRed + "30";
    if (item.expiresIn <= 2) return Colors.light.expiringOrange + "30";
    return categoryColors[item.category.toLowerCase()] || Colors.light.dairy;
  };

  const getExpirationText = () => {
    if (item.expiresIn <= 0) return "Expired";
    if (item.expiresIn === 1) return "1 day left";
    return `${item.expiresIn} days left`;
  };

  const getExpirationColor = () => {
    if (item.expiresIn <= 0) return Colors.light.expiredRed;
    if (item.expiresIn <= 2) return Colors.light.expiringOrange;
    return theme.textSecondary;
  };

  return (
    <AnimatedPressable
      testID={testID}
      onPress={onPress}
      onPressIn={() => {
        scale.value = withSpring(0.96, { damping: 15, stiffness: 150 });
      }}
      onPressOut={() => {
        scale.value = withSpring(1, { damping: 15, stiffness: 150 });
      }}
      style={[
        styles.container,
        { backgroundColor: getBackgroundColor() },
        animatedStyle,
      ]}
    >
      <View style={styles.header}>
        <ThemedText type="caption" style={[styles.category, { color: theme.textSecondary }]}>
          {item.category.toUpperCase()}
        </ThemedText>
        <View style={[styles.expirationBadge, { backgroundColor: getExpirationColor() + "20" }]}>
          <Feather name="clock" size={10} color={getExpirationColor()} />
          <ThemedText type="caption" style={[styles.expirationText, { color: getExpirationColor() }]}>
            {getExpirationText()}
          </ThemedText>
        </View>
      </View>
      <ThemedText type="h4" numberOfLines={2} style={styles.name}>
        {item.name}
      </ThemedText>
      <View style={styles.footer}>
        <ThemedText type="small" style={{ color: theme.textSecondary }}>
          {item.quantity > 1 ? `${item.quantity} x ${item.unitAmount || 1} ${item.unit}` : `${item.unitAmount || 1} ${item.unit}`}
        </ThemedText>
        <Feather name="chevron-right" size={16} color={theme.textSecondary} />
      </View>
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  container: {
    width: CARD_WIDTH,
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    marginRight: Spacing.md,
    justifyContent: "space-between",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.md,
  },
  category: {
    fontSize: 10,
    letterSpacing: 0.5,
  },
  expirationBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
    gap: 4,
  },
  expirationText: {
    fontSize: 10,
    fontWeight: "500",
  },
  name: {
    marginBottom: Spacing.md,
    flex: 1,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: Spacing.sm,
  },
});
