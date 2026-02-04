import React, { useState, useRef } from "react";
import { View, StyleSheet, Pressable, Dimensions, FlatList, ViewToken } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRoute, useNavigation } from "@react-navigation/native";
import type { RouteProp } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import Animated, { FadeIn, FadeInRight, FadeInLeft } from "react-native-reanimated";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius } from "@/constants/theme";
import type { RootStackParamList, GeneratedRecipe } from "@/navigation/RootStackNavigator";

type RouteProps = RouteProp<RootStackParamList, "CookingMode">;
type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

interface StepCardProps {
  step: GeneratedRecipe["steps"][0];
  totalSteps: number;
  isActive: boolean;
}

function StepCard({ step, totalSteps, isActive }: StepCardProps) {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.stepCard, { width: SCREEN_WIDTH }]}>
      <View style={[styles.stepContent, { paddingTop: insets.top + Spacing["3xl"] }]}>
        <Animated.View entering={isActive ? FadeIn.delay(100).duration(300) : undefined}>
          <View style={styles.stepIndicator}>
            <ThemedText type="caption" style={{ color: theme.textSecondary }}>
              STEP {step.stepNumber} OF {totalSteps}
            </ThemedText>
          </View>
        </Animated.View>

        <Animated.View 
          entering={isActive ? FadeIn.delay(200).duration(400) : undefined}
          style={styles.stepNumberContainer}
        >
          <View style={[styles.stepNumberCircle, { backgroundColor: theme.text }]}>
            <ThemedText type="h1" style={{ color: theme.buttonText }}>
              {step.stepNumber}
            </ThemedText>
          </View>
        </Animated.View>

        <Animated.View 
          entering={isActive ? FadeIn.delay(300).duration(400) : undefined}
          style={styles.instructionContainer}
        >
          <ThemedText type="h3" style={[styles.instruction, { color: theme.text }]}>
            {step.instruction}
          </ThemedText>
        </Animated.View>

        {step.duration || step.temperature ? (
          <Animated.View 
            entering={isActive ? FadeIn.delay(400).duration(300) : undefined}
            style={styles.metaContainer}
          >
            {step.duration ? (
              <View style={[styles.metaBadge, { backgroundColor: theme.backgroundSecondary }]}>
                <Feather name="clock" size={16} color={theme.textSecondary} />
                <ThemedText type="bodyMedium" style={{ color: theme.text }}>
                  {step.duration} min
                </ThemedText>
              </View>
            ) : null}
            {step.temperature ? (
              <View style={[styles.metaBadge, { backgroundColor: theme.backgroundSecondary }]}>
                <Feather name="thermometer" size={16} color={theme.textSecondary} />
                <ThemedText type="bodyMedium" style={{ color: theme.text }}>
                  {step.temperature}
                </ThemedText>
              </View>
            ) : null}
          </Animated.View>
        ) : null}
      </View>
    </View>
  );
}

export default function CookingModeScreen() {
  const { theme } = useTheme();
  const route = useRoute<RouteProps>();
  const navigation = useNavigation<NavigationProp>();
  const insets = useSafeAreaInsets();

  const { recipe, selectedIngredients } = route.params;
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);

  const onViewableItemsChanged = useRef(({ viewableItems }: { viewableItems: ViewToken[] }) => {
    if (viewableItems.length > 0 && viewableItems[0].index !== null) {
      setCurrentIndex(viewableItems[0].index);
    }
  }).current;

  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 50,
  }).current;

  const goToNext = () => {
    if (currentIndex < recipe.steps.length - 1) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      flatListRef.current?.scrollToIndex({ index: currentIndex + 1, animated: true });
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      navigation.navigate("CookingComplete", { recipe, selectedIngredients });
    }
  };

  const goToPrevious = () => {
    if (currentIndex > 0) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      flatListRef.current?.scrollToIndex({ index: currentIndex - 1, animated: true });
    }
  };

  const handleClose = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    navigation.goBack();
  };

  const isLastStep = currentIndex === recipe.steps.length - 1;

  return (
    <View style={[styles.container, { backgroundColor: theme.backgroundRoot }]}>
      <View style={[styles.header, { paddingTop: insets.top + Spacing.md }]}>
        <Pressable onPress={handleClose} style={styles.closeButton} testID="button-close-cooking">
          <Feather name="x" size={24} color={theme.text} />
        </Pressable>
        <ThemedText type="bodyMedium" numberOfLines={1} style={styles.recipeTitle}>
          {recipe.title}
        </ThemedText>
        <View style={styles.placeholder} />
      </View>

      <View style={styles.progressContainer}>
        {recipe.steps.map((_, index) => (
          <View
            key={index}
            style={[
              styles.progressDot,
              {
                backgroundColor: index <= currentIndex ? theme.text : theme.divider,
              },
            ]}
          />
        ))}
      </View>

      <FlatList
        ref={flatListRef}
        data={recipe.steps}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        keyExtractor={(item) => item.stepNumber.toString()}
        renderItem={({ item, index }) => (
          <StepCard
            step={item}
            totalSteps={recipe.steps.length}
            isActive={index === currentIndex}
          />
        )}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        getItemLayout={(_, index) => ({
          length: SCREEN_WIDTH,
          offset: SCREEN_WIDTH * index,
          index,
        })}
      />

      <View style={[styles.footer, { paddingBottom: insets.bottom + Spacing.lg }]}>
        <Pressable
          onPress={goToPrevious}
          disabled={currentIndex === 0}
          style={[
            styles.navButton,
            { backgroundColor: theme.backgroundSecondary },
            currentIndex === 0 && styles.navButtonDisabled,
          ]}
          testID="button-previous-step"
        >
          <Feather name="chevron-left" size={28} color={currentIndex === 0 ? theme.divider : theme.text} />
        </Pressable>

        <Pressable
          onPress={goToNext}
          style={[styles.nextButton, { backgroundColor: theme.text }]}
          testID="button-next-step"
        >
          <ThemedText type="bodyMedium" style={{ color: theme.buttonText }}>
            {isLastStep ? "Finish Cooking" : "Next Step"}
          </ThemedText>
          <Feather 
            name={isLastStep ? "check" : "chevron-right"} 
            size={20} 
            color={theme.buttonText} 
          />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
  },
  closeButton: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  recipeTitle: {
    flex: 1,
    textAlign: "center",
    marginHorizontal: Spacing.md,
  },
  placeholder: {
    width: 40,
  },
  progressContainer: {
    flexDirection: "row",
    justifyContent: "center",
    gap: Spacing.sm,
    paddingVertical: Spacing.md,
  },
  progressDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  stepCard: {
    flex: 1,
    justifyContent: "center",
  },
  stepContent: {
    flex: 1,
    paddingHorizontal: Spacing["2xl"],
    alignItems: "center",
    justifyContent: "center",
  },
  stepIndicator: {
    marginBottom: Spacing.xl,
  },
  stepNumberContainer: {
    marginBottom: Spacing["2xl"],
  },
  stepNumberCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  instructionContainer: {
    maxWidth: "100%",
  },
  instruction: {
    textAlign: "center",
    lineHeight: 36,
  },
  metaContainer: {
    flexDirection: "row",
    gap: Spacing.md,
    marginTop: Spacing["2xl"],
  },
  metaBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.full,
  },
  footer: {
    flexDirection: "row",
    paddingHorizontal: Spacing.lg,
    gap: Spacing.md,
  },
  navButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
  },
  navButtonDisabled: {
    opacity: 0.5,
  },
  nextButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    height: 56,
    borderRadius: 28,
    gap: Spacing.sm,
  },
});
