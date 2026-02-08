import React from "react";
import { View, StyleSheet, ViewStyle, Pressable } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { BorderRadius, Spacing } from "@/constants/theme";

interface SliderProps {
  value: number;
  onValueChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  style?: ViewStyle;
  showLabel?: boolean;
  testID?: string;
}

export function Slider({
  value,
  onValueChange,
  min = 1,
  max = 10,
  step = 1,
  style,
  showLabel = true,
  testID,
}: SliderProps) {
  const { theme } = useTheme();
  const steps = Array.from({ length: (max - min) / step + 1 }, (_, i) => min + i * step);

  const handleStepPress = (stepValue: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onValueChange(stepValue);
  };

  return (
    <View style={[styles.container, style]} testID={testID}>
      {showLabel ? (
        <View style={styles.labelContainer}>
          <ThemedText type="caption" style={{ color: theme.textSecondary }}>
            LOG AMOUNT
          </ThemedText>
          <ThemedText type="h4">{value}/{max}</ThemedText>
        </View>
      ) : null}
      <View style={styles.track}>
        {steps.map((stepValue) => {
          const isActive = stepValue <= value;
          return (
            <Pressable
              key={stepValue}
              onPress={() => handleStepPress(stepValue)}
              hitSlop={4}
              style={styles.step}
            >
              <View
                style={[
                  styles.dot,
                  {
                    backgroundColor: isActive ? theme.text : theme.divider,
                  },
                ]}
              />
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
  },
  labelContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.md,
  },
  track: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    height: 32,
  },
  step: {
    alignItems: "center",
    justifyContent: "center",
    padding: Spacing.xs,
  },
  dot: {
    width: 16,
    height: 16,
    borderRadius: 8,
  },
});
