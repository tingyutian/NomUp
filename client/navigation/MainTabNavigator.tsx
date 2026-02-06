import React, { useState } from "react";
import { View, StyleSheet, Pressable, Modal } from "react-native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Feather } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import { Platform } from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import PantryStackNavigator from "@/navigation/PantryStackNavigator";
import ShoppingStackNavigator from "@/navigation/ShoppingStackNavigator";
import SavedStackNavigator from "@/navigation/SavedStackNavigator";
import { AddItemModal } from "@/components/organisms/AddItemModal";
import { useTheme } from "@/hooks/useTheme";
import { useApp, GroceryItem } from "@/context/AppContext";
import { Colors, Spacing, BorderRadius } from "@/constants/theme";
import type { RootStackParamList } from "@/navigation/RootStackNavigator";
import { ThemedText } from "@/components/ThemedText";

export type MainTabParamList = {
  PantryTab: undefined;
  SavedTab: undefined;
  ListTab: undefined;
};

const Tab = createBottomTabNavigator<MainTabParamList>();

function FloatingAddButton({ onAddManually }: { onAddManually: () => void }) {
  const { theme } = useTheme();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const insets = useSafeAreaInsets();
  const [showChoiceModal, setShowChoiceModal] = useState(false);

  return (
    <>
      <Pressable
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          setShowChoiceModal(true);
        }}
        style={[
          styles.floatingAddButton,
          { 
            backgroundColor: theme.text,
            bottom: 100 + insets.bottom,
          }
        ]}
        testID="floating-add-button"
      >
        <Feather name="plus" size={28} color={theme.buttonText} />
      </Pressable>

      <Modal
        visible={showChoiceModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowChoiceModal(false)}
      >
        <Pressable
          style={styles.choiceModalOverlay}
          onPress={() => setShowChoiceModal(false)}
        >
          <Pressable
            style={[styles.choiceModalContent, { backgroundColor: theme.backgroundDefault }]}
            onPress={(e) => e.stopPropagation()}
          >
            <ThemedText type="h4" style={styles.choiceModalTitle}>Add Items</ThemedText>

            <Pressable
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setShowChoiceModal(false);
                onAddManually();
              }}
              style={[styles.choiceOption, { borderColor: theme.divider }]}
              testID="button-add-manually"
            >
              <View style={[styles.choiceIconContainer, { backgroundColor: theme.backgroundSecondary }]}>
                <Feather name="edit-3" size={22} color={theme.text} />
              </View>
              <View style={styles.choiceTextContainer}>
                <ThemedText type="bodyMedium">Add Manually</ThemedText>
                <ThemedText type="small" style={{ color: theme.textSecondary }}>
                  Enter item details yourself
                </ThemedText>
              </View>
              <Feather name="chevron-right" size={20} color={theme.textSecondary} />
            </Pressable>

            <Pressable
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setShowChoiceModal(false);
                navigation.navigate("ScanReceipt");
              }}
              style={[styles.choiceOption, { borderColor: theme.divider }]}
              testID="button-scan-receipt"
            >
              <View style={[styles.choiceIconContainer, { backgroundColor: theme.backgroundSecondary }]}>
                <Feather name="camera" size={22} color={theme.text} />
              </View>
              <View style={styles.choiceTextContainer}>
                <ThemedText type="bodyMedium">Scan Receipt</ThemedText>
                <ThemedText type="small" style={{ color: theme.textSecondary }}>
                  Use your camera to scan
                </ThemedText>
              </View>
              <Feather name="chevron-right" size={20} color={theme.textSecondary} />
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

function ShoppingBadge({ count }: { count: number }) {
  if (count === 0) return null;
  
  return (
    <View style={styles.badge}>
      <ThemedText type="caption" style={styles.badgeText}>
        {count > 99 ? "99+" : count}
      </ThemedText>
    </View>
  );
}

export default function MainTabNavigator() {
  const { theme, isDark } = useTheme();
  const { shoppingList, addGroceries } = useApp();
  const uncheckedCount = shoppingList.filter((item) => !item.checked).length;
  const [showAddModal, setShowAddModal] = useState(false);

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
      unitAmount: data.unitAmount || 1,
      price: 0,
      expiresIn: data.expiresIn,
      expirationDate: expirationDate.toISOString(),
      storageLocation: data.storageLocation,
      addedAt: new Date().toISOString(),
      usedAmount: 0,
    };
    await addGroceries([newItem]);
  };

  return (
    <View style={{ flex: 1 }}>
      <Tab.Navigator
        initialRouteName="PantryTab"
        screenOptions={{
          tabBarActiveTintColor: theme.tabIconSelected,
          tabBarInactiveTintColor: theme.tabIconDefault,
          tabBarStyle: {
            position: "absolute",
            backgroundColor: Platform.select({
              ios: "transparent",
              android: Colors.light.backgroundRoot,
            }),
            borderTopWidth: 0,
            elevation: 0,
            height: 80,
          },
          tabBarBackground: () =>
            Platform.OS === "ios" ? (
              <BlurView
                intensity={100}
                tint={isDark ? "dark" : "light"}
                style={StyleSheet.absoluteFill}
              />
            ) : null,
          headerShown: false,
          tabBarLabelStyle: {
            fontSize: 11,
            fontWeight: "500",
          },
        }}
      >
        <Tab.Screen
          name="PantryTab"
          component={PantryStackNavigator}
          options={{
            title: "PANTRY",
            tabBarIcon: ({ color, size }) => (
              <Feather name="box" size={size} color={color} />
            ),
          }}
        />
        <Tab.Screen
          name="SavedTab"
          component={SavedStackNavigator}
          options={{
            title: "SAVED MENU",
            tabBarIcon: ({ color, size }) => (
              <Feather name="heart" size={size} color={color} />
            ),
          }}
        />
        <Tab.Screen
          name="ListTab"
          component={ShoppingStackNavigator}
          options={{
            title: "SHOPPING LIST",
            tabBarIcon: ({ color, size }) => (
              <View>
                <Feather name="list" size={size} color={color} />
                <ShoppingBadge count={uncheckedCount} />
              </View>
            ),
          }}
        />
      </Tab.Navigator>
      <FloatingAddButton onAddManually={() => setShowAddModal(true)} />
      <AddItemModal
        visible={showAddModal}
        onClose={() => setShowAddModal(false)}
        onAdd={handleAddItem}
        mode="grocery"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  floatingAddButton: {
    position: "absolute",
    right: Spacing.lg,
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
    zIndex: 100,
  },
  badge: {
    position: "absolute",
    top: -4,
    right: -8,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: Colors.light.expiredRed,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 4,
  },
  badgeText: {
    color: "#FFF",
    fontSize: 10,
    fontWeight: "700",
    lineHeight: 12,
  },
  choiceModalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "flex-end",
    padding: Spacing.lg,
  },
  choiceModalContent: {
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    paddingBottom: Spacing.xl,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 10,
  },
  choiceModalTitle: {
    textAlign: "center",
    marginBottom: Spacing.lg,
  },
  choiceOption: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: Spacing.lg,
    borderBottomWidth: 1,
  },
  choiceIconContainer: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.md,
    alignItems: "center",
    justifyContent: "center",
    marginRight: Spacing.md,
  },
  choiceTextContainer: {
    flex: 1,
  },
});
