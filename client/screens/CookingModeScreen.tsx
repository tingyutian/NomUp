import React, { useState } from "react";
import { View, StyleSheet, Pressable, ScrollView, useWindowDimensions } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRoute, useNavigation } from "@react-navigation/native";
import type { RouteProp } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import Animated, { FadeIn } from "react-native-reanimated";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { ThemedText } from "@/components/ThemedText";
import { CookingTimer } from "@/components/CookingTimer";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius, Colors } from "@/constants/theme";
import type { RootStackParamList, CookingStep } from "@/navigation/RootStackNavigator";

type RouteProps = RouteProp<RootStackParamList, "CookingMode">;
type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const MAX_CONTENT_WIDTH = 480;

interface StepCardProps {
  step: CookingStep;
  totalSteps: number;
}

function StepCard({ step, totalSteps }: StepCardProps) {
  const { theme } = useTheme();

  return (
    <Animated.View entering={FadeIn.duration(300)} style={styles.stepContentInner}>
      <View style={styles.stepIndicator}>
        <ThemedText type="caption" style={{ color: theme.textSecondary }}>
          STEP {step.stepNumber} OF {totalSteps}
        </ThemedText>
      </View>

      <View style={styles.stepNumberContainer}>
        <View style={[styles.stepNumberCircle, { backgroundColor: theme.text }]}>
          <ThemedText type="h1" style={{ color: theme.buttonText }}>
            {step.stepNumber}
          </ThemedText>
        </View>
      </View>

      <View style={styles.instructionContainer}>
        <ThemedText type="h3" style={[styles.instruction, { color: theme.text }]}>
          {step.instruction}
        </ThemedText>
      </View>

      {step.temperature ? (
        <View style={styles.metaContainer}>
          <View style={[styles.metaBadge, { backgroundColor: theme.backgroundSecondary }]}>
            <Feather name="thermometer" size={16} color={theme.textSecondary} />
            <ThemedText type="bodyMedium" style={{ color: theme.text }}>
              {step.temperature}
            </ThemedText>
          </View>
        </View>
      ) : null}

      {step.duration ? (
        <View style={styles.timerContainer}>
          <CookingTimer durationMinutes={step.duration} />
        </View>
      ) : null}
    </Animated.View>
  );
}

export default function CookingModeScreen() {
  const { theme } = useTheme();
  const route = useRoute<RouteProps>();
  const navigation = useNavigation<NavigationProp>();
  const insets = useSafeAreaInsets();
  const { width: screenWidth } = useWindowDimensions();

  const { recipe } = route.params;
  const [currentIndex, setCurrentIndex] = useState(0);

  const goToNext = () => {
    if (currentIndex < recipe.steps.length - 1) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setCurrentIndex(currentIndex + 1);
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      navigation.navigate("CookingComplete", { recipe });
    }
  };

  const goToPrevious = () => {
    if (currentIndex > 0) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setCurrentIndex(currentIndex - 1);
    }
  };

  const handleClose = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    navigation.goBack();
  };

  const isLastStep = currentIndex === recipe.steps.length - 1;
  const currentStep = recipe.steps[currentIndex];

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

      <ScrollView
        style={styles.scrollArea}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.stepContent, { maxWidth: Math.min(screenWidth, MAX_CONTENT_WIDTH) }]}>
          <StepCard
            key={currentIndex}
            step={currentStep}
            totalSteps={recipe.steps.length}
          />
        </View>
      </ScrollView>

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
  scrollArea: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  stepContent: {
    width: "100%",
    paddingHorizontal: Spacing["2xl"],
    alignItems: "center",
    paddingBottom: Spacing["3xl"],
  },
  stepContentInner: {
    width: "100%",
    alignItems: "center",
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
    width: "100%",
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
  timerContainer: {
    width: "100%",
    marginTop: Spacing.lg,
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
