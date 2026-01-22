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
const CARD_WIDTH = (Dimensions.get("window").width - Spacing.lg * 2 - Spacing.md) / 2;

const categoryColors: Record<string, string> = {
  produce: Colors.light.produce,
  dairy: Colors.light.dairy,
  bakery: Colors.light.bakery,
  meat: Colors.light.meat,
  pantry: Colors.light.pantry,
  frozen: Colors.light.frozen,
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
    if (item.expiresIn === 1) return "Expires in 1d";
    return `Expires in ${item.expiresIn}d`;
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
      <View style={styles.iconContainer}>
        <View style={[styles.iconPlaceholder, { backgroundColor: theme.backgroundDefault }]} />
      </View>
      <ThemedText type="caption" style={[styles.category, { color: theme.textSecondary }]}>
        {item.category.toUpperCase()}
      </ThemedText>
      <ThemedText type="h4" numberOfLines={2} style={styles.name}>
        {item.name}
      </ThemedText>
      <View style={styles.footer}>
        <ThemedText type="small" style={{ color: theme.textSecondary }}>
          {getExpirationText()}
        </ThemedText>
        <Feather name="arrow-right" size={16} color={theme.text} />
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
  },
  iconContainer: {
    marginBottom: Spacing.lg,
  },
  iconPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.sm,
  },
  category: {
    fontSize: 10,
    letterSpacing: 0.5,
    marginBottom: Spacing.xs,
  },
  name: {
    marginBottom: Spacing.lg,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
});
