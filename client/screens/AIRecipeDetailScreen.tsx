import React, { useState } from "react";
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

type RouteProps = RouteProp<RootStackParamList, "AIRecipeDetail">;
type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export default function AIRecipeDetailScreen() {
  const { theme } = useTheme();
  const route = useRoute<RouteProps>();
  const navigation = useNavigation<NavigationProp>();
  const headerHeight = useHeaderHeight();
  const insets = useSafeAreaInsets();

  const { recipe, selectedIngredients } = route.params;
  const [currentStep, setCurrentStep] = useState(0);

  const handleStartCooking = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    navigation.navigate("CookingComplete", { recipe, selectedIngredients });
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.backgroundRoot }]}>
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingTop: headerHeight + Spacing.lg, paddingBottom: 100 + insets.bottom },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {recipe.thumbnail ? (
          <Image source={{ uri: recipe.thumbnail }} style={styles.heroImage} />
        ) : (
          <View style={[styles.heroPlaceholder, { backgroundColor: theme.backgroundSecondary }]}>
            <Feather name="book-open" size={64} color={theme.textSecondary} />
          </View>
        )}

        <View style={styles.headerSection}>
          <Animated.View entering={FadeInDown.duration(200)}>
            <ThemedText type="h2">{recipe.title}</ThemedText>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(50).duration(200)} style={styles.metaRow}>
            <View style={styles.metaItem}>
              <Feather name="clock" size={16} color={theme.textSecondary} />
              <ThemedText type="body" style={{ color: theme.textSecondary }}>
                {recipe.totalTime} min
              </ThemedText>
            </View>
            <View style={styles.metaItem}>
              <Feather name="users" size={16} color={theme.textSecondary} />
              <ThemedText type="body" style={{ color: theme.textSecondary }}>
                {recipe.servings} servings
              </ThemedText>
            </View>
            <View
              style={[
                styles.matchBadge,
                { backgroundColor: recipe.matchScore >= 90 ? Colors.light.success : Colors.light.expiringOrange },
              ]}
            >
              <ThemedText type="caption" style={styles.matchText}>
                {recipe.matchScore}% match
              </ThemedText>
            </View>
          </Animated.View>
        </View>

        <Animated.View entering={FadeInDown.delay(100).duration(200)}>
          <View style={[styles.section, { backgroundColor: theme.backgroundDefault }]}>
            <ThemedText type="h4" style={styles.sectionTitle}>
              Ingredients from Your Pantry
            </ThemedText>
            {recipe.usedIngredients.map((ingredient, index) => (
              <View key={index} style={styles.ingredientRow}>
                <Feather name="check-circle" size={16} color={Colors.light.success} />
                <ThemedText type="body" style={styles.ingredientText}>
                  {ingredient.amount} {ingredient.name}
                  {ingredient.prepNotes ? ` (${ingredient.prepNotes})` : ""}
                </ThemedText>
              </View>
            ))}
          </View>
        </Animated.View>

        {recipe.missingIngredients.length > 0 ? (
          <Animated.View entering={FadeInDown.delay(150).duration(200)}>
            <View style={[styles.section, { backgroundColor: theme.backgroundDefault }]}>
              <ThemedText type="h4" style={styles.sectionTitle}>
                Additional Ingredients Needed
              </ThemedText>
              {recipe.missingIngredients.map((ingredient, index) => (
                <View key={index} style={styles.ingredientRow}>
                  <Feather name="shopping-cart" size={16} color={Colors.light.expiringOrange} />
                  <ThemedText type="body" style={styles.ingredientText}>
                    {ingredient.amount} {ingredient.name}
                  </ThemedText>
                </View>
              ))}
            </View>
          </Animated.View>
        ) : null}

        <Animated.View entering={FadeInDown.delay(200).duration(200)}>
          <View style={[styles.section, { backgroundColor: theme.backgroundDefault }]}>
            <ThemedText type="h4" style={styles.sectionTitle}>
              Instructions
            </ThemedText>
            {recipe.steps.map((step, index) => (
              <View key={index} style={styles.stepRow}>
                <View style={[styles.stepNumber, { backgroundColor: theme.text }]}>
                  <ThemedText type="caption" style={{ color: theme.buttonText, fontWeight: "700" }}>
                    {step.stepNumber}
                  </ThemedText>
                </View>
                <View style={styles.stepContent}>
                  <ThemedText type="body">{step.instruction}</ThemedText>
                  {step.duration || step.temperature ? (
                    <View style={styles.stepMeta}>
                      {step.duration ? (
                        <ThemedText type="small" style={{ color: theme.textSecondary }}>
                          {step.duration} min
                        </ThemedText>
                      ) : null}
                      {step.temperature ? (
                        <ThemedText type="small" style={{ color: theme.textSecondary }}>
                          {step.temperature}
                        </ThemedText>
                      ) : null}
                    </View>
                  ) : null}
                </View>
              </View>
            ))}
          </View>
        </Animated.View>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + Spacing.md }]}>
        <Pressable
          onPress={handleStartCooking}
          style={[styles.cookButton, { backgroundColor: theme.text }]}
          testID="button-start-cooking"
        >
          <Feather name="play" size={20} color={theme.buttonText} />
          <ThemedText type="bodyMedium" style={{ color: theme.buttonText }}>
            I Made This Recipe
          </ThemedText>
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
  heroImage: {
    width: "100%",
    height: 220,
    borderRadius: BorderRadius.xl,
    marginBottom: Spacing.lg,
  },
  heroPlaceholder: {
    width: "100%",
    height: 180,
    borderRadius: BorderRadius.xl,
    marginBottom: Spacing.lg,
    alignItems: "center",
    justifyContent: "center",
  },
  headerSection: {
    marginBottom: Spacing.lg,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: Spacing.lg,
    marginTop: Spacing.md,
  },
  metaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
  },
  matchBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
  },
  matchText: {
    color: "#FFF",
    fontWeight: "600",
  },
  section: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.xl,
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    marginBottom: Spacing.md,
  },
  ingredientRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: Spacing.sm,
    gap: Spacing.md,
  },
  ingredientText: {
    flex: 1,
  },
  stepRow: {
    flexDirection: "row",
    marginBottom: Spacing.lg,
  },
  stepNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    marginRight: Spacing.md,
    marginTop: 2,
  },
  stepContent: {
    flex: 1,
  },
  stepMeta: {
    flexDirection: "row",
    gap: Spacing.md,
    marginTop: Spacing.xs,
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
