import React, { useState } from "react";
import {
  View,
  StyleSheet,
  Modal,
  TextInput,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { ThemedText } from "@/components/ThemedText";
import { Button } from "@/components/Button";
import { useTheme } from "@/hooks/useTheme";
import { BorderRadius, Spacing, Colors } from "@/constants/theme";

interface AddItemModalProps {
  visible: boolean;
  onClose: () => void;
  onAdd: (data: {
    name: string;
    quantity: number;
    unit: string;
    category: string;
    expiresIn: number;
    storageLocation: "fridge" | "freezer" | "pantry";
  }) => void;
  mode?: "grocery" | "shopping";
}

const categories = ["Produce", "Dairy", "Bakery", "Meat", "Pantry", "Frozen"];
const storageLocations = [
  { key: "fridge" as const, label: "Fridge" },
  { key: "freezer" as const, label: "Freezer" },
  { key: "pantry" as const, label: "Pantry" },
];

export function AddItemModal({
  visible,
  onClose,
  onAdd,
  mode = "grocery",
}: AddItemModalProps) {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const [name, setName] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [unit, setUnit] = useState("units");
  const [category, setCategory] = useState("Produce");
  const [expiresIn, setExpiresIn] = useState(7);
  const [storageLocation, setStorageLocation] = useState<"fridge" | "freezer" | "pantry">("fridge");

  const handleAdd = () => {
    if (!name.trim()) return;
    onAdd({
      name: name.trim(),
      quantity,
      unit,
      category,
      expiresIn,
      storageLocation,
    });
    resetForm();
    onClose();
  };

  const resetForm = () => {
    setName("");
    setQuantity(1);
    setUnit("units");
    setCategory("Produce");
    setExpiresIn(7);
    setStorageLocation("fridge");
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
            <ThemedText type="h3">
              {mode === "grocery" ? "Add Grocery" : "Add to List"}
            </ThemedText>
            <Pressable onPress={onClose} style={styles.closeButton}>
              <Feather name="x" size={24} color={theme.text} />
            </Pressable>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
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

            <View style={styles.row}>
              <View style={[styles.field, { flex: 1, marginRight: Spacing.md }]}>
                <ThemedText type="small" style={[styles.label, { color: theme.textSecondary }]}>
                  Quantity
                </ThemedText>
                <View style={styles.quantityControls}>
                  <Pressable
                    onPress={() => setQuantity(Math.max(1, quantity - 1))}
                    style={[styles.quantityButton, { borderColor: theme.divider }]}
                  >
                    <Feather name="minus" size={16} color={theme.text} />
                  </Pressable>
                  <ThemedText type="bodyMedium" style={styles.quantityText}>
                    {quantity}
                  </ThemedText>
                  <Pressable
                    onPress={() => setQuantity(quantity + 1)}
                    style={[styles.quantityButton, { borderColor: theme.divider }]}
                  >
                    <Feather name="plus" size={16} color={theme.text} />
                  </Pressable>
                </View>
              </View>
              <View style={[styles.field, { flex: 1 }]}>
                <ThemedText type="small" style={[styles.label, { color: theme.textSecondary }]}>
                  Unit
                </ThemedText>
                <TextInput
                  value={unit}
                  onChangeText={setUnit}
                  style={[
                    styles.input,
                    {
                      backgroundColor: theme.backgroundDefault,
                      color: theme.text,
                      borderColor: theme.divider,
                    },
                  ]}
                  placeholderTextColor={theme.textSecondary}
                />
              </View>
            </View>

            {mode === "grocery" ? (
              <>
                <View style={styles.field}>
                  <ThemedText type="small" style={[styles.label, { color: theme.textSecondary }]}>
                    Category
                  </ThemedText>
                  <View style={styles.categoryGrid}>
                    {categories.map((cat) => (
                      <Pressable
                        key={cat}
                        onPress={() => setCategory(cat)}
                        style={[
                          styles.categoryChip,
                          {
                            backgroundColor:
                              category === cat
                                ? theme.text
                                : theme.backgroundDefault,
                            borderColor: theme.divider,
                          },
                        ]}
                      >
                        <ThemedText
                          type="small"
                          style={{
                            color: category === cat ? theme.buttonText : theme.text,
                          }}
                        >
                          {cat}
                        </ThemedText>
                      </Pressable>
                    ))}
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
                      <Feather name="minus" size={16} color={theme.text} />
                    </Pressable>
                    <TextInput
                      value={String(expiresIn)}
                      onChangeText={(text) => {
                        const num = parseInt(text, 10);
                        if (!isNaN(num) && num >= 1) {
                          setExpiresIn(num);
                        } else if (text === "") {
                          setExpiresIn(1);
                        }
                      }}
                      keyboardType="number-pad"
                      style={[styles.expiresInput, { color: theme.text, borderColor: theme.divider }]}
                      testID="input-expires-in"
                    />
                    <Pressable
                      onPress={() => setExpiresIn(expiresIn + 1)}
                      style={[styles.quantityButton, { borderColor: theme.divider }]}
                    >
                      <Feather name="plus" size={16} color={theme.text} />
                    </Pressable>
                  </View>
                </View>

                <View style={styles.field}>
                  <ThemedText type="small" style={[styles.label, { color: theme.textSecondary }]}>
                    Storage Location
                  </ThemedText>
                  <View style={styles.storageOptions}>
                    {storageLocations.map((loc) => (
                      <Pressable
                        key={loc.key}
                        onPress={() => setStorageLocation(loc.key)}
                        style={[
                          styles.storageChip,
                          {
                            backgroundColor:
                              storageLocation === loc.key
                                ? theme.text
                                : theme.backgroundDefault,
                            borderColor: theme.divider,
                          },
                        ]}
                      >
                        <ThemedText
                          type="small"
                          style={{
                            color:
                              storageLocation === loc.key
                                ? theme.buttonText
                                : theme.text,
                          }}
                        >
                          {loc.label}
                        </ThemedText>
                      </Pressable>
                    ))}
                  </View>
                </View>
              </>
            ) : null}

            <Button
              onPress={handleAdd}
              style={styles.addButton}
              disabled={!name.trim()}
            >
              {mode === "grocery" ? "Add to Inventory" : "Add to List"}
            </Button>
          </ScrollView>
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
    maxHeight: "85%",
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
  row: {
    flexDirection: "row",
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
    width: 40,
    height: 40,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  quantityText: {
    minWidth: 60,
    textAlign: "center",
  },
  expiresInput: {
    minWidth: 60,
    height: 40,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    textAlign: "center",
    fontSize: 16,
    fontFamily: "Inter_500Medium",
    marginHorizontal: Spacing.md,
  },
  categoryGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.sm,
  },
  categoryChip: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
  },
  storageOptions: {
    flexDirection: "row",
    gap: Spacing.sm,
  },
  storageChip: {
    flex: 1,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    alignItems: "center",
  },
  addButton: {
    marginTop: Spacing.md,
    marginBottom: Spacing.xl,
  },
});
