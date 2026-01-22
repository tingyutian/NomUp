import React, { useState, useMemo } from "react";
import { View, StyleSheet, FlatList, Pressable, TextInput } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import Animated, { FadeInDown } from "react-native-reanimated";
import { Feather } from "@expo/vector-icons";
import { ThemedText } from "@/components/ThemedText";
import { GroceryItemCard } from "@/components/molecules/GroceryItem";
import { AddItemModal } from "@/components/organisms/AddItemModal";
import { EditItemModal } from "@/components/organisms/EditItemModal";
import { IconButton } from "@/components/atoms/IconButton";
import { useTheme } from "@/hooks/useTheme";
import { useApp, GroceryItem } from "@/context/AppContext";
import { BorderRadius, Spacing, Colors } from "@/constants/theme";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { PantryStackParamList } from "@/navigation/PantryStackNavigator";

type Props = NativeStackScreenProps<PantryStackParamList, "PantryMain">;

type SortOption = "expiration" | "category" | "recent";

export default function PantryScreen({ navigation }: Props) {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const tabBarHeight = useBottomTabBarHeight();
  const { groceries, addGroceries, updateGrocery } = useApp();

  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<SortOption>("expiration");
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingItem, setEditingItem] = useState<GroceryItem | null>(null);

  const filteredAndSortedGroceries = useMemo(() => {
    let filtered = groceries;
    
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = groceries.filter(
        (item) =>
          item.name.toLowerCase().includes(query) ||
          item.category.toLowerCase().includes(query)
      );
    }

    return filtered.sort((a, b) => {
      switch (sortBy) {
        case "expiration":
          return a.expiresIn - b.expiresIn;
        case "category":
          return a.category.localeCompare(b.category);
        case "recent":
          return new Date(b.addedAt).getTime() - new Date(a.addedAt).getTime();
        default:
          return 0;
      }
    });
  }, [groceries, searchQuery, sortBy]);

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

  const sortOptions: { key: SortOption; label: string }[] = [
    { key: "expiration", label: "Expiration" },
    { key: "category", label: "Category" },
    { key: "recent", label: "Recent" },
  ];

  const renderEmptyState = () => (
    <Animated.View
      entering={FadeInDown.delay(200)}
      style={styles.emptyState}
    >
      <Feather name="box" size={64} color={theme.textSecondary} />
      <ThemedText type="h4" style={[styles.emptyTitle, { color: theme.textSecondary }]}>
        {searchQuery ? "No items found" : "Your pantry is empty"}
      </ThemedText>
      <ThemedText type="body" style={{ color: theme.textSecondary, textAlign: "center" }}>
        {searchQuery ? "Try a different search term" : "Scan a receipt or add items manually"}
      </ThemedText>
    </Animated.View>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.backgroundRoot }]}>
      <FlatList
        data={filteredAndSortedGroceries}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{
          paddingTop: headerHeight + Spacing.lg,
          paddingBottom: tabBarHeight + Spacing.xl,
          paddingHorizontal: Spacing.lg,
        }}
        ListHeaderComponent={
          <>
            <Animated.View entering={FadeInDown.delay(100)}>
              <ThemedText type="h1" style={styles.title}>
                All Items
              </ThemedText>
            </Animated.View>

            <Animated.View entering={FadeInDown.delay(200)} style={styles.searchContainer}>
              <Feather name="search" size={20} color={theme.textSecondary} />
              <TextInput
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholder="Search items..."
                placeholderTextColor={theme.textSecondary}
                style={[styles.searchInput, { color: theme.text }]}
              />
              <IconButton
                name="plus"
                size={20}
                onPress={() => setShowAddModal(true)}
                backgroundColor={theme.text}
                color={theme.buttonText}
                style={styles.addButton}
                testID="button-add-item"
              />
            </Animated.View>

            <Animated.View entering={FadeInDown.delay(300)} style={styles.sortContainer}>
              <ThemedText type="small" style={{ color: theme.textSecondary }}>
                Sort by:
              </ThemedText>
              <View style={styles.sortOptions}>
                {sortOptions.map((option) => (
                  <Pressable
                    key={option.key}
                    onPress={() => setSortBy(option.key)}
                    style={[
                      styles.sortOption,
                      {
                        backgroundColor:
                          sortBy === option.key
                            ? theme.text
                            : theme.backgroundDefault,
                      },
                    ]}
                  >
                    <ThemedText
                      type="small"
                      style={{
                        color: sortBy === option.key ? theme.buttonText : theme.text,
                      }}
                    >
                      {option.label}
                    </ThemedText>
                  </Pressable>
                ))}
              </View>
            </Animated.View>
          </>
        }
        ListEmptyComponent={renderEmptyState}
        renderItem={({ item, index }) => (
          <Animated.View entering={FadeInDown.delay(100 + index * 50)}>
            <GroceryItemCard
              item={item}
              onPress={() => setEditingItem(item)}
              onEdit={() => setEditingItem(item)}
              showEdit
              testID={`pantry-item-${index}`}
            />
          </Animated.View>
        )}
        showsVerticalScrollIndicator={false}
        scrollIndicatorInsets={{ bottom: insets.bottom }}
      />

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
  title: {
    marginBottom: Spacing.xl,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.light.backgroundDefault,
    borderRadius: BorderRadius.lg,
    paddingLeft: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  searchInput: {
    flex: 1,
    marginLeft: Spacing.md,
    paddingVertical: Spacing.md,
    fontSize: 16,
  },
  addButton: {
    width: 40,
    height: 40,
    margin: Spacing.xs,
  },
  sortContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: Spacing.xl,
  },
  sortOptions: {
    flexDirection: "row",
    marginLeft: Spacing.md,
    gap: Spacing.sm,
  },
  sortOption: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
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
});
