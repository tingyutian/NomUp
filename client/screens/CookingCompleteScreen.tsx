import React, { useState, useMemo } from "react";
import { View, StyleSheet, ScrollView, Pressable } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";
import { useRoute, useNavigation } from "@react-navigation/native";
import type { RouteProp } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import Animated, { FadeInDown } from "react-native-reanimated";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { ThemedText } from "@/components/ThemedText";
import { Slider } from "@/components/atoms/Slider";
import { ConfirmationBanner } from "@/components/atoms/ConfirmationBanner";
import { useTheme } from "@/hooks/useTheme";
import { useApp } from "@/context/AppContext";
import { Spacing, BorderRadius, Colors } from "@/constants/theme";
import type { RootStackParamList } from "@/navigation/RootStackNavigator";

type RouteProps = RouteProp<RootStackParamList, "CookingComplete">;
type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export default function CookingCompleteScreen() {
  const { theme } = useTheme();
  const route = useRoute<RouteProps>();
  const navigation = useNavigation<NavigationProp>();
  const headerHeight = useHeaderHeight();
  const insets = useSafeAreaInsets();
  const { groceries, useGrocery } = useApp();

  const { recipe } = route.params;
  const [showBanner, setShowBanner] = useState(false);

  const ingredientsWithData = useMemo(() => {
    return recipe.usedIngredients.map((ingredientName) => {
      const grocery = groceries.find(
        (g) => g.name.toLowerCase() === ingredientName.toLowerCase()
      );
      return {
        id: grocery?.id || ingredientName,
        name: ingredientName,
        grocery,
        currentUsed: grocery?.usedAmount || 0,
      };
    });
  }, [recipe.usedIngredients, groceries]);

  const [usageAmounts, setUsageAmounts] = useState<Record<string, number>>(() => {
    const initial: Record<string, number> = {};
    ingredientsWithData.forEach((ing) => {
      initial[ing.id] = 5;
    });
    return initial;
  });

  const handleUsageChange = (id: string, amount: number) => {
    setUsageAmounts((prev) => ({
      ...prev,
      [id]: amount,
    }));
  };

  const handleConfirm = async () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    for (const ing of ingredientsWithData) {
      if (ing.grocery) {
        const amount = usageAmounts[ing.id] || 0;
        if (amount > 0) {
          await useGrocery(ing.grocery.id, amount);
        }
      }
    }

    setShowBanner(true);
    setTimeout(() => {
      navigation.reset({
        index: 0,
        routes: [{ name: "Main" }],
      });
    }, 1500);
  };

  const handleSkip = () => {
    navigation.reset({
      index: 0,
      routes: [{ name: "Main" }],
    });
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.backgroundRoot }]}>
      <ConfirmationBanner
        visible={showBanner}
        message="Pantry updated successfully!"
        onHide={() => setShowBanner(false)}
        iconName="check-circle"
      />

      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingTop: headerHeight + Spacing.lg, paddingBottom: 100 + insets.bottom },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View entering={FadeInDown.duration(200)} style={styles.header}>
          <View style={[styles.successIcon, { backgroundColor: Colors.light.success }]}>
            <Feather name="check" size={32} color="#FFF" />
          </View>
          <ThemedText type="h2" style={styles.title}>
            Great job cooking!
          </ThemedText>
          <ThemedText type="body" style={{ color: theme.textSecondary, textAlign: "center" }}>
            Log how much of each ingredient you used to keep your pantry up to date.
          </ThemedText>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(100).duration(200)}>
          <View style={[styles.recipeCard, { backgroundColor: theme.backgroundDefault }]}>
            <Feather name="book-open" size={20} color={theme.textSecondary} />
            <ThemedText type="bodyMedium" style={styles.recipeName}>
              {recipe.title}
            </ThemedText>
          </View>
        </Animated.View>

        {ingredientsWithData.length > 0 ? (
          <>
            <Animated.View entering={FadeInDown.delay(150).duration(200)}>
              <ThemedText type="h4" style={styles.sectionTitle}>
                Ingredients Used
              </ThemedText>
            </Animated.View>

            {ingredientsWithData.map((item, index) => (
              <Animated.View
                key={item.id}
                entering={FadeInDown.delay(200 + index * 50).duration(200)}
              >
                <View style={[styles.ingredientCard, { backgroundColor: theme.backgroundDefault }]}>
                  <View style={styles.ingredientHeader}>
                    <ThemedText type="bodyMedium" style={styles.ingredientName}>{item.name}</ThemedText>
                    {item.grocery ? (
                      <ThemedText type="small" style={styles.ingredientStatus}>
                        {item.grocery.quantity} {item.grocery.unit} in pantry
                      </ThemedText>
                    ) : (
                      <ThemedText type="small" style={[styles.ingredientStatus, { color: theme.textSecondary }]}>
                        Not in pantry
                      </ThemedText>
                    )}
                  </View>
                  {item.grocery ? (
                    <Slider
                      value={usageAmounts[item.id] || 0}
                      onValueChange={(val) => handleUsageChange(item.id, val)}
                      min={0}
                      max={10}
                      step={1}
                      showLabel={true}
                      testID={`slider-${item.id}`}
                    />
                  ) : null}
                </View>
              </Animated.View>
            ))}
          </>
        ) : null}
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + Spacing.md }]}>
        <Pressable
          onPress={handleSkip}
          style={[styles.skipButton, { backgroundColor: theme.backgroundSecondary }]}
          testID="button-skip"
        >
          <ThemedText type="bodyMedium" style={{ color: theme.textSecondary }}>
            Skip
          </ThemedText>
        </Pressable>
        <Pressable
          onPress={handleConfirm}
          style={[styles.confirmButton, { backgroundColor: theme.text }]}
          testID="button-confirm-usage"
        >
          <Feather name="check" size={20} color={theme.buttonText} />
          <ThemedText type="bodyMedium" style={{ color: theme.buttonText }}>
            Update Pantry
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
  header: {
    alignItems: "center",
    marginBottom: Spacing.xl,
  },
  successIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.md,
  },
  title: {
    marginBottom: Spacing.xs,
    textAlign: "center",
  },
  recipeCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.xl,
    gap: Spacing.md,
  },
  recipeName: {
    flex: 1,
  },
  sectionTitle: {
    marginBottom: Spacing.md,
  },
  ingredientCard: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.md,
  },
  ingredientHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: Spacing.md,
    gap: Spacing.md,
  },
  ingredientName: {
    flex: 1,
    flexShrink: 1,
  },
  ingredientStatus: {
    flexShrink: 0,
  },
  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    flexDirection: "row",
    gap: Spacing.md,
  },
  skipButton: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing.lg,
    borderRadius: BorderRadius.lg,
  },
  confirmButton: {
    flex: 2,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing.lg,
    borderRadius: BorderRadius.lg,
    gap: Spacing.sm,
  },
});
