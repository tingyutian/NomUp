import React, { useEffect } from "react";
import { StyleSheet } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withDelay,
  runOnJS,
} from "react-native-reanimated";
import { useHeaderHeight } from "@react-navigation/elements";
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
  const headerHeight = useHeaderHeight();
  const translateY = useSharedValue(-60);
  const opacity = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      translateY.value = withSpring(0, { damping: 15, stiffness: 150 });
      opacity.value = withSpring(1);
      
      const hideTimeout = setTimeout(() => {
        translateY.value = withSpring(-60, { damping: 15, stiffness: 150 });
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
        { top: headerHeight },
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
    left: 0,
    right: 0,
    backgroundColor: Colors.light.text,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xl,
    zIndex: 1000,
  },
  message: {
    color: "#FFF",
    marginLeft: Spacing.sm,
  },
});
