import React, { useState, useMemo, useCallback } from "react";
import { View, StyleSheet, ScrollView, Pressable } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import Animated, { FadeInDown } from "react-native-reanimated";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { ThemedText } from "@/components/ThemedText";
import { Button } from "@/components/Button";
import { ShoppingListItemCard } from "@/components/molecules/ShoppingListItem";
import { ConfirmationModal } from "@/components/molecules/ConfirmationModal";
import { AddItemModal } from "@/components/organisms/AddItemModal";
import { useTheme } from "@/hooks/useTheme";
import { useApp } from "@/context/AppContext";
import { BorderRadius, Spacing } from "@/constants/theme";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { ShoppingStackParamList } from "@/navigation/ShoppingStackNavigator";

type Props = NativeStackScreenProps<ShoppingStackParamList, "ShoppingList">;

type ConfirmAction =
  | { type: "deleteItem"; itemId: string; itemName: string }
  | { type: "clearList" }
  | { type: "clearCompleted" };

export default function ShoppingListScreen({ navigation }: Props) {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const tabBarHeight = useBottomTabBarHeight();
  const {
    shoppingList,
    addToShoppingList,
    removeFromShoppingList,
    toggleShoppingListItem,
    clearShoppingList,
    groceries,
  } = useApp();

  const [showAddModal, setShowAddModal] = useState(false);
  const [showRecentItems, setShowRecentItems] = useState(false);
  const [confirmAction, setConfirmAction] = useState<ConfirmAction | null>(null);

  const recentlyUsedItems = useMemo(() => {
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    
    return groceries
      .filter((g) => g.usedAmount > 0)
      .sort((a, b) => new Date(b.addedAt).getTime() - new Date(a.addedAt).getTime())
      .slice(0, 10);
  }, [groceries]);

  const uncheckedItems = shoppingList.filter((item) => !item.checked);
  const checkedItems = shoppingList.filter((item) => item.checked);

  const handleAddItem = async (data: any) => {
    await addToShoppingList({
      name: data.name,
      quantity: data.quantity,
      unit: data.unit,
    });
  };

  const handleAddFromRecent = async (name: string) => {
    await addToShoppingList({
      name,
      quantity: 1,
      unit: "units",
    });
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setShowRecentItems(false);
  };

  const handleConfirm = useCallback(async () => {
    if (!confirmAction) return;

    switch (confirmAction.type) {
      case "deleteItem":
        await removeFromShoppingList(confirmAction.itemId);
        break;
      case "clearList":
        for (const item of uncheckedItems) {
          await removeFromShoppingList(item.id);
        }
        break;
      case "clearCompleted":
        for (const item of checkedItems) {
          await removeFromShoppingList(item.id);
        }
        break;
    }
    setConfirmAction(null);
  }, [confirmAction, uncheckedItems, checkedItems, removeFromShoppingList]);

  const getConfirmModalProps = () => {
    if (!confirmAction) return { title: "", message: "", confirmLabel: "" };

    switch (confirmAction.type) {
      case "deleteItem":
        return {
          title: "Remove Item",
          message: `Are you sure you want to remove "${confirmAction.itemName}" from your shopping list?`,
          confirmLabel: "Remove",
        };
      case "clearList":
        return {
          title: "Clear Shopping List",
          message: `Are you sure you want to remove all ${uncheckedItems.length} item${uncheckedItems.length !== 1 ? "s" : ""} from your shopping list?`,
          confirmLabel: "Clear All",
        };
      case "clearCompleted":
        return {
          title: "Clear Completed Items",
          message: `Are you sure you want to remove all ${checkedItems.length} completed item${checkedItems.length !== 1 ? "s" : ""}?`,
          confirmLabel: "Clear All",
        };
    }
  };

  const renderEmptyState = () => (
    <Animated.View
      entering={FadeInDown.delay(200)}
      style={styles.emptyState}
    >
      <Feather name="shopping-cart" size={64} color={theme.textSecondary} />
      <ThemedText type="h4" style={[styles.emptyTitle, { color: theme.textSecondary }]}>
        Your list is empty
      </ThemedText>
      <ThemedText type="body" style={{ color: theme.textSecondary, textAlign: "center" }}>
        Add items to start building your shopping list
      </ThemedText>
      <Button
        onPress={() => setShowAddModal(true)}
        style={styles.addFirstButton}
      >
        Add First Item
      </Button>
    </Animated.View>
  );

  const confirmModalProps = getConfirmModalProps();

  return (
    <View style={[styles.container, { backgroundColor: theme.backgroundRoot }]}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={{
          paddingTop: headerHeight + Spacing.lg,
          paddingBottom: tabBarHeight + Spacing.xl + 80,
          paddingHorizontal: Spacing.lg,
        }}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View entering={FadeInDown.delay(100)}>
          <ThemedText type="h1" style={styles.title}>
            Shopping List
          </ThemedText>
        </Animated.View>

        {shoppingList.length === 0 ? (
          renderEmptyState()
        ) : (
          <>
            <Animated.View entering={FadeInDown.delay(200)} style={styles.section}>
              {uncheckedItems.length > 0 ? (
                <View style={styles.sectionHeader}>
                  <ThemedText type="small" style={[styles.sectionTitle, { color: theme.textSecondary }]}>
                    {uncheckedItems.length} ITEM{uncheckedItems.length !== 1 ? "S" : ""}
                  </ThemedText>
                  <Pressable
                    onPress={() => setConfirmAction({ type: "clearList" })}
                    style={styles.clearButton}
                    testID="button-clear-shopping-list"
                  >
                    <Feather name="trash-2" size={14} color={theme.expiredRed} />
                    <ThemedText type="small" style={{ color: theme.expiredRed, marginLeft: Spacing.xs }}>
                      Clear All
                    </ThemedText>
                  </Pressable>
                </View>
              ) : null}
              {uncheckedItems.map((item, index) => (
                <ShoppingListItemCard
                  key={item.id}
                  item={item}
                  onToggle={() => toggleShoppingListItem(item.id)}
                  onDelete={() => setConfirmAction({ type: "deleteItem", itemId: item.id, itemName: item.name })}
                  testID={`shopping-item-${index}`}
                />
              ))}
            </Animated.View>

            {checkedItems.length > 0 ? (
              <Animated.View entering={FadeInDown.delay(300)} style={styles.section}>
                <View style={styles.sectionHeader}>
                  <ThemedText type="small" style={[styles.sectionTitle, { color: theme.textSecondary }]}>
                    COMPLETED
                  </ThemedText>
                  <Pressable
                    onPress={() => setConfirmAction({ type: "clearCompleted" })}
                    style={styles.clearButton}
                    testID="button-clear-completed"
                  >
                    <Feather name="trash-2" size={14} color={theme.expiredRed} />
                    <ThemedText type="small" style={{ color: theme.expiredRed, marginLeft: Spacing.xs }}>
                      Clear All
                    </ThemedText>
                  </Pressable>
                </View>
                {checkedItems.map((item, index) => (
                  <ShoppingListItemCard
                    key={item.id}
                    item={item}
                    onToggle={() => toggleShoppingListItem(item.id)}
                    onDelete={() => setConfirmAction({ type: "deleteItem", itemId: item.id, itemName: item.name })}
                    testID={`shopping-item-checked-${index}`}
                  />
                ))}
              </Animated.View>
            ) : null}

            <Animated.View entering={FadeInDown.delay(400)} style={styles.addSection}>
              <Pressable
                onPress={() => setShowRecentItems(!showRecentItems)}
                style={[styles.addFromButton, { borderColor: theme.divider }]}
              >
                <Feather name="clock" size={20} color={theme.text} />
                <ThemedText type="bodyMedium" style={styles.addFromText}>
                  Add from Used Items
                </ThemedText>
                <Feather
                  name={showRecentItems ? "chevron-up" : "chevron-down"}
                  size={20}
                  color={theme.textSecondary}
                />
              </Pressable>

              {showRecentItems && recentlyUsedItems.length > 0 ? (
                <View style={styles.recentItemsList}>
                  {recentlyUsedItems.map((item) => (
                    <Pressable
                      key={item.id}
                      onPress={() => handleAddFromRecent(item.name)}
                      style={[styles.recentItem, { backgroundColor: theme.backgroundDefault }]}
                    >
                      <ThemedText type="body">{item.name}</ThemedText>
                      <Feather name="plus" size={18} color={theme.link} />
                    </Pressable>
                  ))}
                </View>
              ) : null}

              <Pressable
                onPress={() => setShowAddModal(true)}
                style={[styles.addFromButton, { borderColor: theme.divider }]}
              >
                <Feather name="plus" size={20} color={theme.text} />
                <ThemedText type="bodyMedium" style={styles.addFromText}>
                  Add Item Manually
                </ThemedText>
              </Pressable>
            </Animated.View>
          </>
        )}
      </ScrollView>

      <AddItemModal
        visible={showAddModal}
        onClose={() => setShowAddModal(false)}
        onAdd={handleAddItem}
        mode="shopping"
      />

      <ConfirmationModal
        visible={confirmAction !== null}
        title={confirmModalProps.title}
        message={confirmModalProps.message}
        confirmLabel={confirmModalProps.confirmLabel}
        onConfirm={handleConfirm}
        onCancel={() => setConfirmAction(null)}
        testID="confirm-modal"
      />
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
  title: {
    marginBottom: Spacing.xl,
  },
  section: {
    marginBottom: Spacing.xl,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    letterSpacing: 0.5,
  },
  clearButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.sm,
  },
  addSection: {
    marginTop: Spacing.md,
    gap: Spacing.md,
  },
  addFromButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
  },
  addFromText: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  recentItemsList: {
    gap: Spacing.sm,
  },
  recentItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.md,
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing["5xl"],
  },
  emptyTitle: {
    marginTop: Spacing.lg,
    marginBottom: Spacing.sm,
  },
  addFirstButton: {
    marginTop: Spacing.xl,
    paddingHorizontal: Spacing["3xl"],
  },
});
