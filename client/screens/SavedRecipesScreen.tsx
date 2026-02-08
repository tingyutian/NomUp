import React, { useState } from "react";
import {
  View,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  Pressable,
  Image,
  Dimensions,
  Modal,
} from "react-native";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useHeaderHeight } from "@react-navigation/elements";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import Animated, { FadeIn, FadeInDown } from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { useApp } from "@/context/AppContext";
import { getApiUrl } from "@/lib/query-client";
import { Colors, Spacing, BorderRadius } from "@/constants/theme";
import { recomputeIngredientMatch } from "@/utils/ingredientMatcher";
import type { RootStackParamList, ScoredRecipe } from "@/navigation/RootStackNavigator";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const CARD_GAP = Spacing.md;
const HORIZONTAL_PADDING = Spacing.md;
const CARD_WIDTH = (SCREEN_WIDTH - HORIZONTAL_PADDING * 2 - CARD_GAP) / 2;

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

interface SavedRecipeData {
  id: string;
  recipeId: string;
  name: string;
  thumbnail: string | null;
  category: string | null;
  instructions: string | null;
  matchScore: number;
  matchedIngredients: string[];
  missingIngredients: string[];
  ingredients: string[];
  stats: { total: number; matched: number; missing: number } | null;
  enhancedSteps: Array<{
    stepNumber: number;
    instruction: string;
    duration?: number;
    temperature?: string;
  }> | null;
  savedAt: string;
}

interface RecipeCardProps {
  recipe: SavedRecipeData;
  index: number;
  onPress: () => void;
  onLongPress: () => void;
}

function RecipeCard({ recipe, index, onPress, onLongPress }: RecipeCardProps) {
  const { theme } = useTheme();

  return (
    <Animated.View entering={FadeInDown.delay(index * 50).duration(300)}>
      <Pressable
        style={[styles.card, { backgroundColor: theme.backgroundDefault }]}
        onPress={onPress}
        onLongPress={onLongPress}
        testID={`saved-recipe-card-${recipe.recipeId}`}
      >
        {recipe.thumbnail ? (
          <Image source={{ uri: recipe.thumbnail }} style={styles.cardImage} />
        ) : (
          <View style={[styles.cardImage, { backgroundColor: theme.backgroundSecondary, alignItems: "center", justifyContent: "center" }]}>
            <Feather name="image" size={32} color={theme.textSecondary} />
          </View>
        )}
        <View style={styles.cardContent}>
          <ThemedText type="bodyMedium" numberOfLines={2} style={styles.cardTitle}>
            {recipe.name}
          </ThemedText>
          <View style={[styles.badge, { backgroundColor: Colors.light.expiredRed }]}>
            <Feather name="heart" size={12} color="#FFF" />
            <ThemedText type="caption" style={styles.badgeText}>Saved</ThemedText>
          </View>
        </View>
      </Pressable>
    </Animated.View>
  );
}

function LoadingState() {
  const { theme } = useTheme();
  const headerHeight = useHeaderHeight();

  return (
    <Animated.View 
      entering={FadeIn.duration(300)} 
      style={[styles.loadingContainer, { paddingTop: headerHeight + Spacing.xl }]}
    >
      <ActivityIndicator size="large" color={theme.text} />
      <ThemedText type="h4" style={styles.loadingTitle}>
        Loading saved recipes...
      </ThemedText>
    </Animated.View>
  );
}

function EmptyState() {
  const { theme } = useTheme();
  const headerHeight = useHeaderHeight();

  return (
    <View style={[styles.emptyContainer, { paddingTop: headerHeight + Spacing.xl }]}>
      <Feather name="heart" size={64} color={theme.textSecondary} />
      <ThemedText type="h4" style={styles.emptyTitle}>
        No saved recipes
      </ThemedText>
      <ThemedText type="body" style={{ color: theme.textSecondary, textAlign: "center" }}>
        Save your favorite recipes to access them quickly later.
      </ThemedText>
    </View>
  );
}

export default function SavedRecipesScreen() {
  const navigation = useNavigation<NavigationProp>();
  const { theme } = useTheme();
  const headerHeight = useHeaderHeight();
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  
  const { groceries } = useApp();
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [recipeToDelete, setRecipeToDelete] = useState<SavedRecipeData | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const { data, isLoading, error, refetch } = useQuery<{ recipes: SavedRecipeData[] }>({
    queryKey: ["/api/saved-recipes"],
  });

  const recipes = data?.recipes || [];

  const handleRecipePress = (savedRecipe: SavedRecipeData) => {
    const ingredients = savedRecipe.ingredients || [];
    const live = recomputeIngredientMatch(ingredients, groceries);

    const recipe: ScoredRecipe = {
      id: savedRecipe.recipeId,
      name: savedRecipe.name,
      thumbnail: savedRecipe.thumbnail || "",
      category: savedRecipe.category || "",
      instructions: savedRecipe.instructions || "",
      matchScore: live.matchScore,
      matchedIngredients: live.matchedIngredients,
      missingIngredients: live.missingIngredients,
      ingredients,
      stats: live.stats,
    };
    navigation.navigate("RecipeDetail", { recipe });
  };

  const handleLongPress = (recipe: SavedRecipeData) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setRecipeToDelete(recipe);
    setShowDeleteModal(true);
  };

  const handleDelete = async () => {
    if (!recipeToDelete || isDeleting) return;
    
    setIsDeleting(true);
    try {
      const baseUrl = getApiUrl();
      const response = await fetch(
        new URL(`/api/saved-recipes/${recipeToDelete.recipeId}`, baseUrl).toString(),
        { method: "DELETE" }
      );
      
      if (response.ok) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        queryClient.invalidateQueries({ queryKey: ["/api/saved-recipes"] });
        setShowDeleteModal(false);
        setRecipeToDelete(null);
      }
    } catch (error) {
      console.error("Error deleting recipe:", error);
    } finally {
      setIsDeleting(false);
    }
  };

  if (isLoading) {
    return (
      <View style={[styles.container, { backgroundColor: theme.backgroundRoot }]}>
        <LoadingState />
      </View>
    );
  }

  if (error || recipes.length === 0) {
    return (
      <View style={[styles.container, { backgroundColor: theme.backgroundRoot }]}>
        <EmptyState />
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
            onPress={() => handleRecipePress(item)}
            onLongPress={() => handleLongPress(item)}
          />
        )}
        columnWrapperStyle={styles.row}
        contentContainerStyle={[
          styles.grid,
          { paddingTop: headerHeight + Spacing.md, paddingBottom: insets.bottom + 100 },
        ]}
        showsVerticalScrollIndicator={false}
      />

      <Modal
        visible={showDeleteModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowDeleteModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.backgroundDefault }]}>
            <ThemedText type="h4" style={styles.modalTitle}>
              Remove Recipe?
            </ThemedText>
            <ThemedText type="body" style={{ color: theme.textSecondary, textAlign: "center", marginBottom: Spacing.xl }}>
              Are you sure you want to remove "{recipeToDelete?.name}" from your saved recipes?
            </ThemedText>
            <View style={styles.modalButtons}>
              <Pressable
                onPress={() => {
                  setShowDeleteModal(false);
                  setRecipeToDelete(null);
                }}
                style={[styles.modalButton, { backgroundColor: theme.backgroundSecondary }]}
              >
                <ThemedText type="bodyMedium">Cancel</ThemedText>
              </Pressable>
              <Pressable
                onPress={handleDelete}
                disabled={isDeleting}
                style={[styles.modalButton, { backgroundColor: Colors.light.expiredRed }]}
              >
                {isDeleting ? (
                  <ActivityIndicator size="small" color="#FFF" />
                ) : (
                  <ThemedText type="bodyMedium" style={{ color: "#FFF" }}>Remove</ThemedText>
                )}
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  grid: {
    paddingHorizontal: HORIZONTAL_PADDING,
  },
  row: {
    justifyContent: "space-between",
    marginBottom: Spacing.md,
  },
  card: {
    width: CARD_WIDTH,
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
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: Spacing.xl,
  },
  modalContent: {
    width: "100%",
    maxWidth: 768,
    borderRadius: BorderRadius.xl,
    padding: Spacing.xl,
    alignItems: "center",
  },
  modalTitle: {
    marginBottom: Spacing.md,
  },
  modalButtons: {
    flexDirection: "row",
    gap: Spacing.md,
    width: "100%",
  },
  modalButton: {
    flex: 1,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.lg,
    alignItems: "center",
    justifyContent: "center",
  },
});
