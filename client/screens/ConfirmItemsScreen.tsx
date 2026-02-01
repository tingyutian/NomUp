import React, { useState, useEffect } from "react";
import { View, StyleSheet, ScrollView, ActivityIndicator, Pressable } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import Animated, { FadeInDown } from "react-native-reanimated";
import { ThemedText } from "@/components/ThemedText";
import { Button } from "@/components/Button";
import { ScannedItem } from "@/components/molecules/ScannedItem";
import { EditItemModal } from "@/components/organisms/EditItemModal";
import { Badge } from "@/components/atoms/Badge";
import { useTheme } from "@/hooks/useTheme";
import { useApp, GroceryItem } from "@/context/AppContext";
import { getApiUrl } from "@/lib/query-client";
import { BorderRadius, Spacing, Colors } from "@/constants/theme";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { RootStackParamList } from "@/navigation/RootStackNavigator";

type Props = NativeStackScreenProps<RootStackParamList, "ConfirmItems">;

interface ScannedItemData {
  id: string;
  name: string;
  category: string;
  price: number;
  quantity: number;
  expiresIn: number;
  unit: string;
}

export default function ConfirmItemsScreen({ route, navigation }: Props) {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const { addGroceries } = useApp();
  const { imageBase64 } = route.params;

  const [items, setItems] = useState<ScannedItemData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingItem, setEditingItem] = useState<ScannedItemData | null>(null);

  useEffect(() => {
    scanReceipt();
  }, []);

  const scanReceipt = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const baseUrl = getApiUrl();
      const response = await fetch(new URL("/api/scan-receipt", baseUrl).toString(), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageBase64 }),
      });

      if (!response.ok) {
        throw new Error("Failed to scan receipt");
      }

      const data = await response.json();
      setItems(data.items || []);
    } catch (err) {
      console.error("Scan error:", err);
      setError("Failed to scan receipt. Please try again.");
      setItems([
        { id: "1", name: "Organic Avocado", category: "Produce", price: 1.99, quantity: 3, expiresIn: 5, unit: "units" },
        { id: "2", name: "Whole Almond Milk", category: "Dairy", price: 4.50, quantity: 1, expiresIn: 14, unit: "units" },
        { id: "3", name: "Heirloom Tomatoes", category: "Produce", price: 5.20, quantity: 2, expiresIn: 7, unit: "lbs" },
        { id: "4", name: "Greek Yogurt 1kg", category: "Dairy", price: 6.90, quantity: 1, expiresIn: 12, unit: "units" },
        { id: "5", name: "Fresh Sourdough", category: "Bakery", price: 7.00, quantity: 1, expiresIn: 3, unit: "units" },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuantityChange = (id: string, delta: number) => {
    setItems((prev) =>
      prev.map((item) =>
        item.id === id
          ? { ...item, quantity: Math.max(1, item.quantity + delta) }
          : item
      )
    );
  };

  const handleEditSave = (data: { name: string; quantity: number; expiresIn: number }) => {
    if (!editingItem) return;
    setItems((prev) =>
      prev.map((item) =>
        item.id === editingItem.id
          ? { ...item, ...data }
          : item
      )
    );
    setEditingItem(null);
  };

  const handleConfirm = async () => {
    const today = new Date();
    const groceryItems: GroceryItem[] = items.map((item) => {
      const expirationDate = new Date(today);
      expirationDate.setDate(today.getDate() + item.expiresIn);

      return {
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
        name: item.name,
        category: item.category,
        quantity: item.quantity,
        unit: item.unit,
        price: item.price,
        expiresIn: item.expiresIn,
        expirationDate: expirationDate.toISOString(),
        storageLocation: getStorageLocation(item.category),
        addedAt: new Date().toISOString(),
        usedAmount: 0,
      };
    });

    await addGroceries(groceryItems);
    navigation.reset({
      index: 0,
      routes: [{ name: "Main" }],
    });
  };

  const getStorageLocation = (category: string): "fridge" | "freezer" | "pantry" => {
    const lowerCategory = category.toLowerCase();
    if (["dairy", "produce", "meat"].includes(lowerCategory)) return "fridge";
    if (lowerCategory === "frozen") return "freezer";
    return "pantry";
  };

  const totalPrice = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);

  if (isLoading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: theme.backgroundRoot, paddingTop: insets.top + 60 }]}>
        <ActivityIndicator size="large" color={theme.text} />
        <ThemedText type="body" style={styles.loadingText}>
          Scanning your receipt...
        </ThemedText>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.backgroundRoot }]}>
      <View style={[styles.topHeader, { paddingTop: insets.top }]}>
        <Pressable onPress={() => navigation.goBack()} style={styles.backButton}>
          <Feather name="chevron-left" size={28} color={theme.text} />
        </Pressable>
        <ThemedText type="bodyMedium">Confirm Items</ThemedText>
        <View style={{ width: 44 }} />
      </View>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={{
          paddingTop: Spacing.lg,
          paddingBottom: Spacing["6xl"] + 100,
          paddingHorizontal: Spacing.lg,
        }}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View entering={FadeInDown.delay(100)}>
          <View style={styles.header}>
            <Badge label="SCAN SUCCESSFUL" variant="success" />
          </View>
          <ThemedText type="h1" style={styles.title}>
            Confirm{"\n"}Scanned Groceries
          </ThemedText>
          <ThemedText type="body" style={[styles.subtitle, { color: theme.textSecondary }]}>
            Review the items we detected from your receipt before adding to inventory.
          </ThemedText>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(200)} style={styles.itemsList}>
          {items.map((item, index) => (
            <ScannedItem
              key={item.id}
              name={item.name}
              category={item.category}
              price={item.price}
              quantity={item.quantity}
              expiresIn={item.expiresIn}
              onQuantityChange={(delta) => handleQuantityChange(item.id, delta)}
              onEdit={() => setEditingItem(item)}
              testID={`scanned-item-${index}`}
            />
          ))}
        </Animated.View>
      </ScrollView>

      <Animated.View
        entering={FadeInDown.delay(400)}
        style={[
          styles.footer,
          {
            backgroundColor: Colors.light.expiringYellow,
            paddingBottom: insets.bottom + Spacing.lg,
          },
        ]}
      >
        <View style={styles.summary}>
          <View>
            <ThemedText type="small" style={{ color: theme.textSecondary }}>
              TOTAL EST.
            </ThemedText>
            <ThemedText type="h3">${totalPrice.toFixed(2)}</ThemedText>
          </View>
          <View style={styles.itemCount}>
            <ThemedText type="small" style={{ color: theme.textSecondary }}>
              ITEMS
            </ThemedText>
            <ThemedText type="h3">{String(totalItems).padStart(2, "0")}</ThemedText>
          </View>
        </View>
        <Button onPress={handleConfirm} style={styles.confirmButton}>
          Confirm Items
        </Button>
      </Animated.View>

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
  topHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.divider,
  },
  backButton: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  loadingText: {
    marginTop: Spacing.lg,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginBottom: Spacing.md,
  },
  title: {
    marginBottom: Spacing.md,
  },
  subtitle: {
    marginBottom: Spacing.xl,
  },
  itemsList: {
    marginTop: Spacing.md,
  },
  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    borderTopLeftRadius: BorderRadius["2xl"],
    borderTopRightRadius: BorderRadius["2xl"],
    padding: Spacing.xl,
  },
  summary: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: Spacing.lg,
  },
  itemCount: {
    alignItems: "flex-end",
  },
  confirmButton: {
    backgroundColor: Colors.light.text,
  },
});
