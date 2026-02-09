import React from "react";
import { View, StyleSheet, Modal, Pressable } from "react-native";
import Animated, { FadeIn, FadeOut, SlideInDown, SlideOutDown } from "react-native-reanimated";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { BorderRadius, Spacing } from "@/constants/theme";

interface ConfirmationModalProps {
  visible: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  testID?: string;
}

export function ConfirmationModal({
  visible,
  title,
  message,
  confirmLabel = "Delete",
  cancelLabel = "Cancel",
  destructive = true,
  onConfirm,
  onCancel,
  testID,
}: ConfirmationModalProps) {
  const { theme } = useTheme();

  const handleConfirm = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onConfirm();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      statusBarTranslucent
      testID={testID}
    >
      <View style={styles.overlay}>
        <Animated.View
          entering={FadeIn.duration(200)}
          exiting={FadeOut.duration(150)}
          style={styles.backdropFill}
        >
          <Pressable style={StyleSheet.absoluteFill} onPress={onCancel} />
        </Animated.View>

        <Animated.View
          entering={SlideInDown.springify().damping(20).stiffness(200)}
          exiting={SlideOutDown.duration(200)}
          style={[styles.content, { backgroundColor: theme.backgroundDefault }]}
        >
          <View style={[styles.iconContainer, { backgroundColor: destructive ? "#FDECEC" : theme.backgroundTertiary }]}>
            <Feather
              name={destructive ? "alert-triangle" : "info"}
              size={28}
              color={destructive ? "#EF5350" : theme.text}
            />
          </View>

          <ThemedText type="h4" style={styles.title}>
            {title}
          </ThemedText>
          <ThemedText type="body" style={[styles.message, { color: theme.textSecondary }]}>
            {message}
          </ThemedText>

          <View style={styles.buttonRow}>
            <Pressable
              onPress={onCancel}
              style={[styles.button, { backgroundColor: theme.backgroundTertiary }]}
              testID={testID ? `${testID}-cancel` : "confirm-modal-cancel"}
            >
              <ThemedText type="bodyMedium">{cancelLabel}</ThemedText>
            </Pressable>
            <Pressable
              onPress={handleConfirm}
              style={[
                styles.button,
                { backgroundColor: destructive ? "#EF5350" : theme.text },
              ]}
              testID={testID ? `${testID}-confirm` : "confirm-modal-confirm"}
            >
              <ThemedText type="bodyMedium" style={{ color: "#FFFFFF" }}>
                {confirmLabel}
              </ThemedText>
            </Pressable>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: Spacing["3xl"],
  },
  backdropFill: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  content: {
    width: "100%",
    maxWidth: 768,
    alignSelf: "center",
    borderRadius: BorderRadius["2xl"],
    padding: Spacing["3xl"],
    alignItems: "center",
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: BorderRadius.full,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.lg,
  },
  title: {
    textAlign: "center",
    marginBottom: Spacing.sm,
  },
  message: {
    textAlign: "center",
    marginBottom: Spacing["2xl"],
  },
  buttonRow: {
    flexDirection: "row",
    gap: Spacing.md,
    width: "100%",
  },
  button: {
    flex: 1,
    height: Spacing.buttonHeight,
    borderRadius: BorderRadius.md,
    alignItems: "center",
    justifyContent: "center",
  },
});
