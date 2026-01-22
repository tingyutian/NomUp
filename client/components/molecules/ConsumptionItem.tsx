import React, { useState } from "react";
import { View, StyleSheet, Pressable } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import { ThemedText } from "@/components/ThemedText";
import { Checkbox } from "@/components/atoms/Checkbox";
import { Slider } from "@/components/atoms/Slider";
import { Button } from "@/components/Button";
import { useTheme } from "@/hooks/useTheme";
import { BorderRadius, Spacing, Colors } from "@/constants/theme";
import { GroceryItem } from "@/context/AppContext";

interface ConsumptionItemProps {
  item: GroceryItem;
  isSelected: boolean;
  onToggle: () => void;
  usedAmount: number;
  onUsedAmountChange: (amount: number) => void;
  onUsedAll: () => void;
  onThrewAway: () => void;
  onAddToShoppingList: () => void;
  testID?: string;
}

const categoryColors: Record<string, string> = {
  produce: Colors.light.produce,
  dairy: Colors.light.dairy,
  bakery: Colors.light.bakery,
  meat: Colors.light.meat,
  pantry: Colors.light.pantry,
  frozen: Colors.light.frozen,
};

export function ConsumptionItem({
  item,
  isSelected,
  onToggle,
  usedAmount,
  onUsedAmountChange,
  onUsedAll,
  onThrewAway,
  onAddToShoppingList,
  testID,
}: ConsumptionItemProps) {
  const { theme } = useTheme();
  const categoryColor = categoryColors[item.category.toLowerCase()] || Colors.light.pantry;

  const getExpirationText = () => {
    if (item.expiresIn <= 0) return "Expired";
    if (item.expiresIn === 1) return "Exp. Today";
    return `Exp. in ${item.expiresIn} days`;
  };

  return (
    <View
      testID={testID}
      style={[
        styles.container,
        {
          backgroundColor: isSelected ? theme.backgroundDefault : theme.backgroundSecondary,
          borderColor: isSelected ? theme.text : "transparent",
          borderWidth: isSelected ? 1 : 0,
        },
      ]}
    >
      <View style={styles.header}>
        <View style={styles.leftSection}>
          <View style={[styles.iconContainer, { backgroundColor: categoryColor }]}>
            <View style={styles.iconInner} />
          </View>
          <View style={styles.nameContainer}>
            <ThemedText type="bodyMedium">{item.name}</ThemedText>
            <ThemedText type="small" style={{ color: theme.textSecondary }}>
              {getExpirationText()}
            </ThemedText>
          </View>
        </View>
        <Checkbox
          checked={isSelected}
          onToggle={onToggle}
          testID={`${testID}-checkbox`}
        />
      </View>

      {isSelected ? (
        <View style={styles.expandedContent}>
          <Slider
            value={usedAmount}
            onValueChange={onUsedAmountChange}
            min={1}
            max={10}
            step={1}
            style={styles.slider}
            testID={`${testID}-slider`}
          />
          <View style={styles.actions}>
            <Pressable
              onPress={onThrewAway}
              style={[styles.actionButton, { borderColor: theme.divider }]}
            >
              <ThemedText type="small">THREW AWAY</ThemedText>
            </Pressable>
            <Pressable
              onPress={onUsedAll}
              style={[styles.actionButton, { borderColor: theme.divider }]}
            >
              <ThemedText type="small">USED ALL</ThemedText>
            </Pressable>
          </View>
          <Pressable
            onPress={onAddToShoppingList}
            style={[styles.addToListButton, { borderColor: theme.divider }]}
          >
            <ThemedText type="small" style={{ color: theme.link }}>
              Add to Shopping List
            </ThemedText>
          </Pressable>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  leftSection: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.md,
    alignItems: "center",
    justifyContent: "center",
    marginRight: Spacing.md,
  },
  iconInner: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "rgba(255,255,255,0.5)",
  },
  nameContainer: {
    flex: 1,
  },
  expandedContent: {
    marginTop: Spacing.lg,
  },
  slider: {
    marginBottom: Spacing.lg,
  },
  actions: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: Spacing.md,
  },
  actionButton: {
    flex: 1,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    alignItems: "center",
  },
  addToListButton: {
    marginTop: Spacing.md,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    alignItems: "center",
  },
});
