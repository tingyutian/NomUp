import React, { useState, useMemo } from "react";
import { View, StyleSheet, FlatList, Pressable, ActivityIndicator } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import Animated, { FadeInDown } from "react-native-reanimated";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useMutation } from "@tanstack/react-query";
import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { useApp, GroceryItem } from "@/context/AppContext";
import { getApiUrl, apiRequest } from "@/lib/query-client";
import { Spacing, BorderRadius, Colors } from "@/constants/theme";
import type { RootStackParamList } from "@/navigation/RootStackNavigator";

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

interface ExpiringItemCardProps {
  item: GroceryItem;
  isSelected: boolean;
  onToggle: () => void;
  index: number;
}

function ExpiringItemCard({ item, isSelected, onToggle, index }: ExpiringItemCardProps) {
  const { theme } = useTheme();

  return (
    <Animated.View entering={FadeInDown.delay(index * 50).duration(200)}>
      <Pressable
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          onToggle();
        }}
        style={[
          styles.itemCard,
          { backgroundColor: theme.backgroundDefault },
          isSelected && { borderColor: theme.text, borderWidth: 2 },
        ]}
        testID={`expiring-item-${index}`}
      >
        <View style={styles.itemContent}>
          <ThemedText type="bodyMedium" numberOfLines={1}>
            {item.name}
          </ThemedText>
          <ThemedText type="small" style={{ color: theme.textSecondary }}>
            {item.quantity} {item.unit}
          </ThemedText>
        </View>
        <View style={styles.expiryBadge}>
          <ThemedText
            type="caption"
            style={{
              color: item.expiresIn <= 2 ? Colors.light.expiredRed : Colors.light.expiringOrange,
            }}
          >
            {item.expiresIn <= 0
              ? "Expired"
              : item.expiresIn === 1
              ? "1 day"
              : `${item.expiresIn} days`}
          </ThemedText>
        </View>
        <View
          style={[
            styles.checkbox,
            { borderColor: theme.divider },
            isSelected && { backgroundColor: theme.text, borderColor: theme.text },
          ]}
        >
          {isSelected ? <Feather name="check" size={14} color={theme.buttonText} /> : null}
        </View>
      </Pressable>
    </Animated.View>
  );
}

export default function RecipeSuggestionScreen() {
  const { theme } = useTheme();
  const navigation = useNavigation<NavigationProp>();
  const headerHeight = useHeaderHeight();
  const insets = useSafeAreaInsets();
  const { groceries } = useApp();

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const expiringItems = useMemo(() => {
    return groceries
      .filter((item) => item.expiresIn <= 5)
      .sort((a, b) => a.expiresIn - b.expiresIn);
  }, [groceries]);

  const selectedItems = useMemo(() => {
    return expiringItems.filter((item) => selectedIds.has(item.id));
  }, [expiringItems, selectedIds]);

  const pantryItems = useMemo(() => {
    return groceries.map((g) => ({ name: g.name, category: g.category }));
  }, [groceries]);

  const generateMutation = useMutation({
    mutationFn: async () => {
      const expiringIngredients = selectedItems.map((item) => ({
        id: item.id,
        name: item.name,
        quantity: item.quantity,
        unit: item.unit,
        daysUntilExpiration: item.expiresIn,
      }));

      const response = await apiRequest("POST", "/api/generate-recipe", {
        expiringIngredients,
        pantryItems,
      });

      return response.json();
    },
    onSuccess: (data) => {
      if (data.recipes && data.recipes.length > 0) {
        navigation.navigate("RecipeResults", {
          recipes: data.recipes,
          selectedIngredients: selectedItems.map((i) => ({ id: i.id, name: i.name })),
        });
      }
    },
  });

  const toggleItem = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const selectAll = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (selectedIds.size === expiringItems.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(expiringItems.map((i) => i.id)));
    }
  };

  const handleGenerateRecipes = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    generateMutation.mutate();
  };

  const renderHeader = () => (
    <View style={styles.header}>
      <Animated.View entering={FadeInDown.delay(0).duration(300)}>
        <ThemedText type="h2" style={styles.title}>
          What would you like to cook?
        </ThemedText>
        <ThemedText type="body" style={{ color: theme.textSecondary, marginBottom: Spacing.lg }}>
          Select ingredients you want to use up
        </ThemedText>
      </Animated.View>

      <Animated.View
        entering={FadeInDown.delay(100).duration(300)}
        style={styles.sectionHeader}
      >
        <ThemedText type="h4">Expiring Ingredients</ThemedText>
        <Pressable onPress={selectAll} testID="button-select-all">
          <ThemedText type="bodyMedium" style={{ color: theme.textSecondary }}>
            {selectedIds.size === expiringItems.length ? "Deselect All" : "Select All"}
          </ThemedText>
        </Pressable>
      </Animated.View>
    </View>
  );

  const renderEmpty = () => (
    <View style={styles.emptyState}>
      <Feather name="package" size={48} color={theme.textSecondary} />
      <ThemedText type="body" style={{ color: theme.textSecondary, textAlign: "center", marginTop: Spacing.md }}>
        No items expiring soon.{"\n"}Your pantry is looking fresh!
      </ThemedText>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.backgroundRoot }]}>
      <FlatList
        data={expiringItems}
        keyExtractor={(item) => item.id}
        renderItem={({ item, index }) => (
          <ExpiringItemCard
            item={item}
            isSelected={selectedIds.has(item.id)}
            onToggle={() => toggleItem(item.id)}
            index={index}
          />
        )}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={renderEmpty}
        contentContainerStyle={[
          styles.listContent,
          { paddingTop: headerHeight + Spacing.lg, paddingBottom: 100 + insets.bottom },
        ]}
        showsVerticalScrollIndicator={false}
      />

      {selectedIds.size > 0 ? (
        <Animated.View
          entering={FadeInDown.duration(200)}
          style={[styles.footer, { paddingBottom: insets.bottom + Spacing.md }]}
        >
          <Pressable
            onPress={handleGenerateRecipes}
            disabled={generateMutation.isPending}
            style={[
              styles.generateButton,
              { backgroundColor: theme.text },
              generateMutation.isPending && styles.buttonDisabled,
            ]}
            testID="button-generate-recipes"
          >
            {generateMutation.isPending ? (
              <ActivityIndicator color={theme.buttonText} />
            ) : (
              <>
                <Feather name="zap" size={20} color={theme.buttonText} />
                <ThemedText type="bodyMedium" style={{ color: theme.buttonText }}>
                  Get Recipe Ideas ({selectedIds.size} items)
                </ThemedText>
              </>
            )}
          </Pressable>
        </Animated.View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: Spacing.lg,
  },
  header: {
    marginBottom: Spacing.md,
  },
  title: {
    marginBottom: Spacing.xs,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: Spacing.xl,
    marginBottom: Spacing.md,
  },
  itemCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.sm,
    borderWidth: 1,
    borderColor: "transparent",
  },
  itemContent: {
    flex: 1,
  },
  expiryBadge: {
    marginRight: Spacing.md,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing["3xl"],
  },
  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    backgroundColor: "transparent",
  },
  generateButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing.lg,
    borderRadius: BorderRadius.lg,
    gap: Spacing.sm,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
});
