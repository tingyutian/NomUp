import React from "react";
import {
  View,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  Pressable,
  Image,
} from "react-native";
import { useQuery } from "@tanstack/react-query";
import { useRoute, useNavigation } from "@react-navigation/native";
import type { RouteProp } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useHeaderHeight } from "@react-navigation/elements";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import Animated, { FadeIn, FadeInDown } from "react-native-reanimated";
import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { useApp } from "@/context/AppContext";
import { getApiUrl } from "@/lib/query-client";
import { Colors, Spacing, BorderRadius } from "@/constants/theme";
import type { RootStackParamList, ScoredRecipe } from "@/navigation/RootStackNavigator";

type RecipeFeedRouteProp = RouteProp<RootStackParamList, "RecipeFeed">;
type RecipeFeedNavProp = NativeStackNavigationProp<RootStackParamList, "RecipeFeed">;

interface RecipeCardProps {
  recipe: ScoredRecipe;
  index: number;
  onPress: () => void;
}

function RecipeCard({ recipe, index, onPress }: RecipeCardProps) {
  const { theme } = useTheme();
  const isFullMatch = recipe.matchScore === 100;
  const badgeColor = recipe.matchScore >= 70 ? Colors.light.success : Colors.light.expiringOrange;

  return (
    <Animated.View entering={FadeInDown.delay(index * 50).duration(300)}>
      <Pressable
        style={[styles.card, { backgroundColor: theme.backgroundDefault }]}
        onPress={onPress}
        testID={`recipe-card-${recipe.id}`}
      >
        <Image source={{ uri: recipe.thumbnail }} style={styles.cardImage} />
        <View style={styles.cardContent}>
          <ThemedText type="bodyMedium" numberOfLines={2} style={styles.cardTitle}>
            {recipe.name}
          </ThemedText>
          <View style={[styles.badge, { backgroundColor: badgeColor }]}>
            {isFullMatch ? (
              <>
                <Feather name="star" size={12} color="#FFF" />
                <ThemedText type="caption" style={styles.badgeText}>Ready!</ThemedText>
              </>
            ) : (
              <>
                <Feather name="check" size={12} color="#FFF" />
                <ThemedText type="caption" style={styles.badgeText}>
                  {recipe.stats.matched}/{recipe.stats.total}
                </ThemedText>
              </>
            )}
          </View>
        </View>
      </Pressable>
    </Animated.View>
  );
}

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

export default function RecipeFeedScreen() {
  const route = useRoute<RecipeFeedRouteProp>();
  const navigation = useNavigation<RecipeFeedNavProp>();
  const { theme } = useTheme();
  const headerHeight = useHeaderHeight();
  const insets = useSafeAreaInsets();
  const { groceries } = useApp();
  const { itemName } = route.params;

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
            recipe={item}
            index={index}
            onPress={() => navigation.navigate("RecipeDetail", { recipe: item })}
          />
        )}
        columnWrapperStyle={styles.row}
        contentContainerStyle={[
          styles.grid,
          { paddingTop: headerHeight + Spacing.md, paddingBottom: insets.bottom + Spacing.xl },
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
    paddingHorizontal: Spacing.md,
  },
  row: {
    gap: Spacing.md,
    marginBottom: Spacing.md,
  },
  card: {
    flex: 1,
    borderRadius: BorderRadius.lg,
    overflow: "hidden",
  },
  cardImage: {
    width: "100%",
    height: 140,
  },
  cardContent: {
    padding: Spacing.md,
  },
  cardTitle: {
    marginBottom: Spacing.sm,
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
