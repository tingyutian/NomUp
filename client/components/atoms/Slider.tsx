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
  min = 0,
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
            AMOUNT USED
          </ThemedText>
          <ThemedText type="h4">{value}/{max}</ThemedText>
        </View>
      ) : null}
      <View style={styles.track}>
        {steps.map((stepValue, index) => {
          const isActive = stepValue <= value;
          const isLast = index === steps.length - 1;
          return (
            <Pressable
              key={stepValue}
              onPress={() => handleStepPress(stepValue)}
              style={[
                styles.step,
                isLast ? styles.lastStep : undefined,
              ]}
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
    height: 24,
  },
  step: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing.sm,
  },
  lastStep: {
    flex: 0,
  },
  dot: {
    width: 16,
    height: 16,
    borderRadius: 8,
  },
});
