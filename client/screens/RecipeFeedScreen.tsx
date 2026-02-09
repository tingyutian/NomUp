import React from "react";
import {
  View,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  useWindowDimensions,
} from "react-native";
import { useQuery } from "@tanstack/react-query";
import { useRoute, useNavigation } from "@react-navigation/native";
import type { RouteProp } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useHeaderHeight } from "@react-navigation/elements";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import Animated, { FadeIn } from "react-native-reanimated";
import { ThemedText } from "@/components/ThemedText";
import {
  RecipeCard,
  calculateCardWidth,
  RECIPE_GRID_PADDING,
  RECIPE_MAX_CONTENT_WIDTH,
} from "@/components/molecules/RecipeCard";
import { useTheme } from "@/hooks/useTheme";
import { useApp } from "@/context/AppContext";
import { getApiUrl } from "@/lib/query-client";
import { Colors, Spacing } from "@/constants/theme";
import type { RootStackParamList, ScoredRecipe } from "@/navigation/RootStackNavigator";

type RecipeFeedRouteProp = RouteProp<RootStackParamList, "RecipeFeed">;
type RecipeFeedNavProp = NativeStackNavigationProp<RootStackParamList, "RecipeFeed">;

function LoadingState({ itemName }: { itemName: string }) {
  const { theme } = useTheme();
  const headerHeight = useHeaderHeight();

  return (
    <Animated.View 
      entering={FadeIn.duration(300)} 
      style={[styles.loadingContainer, { paddingTop: headerHeight + Spacing.xl }]}
    >
      <ActivityIndicator size="large" color={theme.text} />
      <ThemedText type="h4" style={styles.loadingTitle}>
        Finding recipes with {itemName}...
      </ThemedText>
      <ThemedText type="body" style={{ color: theme.textSecondary, textAlign: "center" }}>
        Matching ingredients from your pantry
      </ThemedText>
    </Animated.View>
  );
}

function EmptyState({ itemName }: { itemName: string }) {
  const { theme } = useTheme();
  const headerHeight = useHeaderHeight();

  return (
    <View style={[styles.emptyContainer, { paddingTop: headerHeight + Spacing.xl }]}>
      <Feather name="book-open" size={64} color={theme.textSecondary} />
      <ThemedText type="h4" style={styles.emptyTitle}>
        No recipes found
      </ThemedText>
      <ThemedText type="body" style={{ color: theme.textSecondary, textAlign: "center" }}>
        We couldn't find recipes featuring {itemName}. Try searching with a different ingredient.
      </ThemedText>
    </View>
  );
}

function getBadge(recipe: ScoredRecipe) {
  const isFullMatch = recipe.matchScore === 100;
  if (isFullMatch) {
    return { label: "Ready!", color: Colors.light.success, icon: "star" as const };
  }
  return {
    label: `${recipe.stats.matched}/${recipe.stats.total}`,
    color: recipe.matchScore >= 70 ? Colors.light.success : Colors.light.expiringOrange,
    icon: "check" as const,
  };
}

export default function RecipeFeedScreen() {
  const route = useRoute<RecipeFeedRouteProp>();
  const navigation = useNavigation<RecipeFeedNavProp>();
  const { theme } = useTheme();
  const headerHeight = useHeaderHeight();
  const insets = useSafeAreaInsets();
  const { width: screenWidth } = useWindowDimensions();
  const { groceries } = useApp();
  const { itemName } = route.params;

  const cardWidth = calculateCardWidth(screenWidth);

  const { data, isLoading, error } = useQuery<{ recipes: ScoredRecipe[] }>({
    queryKey: ["/api/recipes/by-ingredient", itemName],
    queryFn: async () => {
      const baseUrl = getApiUrl();
      const pantryJson = encodeURIComponent(
        JSON.stringify(groceries.map((g) => ({ name: g.name, category: g.category })))
      );
      const url = new URL(
        `/api/recipes/by-ingredient/${encodeURIComponent(itemName)}?pantry=${pantryJson}`,
        baseUrl
      );
      const response = await fetch(url.toString());
      if (!response.ok) {
        throw new Error("Failed to fetch recipes");
      }
      return response.json();
    },
    staleTime: 1000 * 60 * 5,
  });

  const recipes = data?.recipes || [];

  if (isLoading) {
    return (
      <View style={[styles.container, { backgroundColor: theme.backgroundRoot }]}>
        <LoadingState itemName={itemName} />
      </View>
    );
  }

  if (error || recipes.length === 0) {
    return (
      <View style={[styles.container, { backgroundColor: theme.backgroundRoot }]}>
        <EmptyState itemName={itemName} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.backgroundRoot }]}>
      <FlatList
        data={recipes}
        numColumns={2}
        keyExtractor={(item) => item.id}
        renderItem={({ item, index }) => (
          <RecipeCard
            title={item.name}
            thumbnail={item.thumbnail}
            badge={getBadge(item)}
            cardWidth={cardWidth}
            index={index}
            onPress={() => navigation.navigate("RecipeDetail", { recipe: item })}
            testID={`recipe-card-${item.id}`}
          />
        )}
        columnWrapperStyle={styles.row}
        contentContainerStyle={[
          styles.grid,
          {
            paddingTop: headerHeight + Spacing.md,
            paddingBottom: insets.bottom + Spacing.xl,
            maxWidth: RECIPE_MAX_CONTENT_WIDTH,
            alignSelf: "center" as const,
            width: "100%" as unknown as number,
          },
        ]}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  grid: {
    paddingHorizontal: RECIPE_GRID_PADDING,
  },
  row: {
    justifyContent: "space-between",
    marginBottom: Spacing.md,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: Spacing.xl,
    gap: Spacing.lg,
  },
  loadingTitle: {
    textAlign: "center",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: Spacing.xl,
    gap: Spacing.md,
  },
  emptyTitle: {
    marginTop: Spacing.md,
  },
});
