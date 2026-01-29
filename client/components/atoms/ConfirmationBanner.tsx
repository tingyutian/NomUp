import React, { useEffect } from "react";
import { StyleSheet } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withDelay,
  runOnJS,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { ThemedText } from "@/components/ThemedText";
import { BorderRadius, Spacing, Colors } from "@/constants/theme";

interface ConfirmationBannerProps {
  visible: boolean;
  message: string;
  onHide: () => void;
  duration?: number;
  iconName?: keyof typeof Feather.glyphMap;
}

export function ConfirmationBanner({
  visible,
  message,
  onHide,
  duration = 2500,
  iconName = "check-circle",
}: ConfirmationBannerProps) {
  const insets = useSafeAreaInsets();
  const translateY = useSharedValue(-100);
  const opacity = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      translateY.value = withSpring(0, { damping: 15, stiffness: 150 });
      opacity.value = withSpring(1);
      
      const hideTimeout = setTimeout(() => {
        translateY.value = withSpring(-100, { damping: 15, stiffness: 150 });
        opacity.value = withDelay(200, withSpring(0, {}, () => {
          runOnJS(onHide)();
        }));
      }, duration);

      return () => clearTimeout(hideTimeout);
    }
  }, [visible, duration, onHide]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    opacity: opacity.value,
  }));

  if (!visible) return null;

  return (
    <Animated.View
      style={[
        styles.container,
        { paddingTop: insets.top + Spacing.md },
        animatedStyle,
      ]}
    >
      <Feather name={iconName} size={20} color="#FFF" />
      <ThemedText type="bodyMedium" style={styles.message}>
        {message}
      </ThemedText>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: Colors.light.text,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingBottom: Spacing.lg,
    paddingHorizontal: Spacing.xl,
    zIndex: 1000,
  },
  message: {
    color: "#FFF",
    marginLeft: Spacing.sm,
  },
});
