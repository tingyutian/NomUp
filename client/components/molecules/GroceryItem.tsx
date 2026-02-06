import React from "react";
import { View, StyleSheet, Pressable } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import { Feather } from "@expo/vector-icons";
import { ThemedText } from "@/components/ThemedText";
import { Badge } from "@/components/atoms/Badge";
import { useTheme } from "@/hooks/useTheme";
import { BorderRadius, Spacing, Colors } from "@/constants/theme";
import { GroceryItem as GroceryItemType } from "@/context/AppContext";

interface GroceryItemProps {
  item: GroceryItemType;
  onPress?: () => void;
  onEdit?: () => void;
  showEdit?: boolean;
  compact?: boolean;
  testID?: string;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

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

export function GroceryItemCard({
  item,
  onPress,
  onEdit,
  showEdit = false,
  compact = false,
  testID,
}: GroceryItemProps) {
  const { theme } = useTheme();
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const getExpirationColor = () => {
    if (item.expiresIn <= 0) return theme.expiredRed;
    if (item.expiresIn <= 2) return theme.expiringOrange;
    if (item.expiresIn <= 5) return theme.expiringYellow;
    return theme.backgroundSecondary;
  };

  const getExpirationText = () => {
    if (item.expiresIn < 0) return `Expired ${Math.abs(item.expiresIn)}d ago`;
    if (item.expiresIn === 0) return "Expires today";
    if (item.expiresIn === 1) return "Expires tomorrow";
    return `Exp. in ${item.expiresIn}d`;
  };

  const categoryColor = categoryColors[item.category.toLowerCase()] || Colors.light.grains;

  return (
    <AnimatedPressable
      testID={testID}
      onPress={onPress}
      onPressIn={() => {
        scale.value = withSpring(0.98, { damping: 15, stiffness: 150 });
      }}
      onPressOut={() => {
        scale.value = withSpring(1, { damping: 15, stiffness: 150 });
      }}
      style={[
        styles.container,
        { backgroundColor: theme.backgroundDefault },
        compact ? styles.compactContainer : undefined,
        animatedStyle,
      ]}
    >
      <View style={[styles.categoryIndicator, { backgroundColor: categoryColor }]} />
      <View style={styles.content}>
        <View style={styles.topRow}>
          <View style={styles.nameContainer}>
            <ThemedText type="bodyMedium" numberOfLines={1}>
              {item.name}
            </ThemedText>
            <Badge
              label={item.category}
              variant="category"
              category={item.category}
              style={styles.categoryBadge}
            />
          </View>
          {showEdit ? (
            <Pressable onPress={onEdit} style={styles.editButton}>
              <Feather name="edit-2" size={16} color={theme.textSecondary} />
            </Pressable>
          ) : null}
        </View>
        <View style={styles.bottomRow}>
          <ThemedText type="small" style={{ color: theme.textSecondary }}>
            {item.quantity} {item.unit}
          </ThemedText>
          <View style={[styles.expirationBadge, { backgroundColor: getExpirationColor() }]}>
            <ThemedText type="caption" style={styles.expirationText}>
              {getExpirationText()}
            </ThemedText>
          </View>
        </View>
        {item.price > 0 ? (
          <ThemedText type="small" style={{ color: theme.textSecondary, marginTop: Spacing.xs }}>
            ${item.price.toFixed(2)}
          </ThemedText>
        ) : null}
      </View>
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    borderRadius: BorderRadius.lg,
    overflow: "hidden",
    marginBottom: Spacing.md,
  },
  compactContainer: {
    marginBottom: Spacing.sm,
  },
  categoryIndicator: {
    width: 4,
  },
  content: {
    flex: 1,
    padding: Spacing.lg,
  },
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  nameContainer: {
    flex: 1,
    marginRight: Spacing.md,
  },
  categoryBadge: {
    alignSelf: "flex-start",
    marginTop: Spacing.xs,
  },
  editButton: {
    padding: Spacing.xs,
  },
  bottomRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: Spacing.sm,
  },
  expirationBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.xs,
  },
  expirationText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#1A1A1A",
  },
});
