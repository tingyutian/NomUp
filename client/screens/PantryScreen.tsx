import React, { useState, useMemo, useCallback, useRef, useEffect } from "react";
import { View, StyleSheet, FlatList, Pressable, TextInput, ScrollView, Modal } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import Animated, { FadeInDown } from "react-native-reanimated";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { ThemedText } from "@/components/ThemedText";
import { SwipeableGroceryItem } from "@/components/molecules/SwipeableGroceryItem";
import { ExpiringCard } from "@/components/molecules/ExpiringCard";
import { ItemDetailModal } from "@/components/organisms/ItemDetailModal";
import { DeleteConfirmModal } from "@/components/organisms/DeleteConfirmModal";
import { ConfirmationBanner } from "@/components/atoms/ConfirmationBanner";
import { IconButton } from "@/components/atoms/IconButton";
import { useTheme } from "@/hooks/useTheme";
import { useApp, GroceryItem } from "@/context/AppContext";
import { BorderRadius, Spacing, Colors } from "@/constants/theme";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { PantryStackParamList } from "@/navigation/PantryStackNavigator";
import type { RootStackParamList } from "@/navigation/RootStackNavigator";

type Props = NativeStackScreenProps<PantryStackParamList, "PantryMain">;

type StorageTab = "fridge" | "freezer" | "pantry";
type SortOption = "expiration" | "category" | "recent";

type RootNavigationProp = NativeStackNavigationProp<RootStackParamList>;

export default function PantryScreen({ navigation }: Props) {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const tabBarHeight = useBottomTabBarHeight();
  const rootNavigation = useNavigation<RootNavigationProp>();
  const { 
    groceries, 
    addGroceries, 
    updateGrocery, 
    deleteGrocery,
    useGrocery,
    throwAwayGrocery,
    addToShoppingList,
  } = useApp();

  const [activeTab, setActiveTab] = useState<StorageTab>("fridge");
  const [sortBy, setSortBy] = useState<SortOption>("expiration");
  const [showSortDropdown, setShowSortDropdown] = useState(false);
  
  const [selectedItem, setSelectedItem] = useState<GroceryItem | null>(null);
  const [showItemModal, setShowItemModal] = useState(false);

  useEffect(() => {
    if (selectedItem) {
      const updated = groceries.find(g => g.id === selectedItem.id);
      if (updated) {
        setSelectedItem(updated);
      }
    }
  }, [groceries]);
  
  const [itemToDelete, setItemToDelete] = useState<GroceryItem | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  
  const [showBanner, setShowBanner] = useState(false);
  const [bannerMessage, setBannerMessage] = useState("");
  
  const hasAnimatedRef = useRef(false);

  const expiringItems = useMemo(() => {
    return groceries
      .filter((item) => item.expiresIn <= 5)
      .sort((a, b) => a.expiresIn - b.expiresIn)
      .slice(0, 5);
  }, [groceries]);

  const filteredAndSortedGroceries = useMemo(() => {
    let filtered = groceries.filter((item) => item.storageLocation === activeTab);

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
  }, [groceries, activeTab, sortBy]);

  const handleItemPress = (item: GroceryItem) => {
    setSelectedItem(item);
    setShowItemModal(true);
  };

  const handleDeleteRequest = (item: GroceryItem) => {
    setItemToDelete(item);
    setShowDeleteConfirm(true);
  };

  const handleConfirmDelete = async () => {
    if (itemToDelete) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      await deleteGrocery(itemToDelete.id);
      setItemToDelete(null);
      setShowDeleteConfirm(false);
    }
  };

  const handleLogConsumption = async (id: string, amount: number) => {
    await useGrocery(id, amount);
  };

  const handleUsedAll = async (id: string) => {
    await useGrocery(id, 10);
  };

  const handleThrewAway = async (id: string) => {
    await throwAwayGrocery(id);
  };

  const handleEdit = async (
    id: string, 
    data: { name: string; category: string; expiresIn: number; quantity: number; storageLocation: "fridge" | "freezer" | "pantry" }
  ) => {
    const today = new Date();
    const expirationDate = new Date(today);
    expirationDate.setDate(today.getDate() + data.expiresIn);

    await updateGrocery(id, {
      name: data.name,
      category: data.category,
      quantity: data.quantity,
      expiresIn: data.expiresIn,
      expirationDate: expirationDate.toISOString(),
      storageLocation: data.storageLocation,
    });
  };

  const handleAddToShoppingList = async (item: GroceryItem) => {
    await addToShoppingList({
      name: item.name,
      quantity: 1,
      unit: item.unit,
    });
    setBannerMessage(`${item.name} added to shopping list`);
    setShowBanner(true);
  };

  const handleExpiringCardPress = (item: GroceryItem) => {
    setSelectedItem(item);
    setShowItemModal(true);
  };

  const tabs: { key: StorageTab; label: string }[] = [
    { key: "fridge", label: "Fridge" },
    { key: "freezer", label: "Freezer" },
    { key: "pantry", label: "Pantry" },
  ];

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
      <Feather name="package" size={64} color={theme.textSecondary} />
      <ThemedText type="h4" style={[styles.emptyTitle, { color: theme.textSecondary }]}>
        {`No items in ${activeTab}`}
      </ThemedText>
      <ThemedText type="body" style={{ color: theme.textSecondary, textAlign: "center" }}>
        Scan a receipt or add items manually
      </ThemedText>
    </Animated.View>
  );

  const renderHeader = () => {
    const shouldAnimate = !hasAnimatedRef.current;
    if (!hasAnimatedRef.current) {
      hasAnimatedRef.current = true;
    }
    
    return (
    <>
      {expiringItems.length > 0 ? (
        <Animated.View entering={shouldAnimate ? FadeInDown.delay(100) : undefined}>
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
                onPress={() => handleExpiringCardPress(item)}
                testID={`expiring-card-${index}`}
              />
            ))}
          </ScrollView>
        </Animated.View>
      ) : null}

      <Animated.View entering={shouldAnimate ? FadeInDown.delay(200) : undefined} style={styles.tabsContainer}>
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
            testID={`tab-${tab.key}`}
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
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            setShowSortDropdown(true);
          }}
          style={styles.sortButton}
          testID="button-sort"
        >
          <ThemedText type="small" style={{ color: theme.textSecondary }}>
            Sort by: {sortOptions.find(o => o.key === sortBy)?.label}
          </ThemedText>
          <Feather 
            name="chevron-down" 
            size={16} 
            color={theme.textSecondary} 
          />
        </Pressable>
      </Animated.View>
    </>
  );
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.backgroundRoot }]}>
      <ConfirmationBanner
        visible={showBanner}
        message={bannerMessage}
        onHide={() => setShowBanner(false)}
        iconName="shopping-cart"
      />

      <FlatList
        data={filteredAndSortedGroceries}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{
          paddingTop: headerHeight + Spacing.lg,
          paddingBottom: tabBarHeight + Spacing.xl,
          paddingHorizontal: Spacing.lg,
        }}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={renderEmptyState}
        renderItem={({ item, index }) => (
          <Animated.View entering={FadeInDown.delay(100 + index * 30)} style={{ zIndex: 1 }}>
            <SwipeableGroceryItem
              item={item}
              onPress={() => handleItemPress(item)}
              onDelete={() => handleDeleteRequest(item)}
              testID={`pantry-item-${index}`}
            />
          </Animated.View>
        )}
        showsVerticalScrollIndicator={false}
        scrollIndicatorInsets={{ bottom: insets.bottom }}
        keyboardShouldPersistTaps="handled"
      />

      <ItemDetailModal
        visible={showItemModal}
        onClose={() => {
          setShowItemModal(false);
          setSelectedItem(null);
        }}
        item={selectedItem}
        onLogConsumption={handleLogConsumption}
        onUsedAll={handleUsedAll}
        onThrewAway={handleThrewAway}
        onEdit={handleEdit}
        onAddToShoppingList={handleAddToShoppingList}
      />

      <DeleteConfirmModal
        visible={showDeleteConfirm}
        onClose={() => {
          setShowDeleteConfirm(false);
          setItemToDelete(null);
        }}
        onConfirm={handleConfirmDelete}
        itemName={itemToDelete?.name || ""}
      />

      <Modal
        visible={showSortDropdown}
        transparent
        animationType="fade"
        onRequestClose={() => setShowSortDropdown(false)}
      >
        <Pressable 
          style={styles.sortModalOverlay} 
          onPress={() => setShowSortDropdown(false)}
        >
          <View style={[styles.sortModalContent, { backgroundColor: theme.backgroundDefault }]}>
            <ThemedText type="h4" style={styles.sortModalTitle}>Sort By</ThemedText>
            {sortOptions.map((option) => (
              <Pressable
                key={option.key}
                onPress={() => {
                  setSortBy(option.key);
                  setShowSortDropdown(false);
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }}
                style={[
                  styles.sortOption,
                  sortBy === option.key ? { backgroundColor: theme.backgroundSecondary } : undefined,
                ]}
                testID={`sort-option-${option.key}`}
              >
                <ThemedText type="body">{option.label}</ThemedText>
                {sortBy === option.key ? (
                  <Feather name="check" size={16} color={theme.text} />
                ) : null}
              </Pressable>
            ))}
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  sectionHeader: {
    marginBottom: Spacing.lg,
  },
  sectionTitle: {
    marginBottom: Spacing.xs,
  },
  expiringList: {
    paddingBottom: Spacing.xl,
    gap: Spacing.md,
  },
  tabsContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.divider,
    marginBottom: Spacing.lg,
    zIndex: 1000,
  },
  tab: {
    paddingVertical: Spacing.md,
    marginRight: Spacing.xl,
  },
  sortButton: {
    marginLeft: "auto",
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: Spacing.md,
    gap: Spacing.xs,
  },
  sortModalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    alignItems: "center",
    padding: Spacing.xl,
  },
  sortModalContent: {
    width: "100%",
    maxWidth: 300,
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 10,
  },
  sortModalTitle: {
    textAlign: "center",
    marginBottom: Spacing.md,
  },
  sortOption: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.md,
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
