import React from "react";
import { View, StyleSheet, Image, Pressable } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  FadeIn,
  SlideInUp,
} from "react-native-reanimated";
import { Feather } from "@expo/vector-icons";
import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { useApp } from "@/context/AppContext";
import { BorderRadius, Spacing, Colors } from "@/constants/theme";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { RootStackParamList } from "@/navigation/RootStackNavigator";

type Props = NativeStackScreenProps<RootStackParamList, "Welcome">;

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export default function WelcomeScreen({ navigation }: Props) {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const { completeOnboarding } = useApp();
  const scale = useSharedValue(1);

  const buttonStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handleGetStarted = async () => {
    await completeOnboarding();
    navigation.replace("Main");
  };

  return (
    <View style={[styles.container, { backgroundColor: Colors.light.backgroundRoot }]}>
      <Animated.View
        entering={FadeIn.delay(200).duration(800)}
        style={[styles.content, { paddingTop: insets.top + Spacing["5xl"] }]}
      >
        <ThemedText
          type="heroTitle"
          style={[styles.title, { color: Colors.light.text }]}
        >
          NomUp!
        </ThemedText>
        <ThemedText
          type="h3"
          style={[styles.tagline, { color: Colors.light.text }]}
        >
          Before it goes bad.
        </ThemedText>
      </Animated.View>

      <Animated.View
        entering={SlideInUp.delay(600).duration(600).springify()}
        style={[
          styles.buttonContainer,
          { paddingBottom: insets.bottom + Spacing["3xl"] },
        ]}
      >
        <AnimatedPressable
          onPress={handleGetStarted}
          onPressIn={() => {
            scale.value = withSpring(0.98, { damping: 15, stiffness: 150 });
          }}
          onPressOut={() => {
            scale.value = withSpring(1, { damping: 15, stiffness: 150 });
          }}
          style={[styles.button, buttonStyle]}
          testID="button-get-started"
        >
          <ThemedText type="bodyMedium" style={styles.buttonText}>
            Get started
          </ThemedText>
          <View style={styles.arrowCircle}>
            <Feather name="arrow-right" size={20} color={Colors.light.text} />
          </View>
        </AnimatedPressable>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: Spacing.xl,
  },
  title: {
    fontSize: 48,
    marginTop: Spacing["4xl"],
  },
  tagline: {
    fontStyle: "italic",
    marginTop: Spacing.sm,
    opacity: 0.8,
  },
  buttonContainer: {
    paddingHorizontal: Spacing.xl,
  },
  button: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: Colors.light.text,
    borderRadius: BorderRadius.xl,
    paddingVertical: Spacing.lg,
    paddingLeft: Spacing["2xl"],
    paddingRight: Spacing.md,
  },
  buttonText: {
    color: "#FFFFFF",
    fontSize: 18,
  },
  arrowCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#C8E946",
    alignItems: "center",
    justifyContent: "center",
  },
});
