import React from "react";
import { View, StyleSheet, ScrollView, Pressable, Image } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";
import { useRoute, useNavigation } from "@react-navigation/native";
import type { RouteProp } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import Animated, { FadeInDown } from "react-native-reanimated";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius, Colors } from "@/constants/theme";
import type { RootStackParamList, GeneratedRecipe } from "@/navigation/RootStackNavigator";

type RouteProps = RouteProp<RootStackParamList, "RecipeResults">;
type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

interface RecipeCardProps {
  recipe: GeneratedRecipe;
  index: number;
  onPress: () => void;
}

function RecipeCard({ recipe, index, onPress }: RecipeCardProps) {
  const { theme } = useTheme();
  const isFullMatch = recipe.matchScore >= 90;

  return (
    <Animated.View entering={FadeInDown.delay(index * 100).duration(300)}>
      <Pressable
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          onPress();
        }}
        style={[styles.card, { backgroundColor: theme.backgroundDefault }]}
        testID={`recipe-card-${index}`}
      >
        {recipe.thumbnail ? (
          <Image source={{ uri: recipe.thumbnail }} style={styles.thumbnail} />
        ) : (
          <View style={[styles.thumbnailPlaceholder, { backgroundColor: theme.backgroundSecondary }]}>
            <Feather name="book-open" size={40} color={theme.textSecondary} />
          </View>
        )}

        <View style={styles.cardContent}>
          <View style={styles.cardHeader}>
            <ThemedText type="h4" numberOfLines={2} style={styles.recipeTitle}>
              {recipe.title}
            </ThemedText>
            <View
              style={[
                styles.matchBadge,
                { backgroundColor: isFullMatch ? Colors.light.success : Colors.light.expiringOrange },
              ]}
            >
              <Feather name={isFullMatch ? "star" : "check"} size={12} color="#FFF" />
              <ThemedText type="caption" style={styles.matchText}>
                {recipe.matchScore}%
              </ThemedText>
            </View>
          </View>

          <View style={styles.metaRow}>
            <View style={styles.metaItem}>
              <Feather name="clock" size={14} color={theme.textSecondary} />
              <ThemedText type="small" style={{ color: theme.textSecondary }}>
                {recipe.totalTime} min
              </ThemedText>
            </View>
            <View style={styles.metaItem}>
              <Feather name="users" size={14} color={theme.textSecondary} />
              <ThemedText type="small" style={{ color: theme.textSecondary }}>
                {recipe.servings} servings
              </ThemedText>
            </View>
          </View>

          <View style={styles.ingredientsSection}>
            <ThemedText type="caption" style={{ color: theme.textSecondary, marginBottom: Spacing.xs }}>
              USING YOUR INGREDIENTS
            </ThemedText>
            <ThemedText type="small" numberOfLines={2}>
              {recipe.usedIngredients.map((i) => i.name).join(", ")}
            </ThemedText>
          </View>

          {recipe.missingIngredients.length > 0 ? (
            <View style={styles.missingSection}>
              <ThemedText type="caption" style={{ color: Colors.light.expiringOrange, marginBottom: Spacing.xs }}>
                NEED TO BUY ({recipe.missingIngredients.length})
              </ThemedText>
              <ThemedText type="small" numberOfLines={1} style={{ color: theme.textSecondary }}>
                {recipe.missingIngredients.map((i) => i.name).join(", ")}
              </ThemedText>
            </View>
          ) : null}

          <View style={[styles.viewButton, { borderColor: theme.divider }]}>
            <ThemedText type="bodyMedium">View Recipe</ThemedText>
            <Feather name="arrow-right" size={16} color={theme.text} />
          </View>
        </View>
      </Pressable>
    </Animated.View>
  );
}

export default function RecipeResultsScreen() {
  const { theme } = useTheme();
  const route = useRoute<RouteProps>();
  const navigation = useNavigation<NavigationProp>();
  const headerHeight = useHeaderHeight();
  const insets = useSafeAreaInsets();

  const { recipes, selectedIngredients } = route.params;

  const handleRecipePress = (recipe: GeneratedRecipe) => {
    navigation.navigate("AIRecipeDetail", { recipe, selectedIngredients });
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.backgroundRoot }]}
      contentContainerStyle={[
        styles.content,
        { paddingTop: headerHeight + Spacing.lg, paddingBottom: insets.bottom + Spacing.xl },
      ]}
      showsVerticalScrollIndicator={false}
    >
      <Animated.View entering={FadeInDown.duration(200)}>
        <ThemedText type="h2" style={styles.title}>
          Recipe Ideas
        </ThemedText>
        <ThemedText type="body" style={{ color: theme.textSecondary, marginBottom: Spacing.xl }}>
          Based on your {selectedIngredients.length} expiring ingredient{selectedIngredients.length !== 1 ? "s" : ""}
        </ThemedText>
      </Animated.View>

      {recipes.map((recipe, index) => (
        <RecipeCard
          key={recipe.id}
          recipe={recipe}
          index={index}
          onPress={() => handleRecipePress(recipe)}
        />
      ))}

      {recipes.length === 0 ? (
        <View style={styles.emptyState}>
          <Feather name="frown" size={48} color={theme.textSecondary} />
          <ThemedText type="body" style={{ color: theme.textSecondary, textAlign: "center", marginTop: Spacing.md }}>
            Couldn't find recipe ideas.{"\n"}Try selecting different ingredients.
          </ThemedText>
        </View>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingHorizontal: Spacing.lg,
  },
  title: {
    marginBottom: Spacing.xs,
  },
  card: {
    borderRadius: BorderRadius.xl,
    overflow: "hidden",
    marginBottom: Spacing.lg,
  },
  thumbnail: {
    width: "100%",
    height: 180,
  },
  thumbnailPlaceholder: {
    width: "100%",
    height: 140,
    alignItems: "center",
    justifyContent: "center",
  },
  cardContent: {
    padding: Spacing.lg,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginBottom: Spacing.md,
  },
  recipeTitle: {
    flex: 1,
    marginRight: Spacing.md,
  },
  matchBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
    gap: 4,
  },
  matchText: {
    color: "#FFF",
    fontWeight: "600",
  },
  metaRow: {
    flexDirection: "row",
    gap: Spacing.lg,
    marginBottom: Spacing.md,
  },
  metaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
  },
  ingredientsSection: {
    marginBottom: Spacing.md,
  },
  missingSection: {
    marginBottom: Spacing.md,
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: "rgba(0,0,0,0.05)",
  },
  viewButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing.md,
    borderTopWidth: 1,
    marginTop: Spacing.sm,
    gap: Spacing.sm,
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing["3xl"],
  },
});
