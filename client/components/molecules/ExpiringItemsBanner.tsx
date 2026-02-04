import React from "react";
import { View, StyleSheet, Pressable } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { Colors, Spacing, BorderRadius } from "@/constants/theme";

interface ExpiringItemsBannerProps {
  expiringCount: number;
  onPress: () => void;
  testID?: string;
}

export function ExpiringItemsBanner({ expiringCount, onPress, testID }: ExpiringItemsBannerProps) {
  const { theme } = useTheme();

  if (expiringCount < 2) return null;

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onPress();
  };

  return (
    <Animated.View entering={FadeInDown.delay(50).duration(300)}>
      <Pressable
        onPress={handlePress}
        style={[styles.container, { backgroundColor: Colors.light.expiringOrange }]}
        testID={testID}
      >
        <View style={styles.iconContainer}>
          <Feather name="alert-circle" size={24} color="#FFF" />
        </View>
        <View style={styles.textContainer}>
          <ThemedText type="bodyMedium" style={styles.title}>
            {expiringCount} items expiring soon
          </ThemedText>
          <ThemedText type="small" style={styles.subtitle}>
            Let's cook something delicious before they go to waste
          </ThemedText>
        </View>
        <View style={styles.buttonContainer}>
          <View style={styles.button}>
            <ThemedText type="bodyMedium" style={styles.buttonText}>
              Find Recipes
            </ThemedText>
            <Feather name="chevron-right" size={16} color={Colors.light.expiringOrange} />
          </View>
        </View>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.lg,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: Spacing.md,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    color: "#FFF",
    marginBottom: 2,
  },
  subtitle: {
    color: "rgba(255,255,255,0.85)",
  },
  buttonContainer: {
    marginLeft: Spacing.sm,
  },
  button: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    gap: 4,
  },
  buttonText: {
    color: Colors.light.expiringOrange,
  },
});
