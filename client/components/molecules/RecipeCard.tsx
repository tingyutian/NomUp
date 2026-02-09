import React from "react";
import { View, StyleSheet, Pressable, Image, GestureResponderEvent } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { Feather } from "@expo/vector-icons";
import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius } from "@/constants/theme";

interface RecipeCardBadge {
  label: string;
  color: string;
  icon: keyof typeof Feather.glyphMap;
}

interface RecipeCardProps {
  title: string;
  thumbnail?: string;
  badge: RecipeCardBadge;
  cardWidth: number;
  index?: number;
  onPress: () => void;
  onLongPress?: () => void;
  testID?: string;
}

export function RecipeCard({
  title,
  thumbnail,
  badge,
  cardWidth,
  index = 0,
  onPress,
  onLongPress,
  testID,
}: RecipeCardProps) {
  const { theme } = useTheme();

  return (
    <Animated.View entering={FadeInDown.delay(index * 50).duration(300)} style={{ width: cardWidth }}>
      <Pressable
        style={[styles.card, { backgroundColor: theme.backgroundDefault }]}
        onPress={onPress}
        onLongPress={onLongPress}
        testID={testID}
      >
        {thumbnail ? (
          <Image source={{ uri: thumbnail }} style={styles.cardImage} />
        ) : (
          <View style={[styles.cardImage, { backgroundColor: theme.backgroundSecondary, alignItems: "center", justifyContent: "center" }]}>
            <Feather name="image" size={32} color={theme.textSecondary} />
          </View>
        )}
        <View style={styles.cardContent}>
          <ThemedText type="bodyMedium" numberOfLines={2} style={styles.cardTitle}>
            {title}
          </ThemedText>
          <View style={[styles.badge, { backgroundColor: badge.color }]}>
            <Feather name={badge.icon} size={12} color="#FFF" />
            <ThemedText type="caption" style={styles.badgeText}>
              {badge.label}
            </ThemedText>
          </View>
        </View>
      </Pressable>
    </Animated.View>
  );
}

export const RECIPE_CARD_GAP = Spacing.md;
export const RECIPE_GRID_PADDING = Spacing.md;
export const RECIPE_MAX_CONTENT_WIDTH = 768;

export function calculateCardWidth(screenWidth: number): number {
  const contentWidth = Math.min(screenWidth, RECIPE_MAX_CONTENT_WIDTH);
  return (contentWidth - RECIPE_GRID_PADDING * 2 - RECIPE_CARD_GAP) / 2;
}

const styles = StyleSheet.create({
  card: {
    borderRadius: BorderRadius.lg,
    overflow: "hidden",
  },
  cardImage: {
    width: "100%",
    height: 140,
  },
  cardContent: {
    padding: Spacing.sm,
    paddingBottom: Spacing.md,
  },
  cardTitle: {
    marginBottom: Spacing.sm,
    lineHeight: 18,
  },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.xs,
    gap: 4,
  },
  badgeText: {
    color: "#FFF",
    fontWeight: "600",
  },
});
