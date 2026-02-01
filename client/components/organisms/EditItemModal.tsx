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
  onSave: (data: { name: string; quantity: number; expiresIn: number; category?: string; storageLocation?: "fridge" | "freezer" | "pantry" }) => void;
  initialName?: string;
  initialQuantity?: number;
  initialExpiresIn?: number;
  initialCategory?: string;
  initialStorageLocation?: "fridge" | "freezer" | "pantry";
  showCategoryAndStorage?: boolean;
}

const STORAGE_OPTIONS: { value: "fridge" | "freezer" | "pantry"; label: string }[] = [
  { value: "fridge", label: "Fridge" },
  { value: "freezer", label: "Freezer" },
  { value: "pantry", label: "Pantry" },
];

const CATEGORY_OPTIONS = [
  "Produce",
  "Dairy",
  "Bakery",
  "Meat",
  "Pantry",
  "Frozen",
  "Beverages",
];

export function EditItemModal({
  visible,
  onClose,
  onSave,
  initialName = "",
  initialQuantity = 1,
  initialExpiresIn = 7,
  initialCategory = "Pantry",
  initialStorageLocation = "pantry",
  showCategoryAndStorage = false,
}: EditItemModalProps) {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const [name, setName] = useState(initialName);
  const [quantity, setQuantity] = useState(initialQuantity);
  const [expiresIn, setExpiresIn] = useState(initialExpiresIn);
  const [category, setCategory] = useState(initialCategory);
  const [storageLocation, setStorageLocation] = useState(initialStorageLocation);
  const [showStorageDropdown, setShowStorageDropdown] = useState(false);
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);

  React.useEffect(() => {
    if (visible) {
      setName(initialName);
      setQuantity(initialQuantity);
      setExpiresIn(initialExpiresIn);
      setCategory(initialCategory);
      setStorageLocation(initialStorageLocation);
      setShowStorageDropdown(false);
      setShowCategoryDropdown(false);
    }
  }, [visible, initialName, initialQuantity, initialExpiresIn, initialCategory, initialStorageLocation]);

  const handleSave = () => {
    const data: { name: string; quantity: number; expiresIn: number; category?: string; storageLocation?: "fridge" | "freezer" | "pantry" } = { name, quantity, expiresIn };
    if (showCategoryAndStorage) {
      data.category = category;
      data.storageLocation = storageLocation;
    }
    onSave(data);
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

          {showCategoryAndStorage ? (
            <>
              <View style={styles.field}>
                <ThemedText type="small" style={[styles.label, { color: theme.textSecondary }]}>
                  Category
                </ThemedText>
                <Pressable
                  onPress={() => setShowCategoryDropdown(!showCategoryDropdown)}
                  style={[
                    styles.dropdownButton,
                    {
                      backgroundColor: theme.backgroundDefault,
                      borderColor: theme.divider,
                    },
                  ]}
                >
                  <ThemedText type="body">{category}</ThemedText>
                  <Feather name={showCategoryDropdown ? "chevron-up" : "chevron-down"} size={20} color={theme.text} />
                </Pressable>
                {showCategoryDropdown ? (
                  <View style={[styles.dropdown, { backgroundColor: theme.backgroundDefault, borderColor: theme.divider }]}>
                    {CATEGORY_OPTIONS.map((opt) => (
                      <Pressable
                        key={opt}
                        onPress={() => {
                          setCategory(opt);
                          setShowCategoryDropdown(false);
                        }}
                        style={[
                          styles.dropdownItem,
                          category === opt && { backgroundColor: theme.divider },
                        ]}
                      >
                        <ThemedText type="body">{opt}</ThemedText>
                      </Pressable>
                    ))}
                  </View>
                ) : null}
              </View>

              <View style={styles.field}>
                <ThemedText type="small" style={[styles.label, { color: theme.textSecondary }]}>
                  Storage Location
                </ThemedText>
                <Pressable
                  onPress={() => setShowStorageDropdown(!showStorageDropdown)}
                  style={[
                    styles.dropdownButton,
                    {
                      backgroundColor: theme.backgroundDefault,
                      borderColor: theme.divider,
                    },
                  ]}
                >
                  <ThemedText type="body">
                    {STORAGE_OPTIONS.find((o) => o.value === storageLocation)?.label || "Select"}
                  </ThemedText>
                  <Feather name={showStorageDropdown ? "chevron-up" : "chevron-down"} size={20} color={theme.text} />
                </Pressable>
                {showStorageDropdown ? (
                  <View style={[styles.dropdown, { backgroundColor: theme.backgroundDefault, borderColor: theme.divider }]}>
                    {STORAGE_OPTIONS.map((opt) => (
                      <Pressable
                        key={opt.value}
                        onPress={() => {
                          setStorageLocation(opt.value);
                          setShowStorageDropdown(false);
                        }}
                        style={[
                          styles.dropdownItem,
                          storageLocation === opt.value && { backgroundColor: theme.divider },
                        ]}
                      >
                        <ThemedText type="body">{opt.label}</ThemedText>
                      </Pressable>
                    ))}
                  </View>
                ) : null}
              </View>
            </>
          ) : null}

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
  dropdownButton: {
    height: 48,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    paddingHorizontal: Spacing.lg,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  dropdown: {
    marginTop: Spacing.xs,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    overflow: "hidden",
  },
  dropdownItem: {
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
  },
});
