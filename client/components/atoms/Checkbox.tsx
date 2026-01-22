import React from "react";
import { Pressable, StyleSheet, ViewStyle } from "react-native";
import { Feather } from "@expo/vector-icons";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  interpolateColor,
} from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import { useTheme } from "@/hooks/useTheme";
import { BorderRadius } from "@/constants/theme";

interface CheckboxProps {
  checked: boolean;
  onToggle: () => void;
  size?: number;
  style?: ViewStyle;
  testID?: string;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function Checkbox({ checked, onToggle, size = 24, style, testID }: CheckboxProps) {
  const { theme } = useTheme();
  const scale = useSharedValue(1);
  const progress = useSharedValue(checked ? 1 : 0);

  React.useEffect(() => {
    progress.value = withSpring(checked ? 1 : 0, { damping: 15, stiffness: 200 });
  }, [checked]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    backgroundColor: interpolateColor(
      progress.value,
      [0, 1],
      ["transparent", theme.text]
    ),
    borderColor: interpolateColor(
      progress.value,
      [0, 1],
      [theme.divider, theme.text]
    ),
  }));

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onToggle();
  };

  return (
    <AnimatedPressable
      testID={testID}
      onPress={handlePress}
      onPressIn={() => {
        scale.value = withSpring(0.9, { damping: 15, stiffness: 150 });
      }}
      onPressOut={() => {
        scale.value = withSpring(1, { damping: 15, stiffness: 150 });
      }}
      style={[
        styles.checkbox,
        { width: size, height: size, borderRadius: size / 4 },
        animatedStyle,
        style,
      ]}
    >
      {checked ? (
        <Feather name="check" size={size * 0.6} color={theme.buttonText} />
      ) : null}
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  checkbox: {
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
});
