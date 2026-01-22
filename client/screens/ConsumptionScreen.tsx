import React, { useState, useMemo } from "react";
import { View, StyleSheet, ScrollView, TextInput, Pressable, Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";
import Animated, { FadeInDown } from "react-native-reanimated";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { ThemedText } from "@/components/ThemedText";
import { Button } from "@/components/Button";
import { Badge } from "@/components/atoms/Badge";
import { ConsumptionItem } from "@/components/molecules/ConsumptionItem";
import { useTheme } from "@/hooks/useTheme";
import { useApp, GroceryItem } from "@/context/AppContext";
import { BorderRadius, Spacing, Colors } from "@/constants/theme";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { RootStackParamList } from "@/navigation/RootStackNavigator";

type Props = NativeStackScreenProps<RootStackParamList, "Consumption">;

export default function ConsumptionScreen({ navigation }: Props) {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const { groceries, useGrocery, throwAwayGrocery, addToShoppingList } = useApp();

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedItems, setSelectedItems] = useState<Record<string, number>>({});

  const filteredGroceries = useMemo(() => {
    if (!searchQuery) return groceries;
    const query = searchQuery.toLowerCase();
    return groceries.filter(
      (item) =>
        item.name.toLowerCase().includes(query) ||
        item.category.toLowerCase().includes(query)
    );
  }, [groceries, searchQuery]);

  const toggleItem = (id: string) => {
    setSelectedItems((prev) => {
      if (prev[id] !== undefined) {
        const { [id]: _, ...rest } = prev;
        return rest;
      }
      return { ...prev, [id]: 3 };
    });
  };

  const setUsedAmount = (id: string, amount: number) => {
    setSelectedItems((prev) => ({ ...prev, [id]: amount }));
  };

  const handleUsedAll = async (item: GroceryItem) => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    await useGrocery(item.id, 10);
    setSelectedItems((prev) => {
      const { [item.id]: _, ...rest } = prev;
      return rest;
    });
  };

  const handleThrewAway = async (item: GroceryItem) => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    await throwAwayGrocery(item.id);
    setSelectedItems((prev) => {
      const { [item.id]: _, ...rest } = prev;
      return rest;
    });
  };

  const handleAddToShoppingList = async (item: GroceryItem) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await addToShoppingList({
      name: item.name,
      quantity: 1,
      unit: item.unit,
    });
  };

  const handleSaveConsumption = async () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    
    for (const [id, amount] of Object.entries(selectedItems)) {
      await useGrocery(id, amount);
    }
    
    navigation.goBack();
  };

  const selectedCount = Object.keys(selectedItems).length;

  return (
    <View style={[styles.container, { backgroundColor: theme.backgroundRoot }]}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={{
          paddingTop: headerHeight + Spacing.lg,
          paddingBottom: insets.bottom + 120,
          paddingHorizontal: Spacing.lg,
        }}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View entering={FadeInDown.delay(100)}>
          <View style={styles.header}>
            <Badge label="LIVE INVENTORY" variant="default" />
          </View>
          <ThemedText type="h1" style={styles.title}>
            Log daily{"\n"}consumption
          </ThemedText>
          <ThemedText type="body" style={[styles.subtitle, { color: theme.textSecondary }]}>
            Select items from your pantry to record usage or waste.
          </ThemedText>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(200)} style={styles.searchContainer}>
          <Feather name="search" size={20} color={theme.textSecondary} />
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search inventory..."
            placeholderTextColor={theme.textSecondary}
            style={[styles.searchInput, { color: theme.text }]}
          />
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(300)} style={styles.itemsList}>
          {filteredGroceries.length > 0 ? (
            filteredGroceries.map((item, index) => (
              <ConsumptionItem
                key={item.id}
                item={item}
                isSelected={selectedItems[item.id] !== undefined}
                onToggle={() => toggleItem(item.id)}
                usedAmount={selectedItems[item.id] || 0}
                onUsedAmountChange={(amount) => setUsedAmount(item.id, amount)}
                onUsedAll={() => handleUsedAll(item)}
                onThrewAway={() => handleThrewAway(item)}
                onAddToShoppingList={() => handleAddToShoppingList(item)}
                testID={`consumption-item-${index}`}
              />
            ))
          ) : (
            <View style={styles.emptyState}>
              <Feather name="package" size={48} color={theme.textSecondary} />
              <ThemedText type="body" style={{ color: theme.textSecondary, marginTop: Spacing.md }}>
                {searchQuery ? "No items found" : "No items in your inventory"}
              </ThemedText>
            </View>
          )}
        </Animated.View>
      </ScrollView>

      {selectedCount > 0 ? (
        <Animated.View
          entering={FadeInDown}
          style={[
            styles.footer,
            {
              backgroundColor: theme.backgroundDefault,
              paddingBottom: insets.bottom + Spacing.lg,
            },
          ]}
        >
          <Button onPress={handleSaveConsumption} style={styles.saveButton}>
            SAVE CONSUMPTION LOG
          </Button>
        </Animated.View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    marginBottom: Spacing.md,
  },
  title: {
    marginBottom: Spacing.md,
  },
  subtitle: {
    marginBottom: Spacing.xl,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.light.backgroundDefault,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    marginBottom: Spacing.xl,
  },
  searchInput: {
    flex: 1,
    marginLeft: Spacing.md,
    fontSize: 16,
  },
  itemsList: {
    gap: Spacing.md,
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing["5xl"],
  },
  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: Spacing.lg,
    borderTopWidth: 1,
    borderTopColor: Colors.light.divider,
  },
  saveButton: {
    backgroundColor: Colors.light.text,
  },
});
