import React, { useState } from "react";
import {
  View,
  StyleSheet,
  Modal,
  TextInput,
  Pressable,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { ThemedText } from "@/components/ThemedText";
import { Button } from "@/components/Button";
import { useTheme } from "@/hooks/useTheme";
import { BorderRadius, Spacing } from "@/constants/theme";

interface EditItemModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: (data: { name: string; quantity: number; expiresIn: number }) => void;
  initialName?: string;
  initialQuantity?: number;
  initialExpiresIn?: number;
}

export function EditItemModal({
  visible,
  onClose,
  onSave,
  initialName = "",
  initialQuantity = 1,
  initialExpiresIn = 7,
}: EditItemModalProps) {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const [name, setName] = useState(initialName);
  const [quantity, setQuantity] = useState(initialQuantity);
  const [expiresIn, setExpiresIn] = useState(initialExpiresIn);

  React.useEffect(() => {
    if (visible) {
      setName(initialName);
      setQuantity(initialQuantity);
      setExpiresIn(initialExpiresIn);
    }
  }, [visible, initialName, initialQuantity, initialExpiresIn]);

  const handleSave = () => {
    onSave({ name, quantity, expiresIn });
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.overlay}
      >
        <Pressable style={styles.backdrop} onPress={onClose} />
        <View
          style={[
            styles.content,
            {
              backgroundColor: theme.backgroundRoot,
              paddingBottom: insets.bottom + Spacing.xl,
            },
          ]}
        >
          <View style={styles.handle} />
          <View style={styles.header}>
            <ThemedText type="h3">Edit Item</ThemedText>
            <Pressable onPress={onClose} style={styles.closeButton}>
              <Feather name="x" size={24} color={theme.text} />
            </Pressable>
          </View>

          <View style={styles.field}>
            <ThemedText type="small" style={[styles.label, { color: theme.textSecondary }]}>
              Product Name
            </ThemedText>
            <TextInput
              value={name}
              onChangeText={setName}
              style={[
                styles.input,
                {
                  backgroundColor: theme.backgroundDefault,
                  color: theme.text,
                  borderColor: theme.divider,
                },
              ]}
              placeholderTextColor={theme.textSecondary}
              placeholder="Enter product name"
            />
          </View>

          <View style={styles.field}>
            <ThemedText type="small" style={[styles.label, { color: theme.textSecondary }]}>
              Quantity
            </ThemedText>
            <View style={styles.quantityControls}>
              <Pressable
                onPress={() => setQuantity(Math.max(1, quantity - 1))}
                style={[styles.quantityButton, { borderColor: theme.divider }]}
              >
                <Feather name="minus" size={20} color={theme.text} />
              </Pressable>
              <ThemedText type="h4" style={styles.quantityText}>
                {quantity}
              </ThemedText>
              <Pressable
                onPress={() => setQuantity(quantity + 1)}
                style={[styles.quantityButton, { borderColor: theme.divider }]}
              >
                <Feather name="plus" size={20} color={theme.text} />
              </Pressable>
            </View>
          </View>

          <View style={styles.field}>
            <ThemedText type="small" style={[styles.label, { color: theme.textSecondary }]}>
              Expires In (days)
            </ThemedText>
            <View style={styles.quantityControls}>
              <Pressable
                onPress={() => setExpiresIn(Math.max(1, expiresIn - 1))}
                style={[styles.quantityButton, { borderColor: theme.divider }]}
              >
                <Feather name="minus" size={20} color={theme.text} />
              </Pressable>
              <ThemedText type="h4" style={styles.quantityText}>
                {expiresIn}d
              </ThemedText>
              <Pressable
                onPress={() => setExpiresIn(expiresIn + 1)}
                style={[styles.quantityButton, { borderColor: theme.divider }]}
              >
                <Feather name="plus" size={20} color={theme.text} />
              </Pressable>
            </View>
          </View>

          <Button onPress={handleSave} style={styles.saveButton}>
            Save Changes
          </Button>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "flex-end",
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  content: {
    borderTopLeftRadius: BorderRadius["2xl"],
    borderTopRightRadius: BorderRadius["2xl"],
    padding: Spacing.xl,
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: "#D1D1D1",
    borderRadius: 2,
    alignSelf: "center",
    marginBottom: Spacing.lg,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.xl,
  },
  closeButton: {
    padding: Spacing.xs,
  },
  field: {
    marginBottom: Spacing.xl,
  },
  label: {
    marginBottom: Spacing.sm,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  input: {
    height: 48,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    paddingHorizontal: Spacing.lg,
    fontSize: 16,
  },
  quantityControls: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  quantityButton: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  quantityText: {
    minWidth: 80,
    textAlign: "center",
  },
  saveButton: {
    marginTop: Spacing.md,
  },
});
