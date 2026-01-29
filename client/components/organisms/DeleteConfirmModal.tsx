import React from "react";
import { View, StyleSheet, Modal, Pressable } from "react-native";
import { Feather } from "@expo/vector-icons";
import { ThemedText } from "@/components/ThemedText";
import { Button } from "@/components/Button";
import { useTheme } from "@/hooks/useTheme";
import { BorderRadius, Spacing, Colors } from "@/constants/theme";

interface DeleteConfirmModalProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: () => void;
  itemName: string;
}

export function DeleteConfirmModal({
  visible,
  onClose,
  onConfirm,
  itemName,
}: DeleteConfirmModalProps) {
  const { theme } = useTheme();

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <Pressable style={styles.backdrop} onPress={onClose} />
        <View style={[styles.content, { backgroundColor: theme.backgroundRoot }]}>
          <View style={[styles.iconContainer, { backgroundColor: "#FEE2E2" }]}>
            <Feather name="trash-2" size={32} color="#E53935" />
          </View>
          
          <ThemedText type="h3" style={styles.title}>
            Delete Item?
          </ThemedText>
          
          <ThemedText type="body" style={[styles.message, { color: theme.textSecondary }]}>
            Are you sure you want to delete "{itemName}" from your pantry? This action cannot be undone.
          </ThemedText>

          <View style={styles.actions}>
            <Pressable
              onPress={onClose}
              style={[styles.cancelButton, { borderColor: theme.divider }]}
              testID="button-cancel-delete"
            >
              <ThemedText type="bodyMedium">Cancel</ThemedText>
            </Pressable>
            <Button
              onPress={onConfirm}
              style={styles.deleteButton}
              testID="button-confirm-delete"
            >
              Delete
            </Button>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: Spacing.xl,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  content: {
    width: "100%",
    borderRadius: BorderRadius["2xl"],
    padding: Spacing.xl,
    alignItems: "center",
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.lg,
  },
  title: {
    marginBottom: Spacing.sm,
    textAlign: "center",
  },
  message: {
    textAlign: "center",
    marginBottom: Spacing.xl,
  },
  actions: {
    flexDirection: "row",
    gap: Spacing.md,
    width: "100%",
  },
  cancelButton: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing.lg,
    borderWidth: 1,
    borderRadius: BorderRadius.lg,
  },
  deleteButton: {
    flex: 1,
    backgroundColor: "#E53935",
  },
});
