import React from "react";
import { View, StyleSheet, Pressable } from "react-native";
import { Feather } from "@expo/vector-icons";
import { ThemedText } from "@/components/ThemedText";
import { Badge } from "@/components/atoms/Badge";
import { useTheme } from "@/hooks/useTheme";
import { BorderRadius, Spacing } from "@/constants/theme";

interface ScannedItemProps {
  name: string;
  category: string;
  quantity: number;
  expiresIn: number;
  onQuantityChange: (delta: number) => void;
  onEdit: () => void;
  testID?: string;
}

export function ScannedItem({
  name,
  category,
  quantity,
  expiresIn,
  onQuantityChange,
  onEdit,
  testID,
}: ScannedItemProps) {
  const { theme } = useTheme();

  return (
    <View
      testID={testID}
      style={[styles.container, { borderBottomColor: theme.divider }]}
    >
      <View style={styles.mainContent}>
        <View style={styles.nameSection}>
          <ThemedText type="bodyMedium">{name}</ThemedText>
          <View style={styles.metaRow}>
            <Badge label={category} variant="category" category={category} />
            <ThemedText type="small" style={{ color: theme.textSecondary, marginLeft: Spacing.sm }}>
              Exp. {expiresIn}d
            </ThemedText>
          </View>
        </View>
        <View style={styles.rightSection}>
          <View style={styles.quantityControls}>
            <Pressable
              onPress={() => onQuantityChange(-1)}
              style={[styles.quantityButton, { borderColor: theme.divider }]}
            >
              <ThemedText type="body">-</ThemedText>
            </Pressable>
            <ThemedText type="bodyMedium" style={styles.quantityText}>
              {quantity}
            </ThemedText>
            <Pressable
              onPress={() => onQuantityChange(1)}
              style={[styles.quantityButton, { borderColor: theme.divider }]}
            >
              <ThemedText type="body">+</ThemedText>
            </Pressable>
          </View>
          <Pressable onPress={onEdit} style={styles.editButton}>
            <Feather name="edit-2" size={16} color={theme.textSecondary} />
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: Spacing.lg,
    borderBottomWidth: 1,
  },
  mainContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  nameSection: {
    flex: 1,
    marginRight: Spacing.md,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: Spacing.xs,
    flexWrap: "wrap",
  },
  rightSection: {
    flexDirection: "row",
    alignItems: "center",
  },
  quantityControls: {
    flexDirection: "row",
    alignItems: "center",
  },
  quantityButton: {
    width: 32,
    height: 32,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  quantityText: {
    minWidth: 32,
    textAlign: "center",
  },
  editButton: {
    marginLeft: Spacing.md,
    padding: Spacing.xs,
  },
});
