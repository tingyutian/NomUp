import React, { useState, useMemo } from "react";
import {
  View,
  ScrollView,
  Image,
  StyleSheet,
  Pressable,
  ActivityIndicator,
} from "react-native";
import { useRoute, useNavigation } from "@react-navigation/native";
import type { RouteProp } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";
import { Feather } from "@expo/vector-icons";
import Animated, { FadeIn, FadeInUp } from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { useApp } from "@/context/AppContext";
import { Colors, Spacing, BorderRadius } from "@/constants/theme";
import { getApiUrl } from "@/lib/query-client";
import type { RootStackParamList, CookingRecipe, CookingStep } from "@/navigation/RootStackNavigator";

type RecipeDetailRouteProp = RouteProp<RootStackParamList, "RecipeDetail">;
type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

interface IngredientRowProps {
  ingredient: string;
  isMatched: boolean;
  isInList: boolean;
  onAddToList: () => void;
}

function IngredientRow({ ingredient, isMatched, isInList, onAddToList }: IngredientRowProps) {
  const { theme } = useTheme();

  return (
    <View style={[styles.ingredientRow, { borderColor: theme.divider }]}>
      <ThemedText type="body" style={{ flex: 1 }}>
        {ingredient}
      </ThemedText>
      {isMatched ? (
        <View style={[styles.checkCircle, { backgroundColor: Colors.light.success }]}>
          <Feather name="check" size={14} color="#FFF" />
        </View>
      ) : isInList ? (
        <View style={[styles.checkCircle, { backgroundColor: theme.textSecondary }]}>
          <Feather name="check" size={14} color="#FFF" />
        </View>
      ) : (
        <Pressable
          onPress={onAddToList}
          style={[styles.addButton, { backgroundColor: theme.text }]}
          testID={`add-ingredient-${ingredient}`}
        >
          <Feather name="shopping-cart" size={16} color={theme.buttonText} />
        </Pressable>
      )}
    </View>
  );
}

function parseInstructionsToSteps(instructions: string): CookingStep[] {
  const lines = instructions
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  if (lines.length === 0) {
    return [{ stepNumber: 1, instruction: instructions.trim() }];
  }

  const steps: CookingStep[] = [];
  let stepNumber = 1;

  for (const line of lines) {
    const cleaned = line
      .replace(/^(step\s*)?(\d+[\.\)\:]?\s*)/i, "")
      .replace(/^\-\s*/, "")
      .trim();

    if (cleaned.length > 0) {
      steps.push({
        stepNumber,
        instruction: cleaned,
      });
      stepNumber++;
    }
  }

  return steps.length > 0 ? steps : [{ stepNumber: 1, instruction: instructions.trim() }];
}

export default function RecipeDetailScreen() {
  const route = useRoute<RecipeDetailRouteProp>();
  const navigation = useNavigation<NavigationProp>();
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const { addToShoppingList, addMultipleToShoppingList, shoppingList } = useApp();
  const { recipe } = route.params;
  
  const [addedItems, setAddedItems] = useState<Set<string>>(new Set());
  const [showBanner, setShowBanner] = useState(false);
  const [isEnhancing, setIsEnhancing] = useState(false);

  const handleStartCooking = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setIsEnhancing(true);
    
    try {
      const baseUrl = getApiUrl();
      const response = await fetch(new URL("/api/enhance-instructions", baseUrl).toString(), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          instructions: recipe.instructions,
          recipeName: recipe.name,
        }),
      });
      
      let steps: CookingStep[];
      
      if (response.ok) {
        const data = await response.json();
        steps = data.steps;
      } else {
        steps = parseInstructionsToSteps(recipe.instructions);
      }
      
      const cookingRecipe: CookingRecipe = {
        id: recipe.id,
        title: recipe.name,
        thumbnail: recipe.thumbnail,
        steps,
        usedIngredients: recipe.matchedIngredients,
      };
      
      navigation.navigate("CookingMode", { recipe: cookingRecipe });
    } catch (error) {
      console.error("Error enhancing instructions:", error);
      const steps = parseInstructionsToSteps(recipe.instructions);
      const cookingRecipe: CookingRecipe = {
        id: recipe.id,
        title: recipe.name,
        thumbnail: recipe.thumbnail,
        steps,
        usedIngredients: recipe.matchedIngredients,
      };
      navigation.navigate("CookingMode", { recipe: cookingRecipe });
    } finally {
      setIsEnhancing(false);
    }
  };

  const shoppingListNames = useMemo(
    () => new Set(shoppingList.map((item) => item.name.toLowerCase())),
    [shoppingList]
  );

  const isInList = (ingredient: string) => {
    const lower = ingredient.toLowerCase();
    return shoppingListNames.has(lower) || addedItems.has(lower);
  };

  const handleAddToList = async (ingredient: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await addToShoppingList({
      name: ingredient,
      quantity: 1,
      unit: "",
    });
    setAddedItems((prev) => new Set([...prev, ingredient.toLowerCase()]));
    setShowBanner(true);
    setTimeout(() => setShowBanner(false), 2000);
  };

  const handleAddAllMissing = async () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    const toAdd = recipe.missingIngredients.filter((ing) => !isInList(ing));
    if (toAdd.length === 0) return;
    
    await addMultipleToShoppingList(
      toAdd.map((ingredient) => ({
        name: ingredient,
        quantity: 1,
        unit: "",
      }))
    );
    setAddedItems((prev) => {
      const next = new Set(prev);
      toAdd.forEach((ing) => next.add(ing.toLowerCase()));
      return next;
    });
    setShowBanner(true);
    setTimeout(() => setShowBanner(false), 2000);
  };

  const missingNotInList = recipe.missingIngredients.filter((ing) => !isInList(ing));

  return (
    <View style={[styles.container, { backgroundColor: theme.backgroundRoot }]}>
      {showBanner ? (
        <Animated.View
          entering={FadeIn.duration(200)}
          style={[styles.banner, { backgroundColor: Colors.light.success }]}
        >
          <Feather name="check" size={16} color="#FFF" />
          <ThemedText type="bodyMedium" style={styles.bannerText}>
            Added to shopping list
          </ThemedText>
        </Animated.View>
      ) : null}

      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingTop: headerHeight, paddingBottom: 100 + insets.bottom },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <Image source={{ uri: recipe.thumbnail }} style={styles.hero} />

        <Animated.View entering={FadeInUp.delay(100).duration(300)} style={styles.info}>
          <ThemedText type="h2">{recipe.name}</ThemedText>
          <View style={styles.meta}>
            <View style={[styles.categoryBadge, { backgroundColor: theme.backgroundSecondary }]}>
              <ThemedText type="caption">{recipe.category}</ThemedText>
            </View>
            <View style={[styles.matchBadge, { backgroundColor: Colors.light.success }]}>
              <ThemedText type="caption" style={{ color: "#FFF" }}>
                {recipe.matchScore}% match
              </ThemedText>
            </View>
          </View>
        </Animated.View>

        {recipe.matchedIngredients.length > 0 ? (
          <Animated.View entering={FadeInUp.delay(200).duration(300)} style={styles.section}>
            <View style={styles.sectionHeader}>
              <Feather name="check-circle" size={20} color={Colors.light.success} />
              <ThemedText type="h4">You Have ({recipe.stats.matched})</ThemedText>
            </View>
            {recipe.matchedIngredients.map((ingredient, index) => (
              <IngredientRow
                key={`matched-${index}`}
                ingredient={ingredient}
                isMatched={true}
                isInList={false}
                onAddToList={() => {}}
              />
            ))}
          </Animated.View>
        ) : null}

        {recipe.missingIngredients.length > 0 ? (
          <Animated.View entering={FadeInUp.delay(300).duration(300)} style={styles.section}>
            <View style={styles.sectionHeader}>
              <Feather name="shopping-cart" size={20} color={theme.text} />
              <ThemedText type="h4">Need to Buy ({recipe.stats.missing})</ThemedText>
            </View>
            {recipe.missingIngredients.map((ingredient, index) => (
              <IngredientRow
                key={`missing-${index}`}
                ingredient={ingredient}
                isMatched={false}
                isInList={isInList(ingredient)}
                onAddToList={() => handleAddToList(ingredient)}
              />
            ))}
            {missingNotInList.length > 1 ? (
              <Pressable
                onPress={handleAddAllMissing}
                style={[styles.addAllButton, { backgroundColor: theme.text }]}
                testID="add-all-missing"
              >
                <Feather name="plus" size={18} color={theme.buttonText} />
                <ThemedText type="bodyMedium" style={{ color: theme.buttonText }}>
                  Add All to List
                </ThemedText>
              </Pressable>
            ) : null}
          </Animated.View>
        ) : null}

        <Animated.View entering={FadeInUp.delay(400).duration(300)} style={styles.section}>
          <View style={styles.sectionHeader}>
            <Feather name="book-open" size={20} color={theme.text} />
            <ThemedText type="h4">Instructions</ThemedText>
          </View>
          <ThemedText type="body" style={{ color: theme.textSecondary, lineHeight: 24 }}>
            {recipe.instructions}
          </ThemedText>
        </Animated.View>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + Spacing.md }]}>
        <Pressable
          onPress={handleStartCooking}
          disabled={isEnhancing}
          style={[
            styles.cookButton, 
            { backgroundColor: theme.text },
            isEnhancing && { opacity: 0.7 },
          ]}
          testID="button-start-cooking"
        >
          {isEnhancing ? (
            <>
              <ActivityIndicator size="small" color={theme.buttonText} />
              <ThemedText type="bodyMedium" style={{ color: theme.buttonText }}>
                Preparing Steps...
              </ThemedText>
            </>
          ) : (
            <>
              <Feather name="play" size={20} color={theme.buttonText} />
              <ThemedText type="bodyMedium" style={{ color: theme.buttonText }}>
                Start Cooking
              </ThemedText>
            </>
          )}
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingHorizontal: Spacing.lg,
  },
  hero: {
    width: "100%",
    height: 280,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.xl,
  },
  info: {
    marginBottom: Spacing.xl,
  },
  meta: {
    flexDirection: "row",
    gap: Spacing.sm,
    marginTop: Spacing.md,
  },
  categoryBadge: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
  },
  matchBadge: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
  },
  section: {
    marginBottom: Spacing.xl,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  ingredientRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
  },
  checkCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  addButton: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.sm,
    alignItems: "center",
    justifyContent: "center",
  },
  addAllButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.lg,
    marginTop: Spacing.lg,
  },
  banner: {
    position: "absolute",
    top: 100,
    left: Spacing.xl,
    right: Spacing.xl,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.lg,
    zIndex: 100,
  },
  bannerText: {
    color: "#FFF",
  },
  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
  },
  cookButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing.lg,
    borderRadius: BorderRadius.lg,
    gap: Spacing.sm,
  },
});
