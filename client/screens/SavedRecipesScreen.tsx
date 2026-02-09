import React, { useState } from "react";
import {
  View,
  FlatList,
  StyleSheet,
  Pressable,
  useWindowDimensions,
  Modal,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useHeaderHeight } from "@react-navigation/elements";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { ThemedText } from "@/components/ThemedText";
import {
  RecipeCard,
  calculateCardWidth,
  RECIPE_GRID_PADDING,
  RECIPE_MAX_CONTENT_WIDTH,
} from "@/components/molecules/RecipeCard";
import { useTheme } from "@/hooks/useTheme";
import { useApp, SavedRecipeData } from "@/context/AppContext";
import { Colors, Spacing, BorderRadius } from "@/constants/theme";
import { recomputeIngredientMatch } from "@/utils/ingredientMatcher";
import type { RootStackParamList, ScoredRecipe } from "@/navigation/RootStackNavigator";

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

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
  const { width: screenWidth } = useWindowDimensions();

  const cardWidth = calculateCardWidth(screenWidth);

  const { groceries, savedRecipes, unsaveRecipe } = useApp();
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [recipeToDelete, setRecipeToDelete] = useState<SavedRecipeData | null>(null);

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
    if (!recipeToDelete) return;
    await unsaveRecipe(recipeToDelete.recipeId);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setShowDeleteModal(false);
    setRecipeToDelete(null);
  };

  if (savedRecipes.length === 0) {
    return (
      <View style={[styles.container, { backgroundColor: theme.backgroundRoot }]}>
        <EmptyState />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.backgroundRoot }]}>
      <FlatList
        data={savedRecipes}
        numColumns={2}
        keyExtractor={(item) => item.id}
        renderItem={({ item, index }) => (
          <RecipeCard
            title={item.name}
            thumbnail={item.thumbnail}
            badge={{ label: "Saved", color: Colors.light.expiredRed, icon: "heart" }}
            cardWidth={cardWidth}
            index={index}
            onPress={() => handleRecipePress(item)}
            onLongPress={() => handleLongPress(item)}
            testID={`saved-recipe-card-${item.recipeId}`}
          />
        )}
        columnWrapperStyle={styles.row}
        contentContainerStyle={[
          styles.grid,
          {
            paddingTop: headerHeight + Spacing.md,
            paddingBottom: insets.bottom + 100,
            maxWidth: RECIPE_MAX_CONTENT_WIDTH,
            alignSelf: "center" as const,
            width: "100%" as unknown as number,
          },
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
                style={[styles.modalButton, { backgroundColor: Colors.light.expiredRed }]}
              >
                <ThemedText type="bodyMedium" style={{ color: "#FFF" }}>Remove</ThemedText>
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
    paddingHorizontal: RECIPE_GRID_PADDING,
  },
  row: {
    justifyContent: "space-between",
    marginBottom: Spacing.md,
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
