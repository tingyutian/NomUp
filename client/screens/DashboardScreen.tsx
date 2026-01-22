import React, { useState, useMemo } from "react";
import { View, StyleSheet, FlatList, Pressable, ScrollView } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import Animated, { FadeInDown } from "react-native-reanimated";
import { Feather } from "@expo/vector-icons";
import { ThemedText } from "@/components/ThemedText";
import { GroceryItemCard } from "@/components/molecules/GroceryItem";
import { ExpiringCard } from "@/components/molecules/ExpiringCard";
import { AddItemModal } from "@/components/organisms/AddItemModal";
import { EditItemModal } from "@/components/organisms/EditItemModal";
import { useTheme } from "@/hooks/useTheme";
import { useApp, GroceryItem } from "@/context/AppContext";
import { BorderRadius, Spacing, Colors } from "@/constants/theme";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { HomeStackParamList } from "@/navigation/HomeStackNavigator";

type Props = NativeStackScreenProps<HomeStackParamList, "Dashboard">;

type StorageTab = "fridge" | "freezer" | "pantry";

export default function DashboardScreen({ navigation }: Props) {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const tabBarHeight = useBottomTabBarHeight();
  const { groceries, addGroceries, updateGrocery } = useApp();
  
  const [activeTab, setActiveTab] = useState<StorageTab>("fridge");
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingItem, setEditingItem] = useState<GroceryItem | null>(null);

  const expiringItems = useMemo(() => {
    return groceries
      .filter((item) => item.expiresIn <= 5)
      .sort((a, b) => a.expiresIn - b.expiresIn)
      .slice(0, 5);
  }, [groceries]);

  const filteredGroceries = useMemo(() => {
    return groceries
      .filter((item) => item.storageLocation === activeTab)
      .sort((a, b) => a.expiresIn - b.expiresIn);
  }, [groceries, activeTab]);

  const handleAddItem = async (data: any) => {
    const today = new Date();
    const expirationDate = new Date(today);
    expirationDate.setDate(today.getDate() + data.expiresIn);

    const newItem: GroceryItem = {
      id: Date.now().toString(),
      name: data.name,
      category: data.category,
      quantity: data.quantity,
      unit: data.unit,
      price: 0,
      expiresIn: data.expiresIn,
      expirationDate: expirationDate.toISOString(),
      storageLocation: data.storageLocation,
      addedAt: new Date().toISOString(),
      usedAmount: 0,
    };
    await addGroceries([newItem]);
  };

  const handleEditSave = async (data: { name: string; quantity: number; expiresIn: number }) => {
    if (!editingItem) return;
    
    const today = new Date();
    const expirationDate = new Date(today);
    expirationDate.setDate(today.getDate() + data.expiresIn);

    await updateGrocery(editingItem.id, {
      name: data.name,
      quantity: data.quantity,
      expiresIn: data.expiresIn,
      expirationDate: expirationDate.toISOString(),
    });
    setEditingItem(null);
  };

  const tabs: { key: StorageTab; label: string }[] = [
    { key: "fridge", label: "Fridge" },
    { key: "freezer", label: "Freezer" },
    { key: "pantry", label: "Pantry" },
  ];

  const renderEmptyState = () => (
    <Animated.View
      entering={FadeInDown.delay(200)}
      style={styles.emptyState}
    >
      <Feather name="package" size={64} color={theme.textSecondary} />
      <ThemedText type="h4" style={[styles.emptyTitle, { color: theme.textSecondary }]}>
        No items in {activeTab}
      </ThemedText>
      <ThemedText type="body" style={{ color: theme.textSecondary, textAlign: "center" }}>
        Scan a receipt or add items manually to get started
      </ThemedText>
    </Animated.View>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.backgroundRoot }]}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={{
          paddingTop: headerHeight + Spacing.lg,
          paddingBottom: tabBarHeight + Spacing.xl,
        }}
        showsVerticalScrollIndicator={false}
        scrollIndicatorInsets={{ bottom: insets.bottom }}
      >
        {expiringItems.length > 0 ? (
          <Animated.View entering={FadeInDown.delay(100)}>
            <View style={styles.sectionHeader}>
              <ThemedText type="h2" style={styles.sectionTitle}>
                Expiring Soon
              </ThemedText>
              <ThemedText type="small" style={{ color: theme.textSecondary }}>
                Don't let these fresh finds go to waste.
              </ThemedText>
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.expiringList}
            >
              {expiringItems.map((item, index) => (
                <ExpiringCard
                  key={item.id}
                  item={item}
                  onPress={() => setEditingItem(item)}
                  testID={`expiring-card-${index}`}
                />
              ))}
            </ScrollView>
          </Animated.View>
        ) : null}

        <Animated.View entering={FadeInDown.delay(200)} style={styles.inventorySection}>
          <View style={styles.tabsContainer}>
            {tabs.map((tab) => (
              <Pressable
                key={tab.key}
                onPress={() => setActiveTab(tab.key)}
                style={[
                  styles.tab,
                  activeTab === tab.key
                    ? { borderBottomColor: theme.text, borderBottomWidth: 2 }
                    : undefined,
                ]}
              >
                <ThemedText
                  type="bodyMedium"
                  style={{
                    color: activeTab === tab.key ? theme.text : theme.textSecondary,
                  }}
                >
                  {tab.label}
                </ThemedText>
              </Pressable>
            ))}
            <Pressable
              onPress={() => {}}
              style={styles.viewAllButton}
            >
              <ThemedText type="small" style={{ color: theme.textSecondary }}>
                VIEW ALL
              </ThemedText>
            </Pressable>
          </View>

          <View style={styles.groceryList}>
            {filteredGroceries.length > 0 ? (
              filteredGroceries.map((item, index) => (
                <GroceryItemCard
                  key={item.id}
                  item={item}
                  onPress={() => setEditingItem(item)}
                  onEdit={() => setEditingItem(item)}
                  showEdit
                  testID={`grocery-item-${index}`}
                />
              ))
            ) : (
              renderEmptyState()
            )}
          </View>
        </Animated.View>
      </ScrollView>

      <AddItemModal
        visible={showAddModal}
        onClose={() => setShowAddModal(false)}
        onAdd={handleAddItem}
        mode="grocery"
      />

      <EditItemModal
        visible={!!editingItem}
        onClose={() => setEditingItem(null)}
        onSave={handleEditSave}
        initialName={editingItem?.name}
        initialQuantity={editingItem?.quantity}
        initialExpiresIn={editingItem?.expiresIn}
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
  sectionHeader: {
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  sectionTitle: {
    marginBottom: Spacing.xs,
  },
  expiringList: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xl,
  },
  inventorySection: {
    paddingHorizontal: Spacing.lg,
  },
  tabsContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.divider,
    marginBottom: Spacing.lg,
  },
  tab: {
    paddingVertical: Spacing.md,
    marginRight: Spacing.xl,
  },
  viewAllButton: {
    marginLeft: "auto",
    paddingVertical: Spacing.md,
  },
  groceryList: {
    paddingBottom: Spacing.xl,
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing["5xl"],
    paddingHorizontal: Spacing.xl,
  },
  emptyTitle: {
    marginTop: Spacing.lg,
    marginBottom: Spacing.sm,
  },
});
